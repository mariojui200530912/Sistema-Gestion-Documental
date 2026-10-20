const Archivo = require('../models/Archivo');
const Carpeta = require('../models/Carpeta');
const HistorialActividad = require('../models/HistorialActividad');
const Usuario = require('../models/Usuario');

class ComparticionService {
    // Metodo privado para compartir permisos en cascada
    async _compartirRecursivo(idCarpeta, beneficiarioId, nivelPermiso) {
        const archivos = await Archivo.find({ carpeta_id: idCarpeta, estado: 'activo' });
        for (const archivo of archivos) {
            const indice = archivo.accesos.findIndex(a => a.usuario_id.equals(beneficiarioId));
            if (indice >= 0) {
                archivo.accesos[indice].nivel_permiso = nivelPermiso;
            } else {
                archivo.accesos.push({ usuario_id: beneficiarioId, nivel_permiso: nivelPermiso });
            }
            await archivo.save();
        }

        const subcarpetas = await Carpeta.find({ carpeta_padre_id: idCarpeta, estado: 'activo' });
        for (const subcarpeta of subcarpetas) {
            const indice = subcarpeta.accesos.findIndex(a => a.usuario_id.equals(beneficiarioId));
            if (indice >= 0) {
                subcarpeta.accesos[indice].nivel_permiso = nivelPermiso;
            } else {
                subcarpeta.accesos.push({ usuario_id: beneficiarioId, nivel_permiso: nivelPermiso });
            }
            await subcarpeta.save();
            await this._compartirRecursivo(subcarpeta._id, beneficiarioId, nivelPermiso);
        }
    }

    // Metodo privado para quitar permisos en cascada
    async _revocarRecursivo(idCarpeta, idUsuarioRevocar) {
        const archivos = await Archivo.find({ carpeta_id: idCarpeta });
        for (const archivo of archivos) {
            archivo.accesos = archivo.accesos.filter(a => a.usuario_id.toString() !== idUsuarioRevocar.toString());
            await archivo.save();
        }

        const subcarpetas = await Carpeta.find({ carpeta_padre_id: idCarpeta });
        for (const subcarpeta of subcarpetas) {
            subcarpeta.accesos = subcarpeta.accesos.filter(a => a.usuario_id.toString() !== idUsuarioRevocar.toString());
            await subcarpeta.save();
            
            await this._revocarRecursivo(subcarpeta._id, idUsuarioRevocar);
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

        const indiceAcceso = recurso.accesos.findIndex(acceso => acceso.usuario_id.equals(beneficiario._id));

        if (indiceAcceso >= 0) {
            recurso.accesos[indiceAcceso].nivel_permiso = nivelPermiso;
        } else {
            recurso.accesos.push({ usuario_id: beneficiario._id, nivel_permiso: nivelPermiso });
        }

        await recurso.save();

        // Si es una carpeta, compartimos recursivamente
        if (tipoRecurso === 'carpeta') {
            await this._compartirRecursivo(recurso._id, beneficiario._id, nivelPermiso);
        }

        await HistorialActividad.create({
            usuario_id: propietarioId,
            recurso_id: recurso._id,
            tipo_recurso: tipoRecurso,
            accion: 'compartir',
            detalles: `Compartido con ${correoBeneficiario} (${nivelPermiso})`
        });

        return recurso.accesos;
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

        await recurso.save();

        // Si el recurso es una carpeta, revocar también en cascada
        if (tipoRecurso === 'carpeta') {
            await this._revocarRecursivo(recurso._id, idUsuarioRevocar);
        }
    }

    async obtenerCompartidosConmigo(miId) {
        // Buscamos donde el usuario exista dentro del arreglo embebido 'accesos'
        const archivos = await Archivo.find({ 'accesos.usuario_id': miId, estado: 'activo' })
                                      .populate('propietario_id', 'nombres apellidos correo');
                                      
        const carpetas = await Carpeta.find({ 'accesos.usuario_id': miId, estado: 'activo' })
                                      .populate('propietario_id', 'nombres apellidos correo');

        return { carpetas, archivos };
    }
}

module.exports = new ComparticionService();