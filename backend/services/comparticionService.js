const mongoose = require('mongoose');
const Archivo = require('../models/Archivo');
const Carpeta = require('../models/Carpeta');
const HistorialActividad = require('../models/HistorialActividad');
const Usuario = require('../models/Usuario');

class ComparticionService {
    // Metodo privado para compartir permisos en cascada
    async _compartirRecursivo(idCarpeta, beneficiarioId, nivelPermiso, session) {
        // Agregar el acceso a los archivos que NO lo tienen
        await Archivo.updateMany(
            { carpeta_id: idCarpeta, 'accesos.usuario_id': { $ne: beneficiarioId }, estado: 'activo' },
            { $push: { accesos: { usuario_id: beneficiarioId, nivel_permiso: nivelPermiso } } },
            { session }
        );

        // Actualizar el nivel de permiso a los archivos que YA lo tienen
        await Archivo.updateMany(
            { carpeta_id: idCarpeta, 'accesos.usuario_id': beneficiarioId, estado: 'activo' },
            { $set: { 'accesos.$.nivel_permiso': nivelPermiso } },
            { session }
        );

        // Buscar subcarpetas 
        const subcarpetas = await Carpeta.find({ carpeta_padre_id: idCarpeta, estado: 'activo' }).session(session);
        
        // Agregar el acceso a las subcarpetas que NO lo tienen
        await Carpeta.updateMany(
            { carpeta_padre_id: idCarpeta, 'accesos.usuario_id': { $ne: beneficiarioId }, estado: 'activo' },
            { $push: { accesos: { usuario_id: beneficiarioId, nivel_permiso: nivelPermiso } } },
            { session }
        );

        // Actualizar el nivel de permiso a las subcarpetas que YA lo tienen
        await Carpeta.updateMany(
            { carpeta_padre_id: idCarpeta, 'accesos.usuario_id': beneficiarioId, estado: 'activo' },
            { $set: { 'accesos.$.nivel_permiso': nivelPermiso } },
            { session }
        );

        // Continuar la recursividad
        for (const subcarpeta of subcarpetas) {
            await this._compartirRecursivo(subcarpeta._id, beneficiarioId, nivelPermiso, session);
        }
    }

    // Metodo privado para quitar permisos en cascada
    async _revocarRecursivo(idCarpeta, idUsuarioRevocar, session) {
        // Elimina el acceso de todos los archivos de esta carpeta en una sola consulta
        await Archivo.updateMany(
            { carpeta_id: idCarpeta },
            { $pull: { accesos: { usuario_id: idUsuarioRevocar } } },
            { session }
        );

        const subcarpetas = await Carpeta.find({ carpeta_padre_id: idCarpeta }).session(session);
        
        // Elimina el acceso de todas las subcarpetas directas en una sola consulta
        await Carpeta.updateMany(
            { carpeta_padre_id: idCarpeta },
            { $pull: { accesos: { usuario_id: idUsuarioRevocar } } },
            { session }
        );

        // Continuar descendiendo
        for (const subcarpeta of subcarpetas) {
            await this._revocarRecursivo(subcarpeta._id, idUsuarioRevocar, session);
        }
    }

    async compartir(idRecurso, tipoRecurso, correoBeneficiario, nivelPermiso, propietarioId) {
        if(!['carpeta', 'archivo'].includes(tipoRecurso)) throw new Error('TIPO_INVALIDO');
        if(!['lectura', 'edicion', 'comentar'].includes(nivelPermiso)) throw new Error('PERMISO_INVALIDO');

        const beneficiario = await Usuario.findOne({ correo: correoBeneficiario });
        if(!beneficiario) throw new Error('BENEFICIARIO_NO_ENCONTRADO');
        if(beneficiario._id.equals(propietarioId)) throw new Error('AUTO_COMPARTIR');

        const Modelo = tipoRecurso === 'carpeta' ? Carpeta : Archivo;
        const recurso = await Modelo.findOne({ _id: idRecurso, propietario_id: propietarioId, estado: 'activo' });

        if(!recurso) throw new Error('RECURSO_NO_ENCONTRADO');

        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const indiceAcceso = recurso.accesos.findIndex(acceso => acceso.usuario_id.equals(beneficiario._id));

            if (indiceAcceso >= 0) {
                recurso.accesos[indiceAcceso].nivel_permiso = nivelPermiso;
            } else {
                recurso.accesos.push({ usuario_id: beneficiario._id, nivel_permiso: nivelPermiso });
            }

            await recurso.save({ session });

            if (tipoRecurso === 'carpeta') {
                await this._compartirRecursivo(recurso._id, beneficiario._id, nivelPermiso, session);
            }

            await HistorialActividad.create([{
                usuario_id: propietarioId,
                recurso_id: recurso._id,
                tipo_recurso: tipoRecurso,
                accion: 'compartir',
                detalles: `Compartido con ${correoBeneficiario} (${nivelPermiso})`
            }], { session });

            await session.commitTransaction();
            session.endSession();

            return recurso.accesos;

        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            throw error;
        }
    }

    async revocar(idRecurso, tipoRecurso, idUsuarioRevocar, propietarioId) {
        const Modelo = tipoRecurso === 'archivo' ? Archivo : Carpeta;
        const recurso = await Modelo.findOne({ _id: idRecurso, propietario_id: propietarioId });

        if (!recurso) throw new Error('RECURSO_NO_ENCONTRADO');

        const accesosIniciales = recurso.accesos.length;
        recurso.accesos = recurso.accesos.filter(a => a.usuario_id.toString() !== idUsuarioRevocar);

        if (recurso.accesos.length === accesosIniciales) {
            throw new Error('ACCESO_INEXISTENTE');
        }

        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            await recurso.save({ session });

            if (tipoRecurso === 'carpeta') {
                await this._revocarRecursivo(recurso._id, idUsuarioRevocar, session);
            }

            await session.commitTransaction();
            session.endSession();

        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            throw error;
        }
    }

    async obtenerCompartidosConmigo(miId) {
        const archivos = await Archivo.find({ 'accesos.usuario_id': miId, estado: 'activo' })
                                      .populate('propietario_id', 'nombres apellidos correo');
                                      
        const carpetas = await Carpeta.find({ 'accesos.usuario_id': miId, estado: 'activo' })
                                      .populate('propietario_id', 'nombres apellidos correo');

        return { carpetas, archivos };
    }

    async obtenerAccesos(idRecurso, tipoRecurso, propietarioId) {
        if (!['carpeta', 'archivo'].includes(tipoRecurso)) throw new Error('TIPO_INVALIDO');

        const Modelo = tipoRecurso === 'carpeta' ? Carpeta : Archivo;
        
        const recurso = await Modelo.findOne({ _id: idRecurso, propietario_id: propietarioId })
                                    .populate('accesos.usuario_id', 'nombres apellidos correo');

        if (!recurso) throw new Error('RECURSO_NO_ENCONTRADO');

        return recurso.accesos;
    }
}

module.exports = new ComparticionService();