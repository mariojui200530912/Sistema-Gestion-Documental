const mongoose = require('mongoose');
const Carpeta = require('../models/Carpeta');
const Archivo = require('../models/Archivo');
const HistorialActividad = require('../models/HistorialActividad');

class CarpetaService {
    async obtenerRaiz(usuario_id) {
        const carpetas = await Carpeta.find({
            propietario_id: usuario_id,
            carpeta_padre_id: null,
            estado: 'activo'
        });
        const archivos = await Archivo.find({
            propietario_id: usuario_id,
            carpeta_id: null,
            estado: 'activo'
        });
        return { carpetas, archivos };
    }

    async obtenerContenido(carpetaId, usuarioId) {
        const carpeta = await Carpeta.findOne({
            _id: carpetaId,
            estado: 'activo',
            $or: [
                { propietario_id: usuarioId },
                { 'accesos.usuario_id': usuarioId } 
            ]
        });

        if (!carpeta) throw new Error('CARPETA_NO_ENCONTRADA');

        const subcarpetas = await Carpeta.find({ carpeta_padre_id: carpetaId, estado: 'activo' });
        const archivos = await Archivo.find({ carpeta_id: carpetaId, estado: 'activo' });

        return { carpetaActual: carpeta, carpetas: subcarpetas, archivos };
    }

    async obtenerTodas(usuarioId){
        const carpetas = await Carpeta.find({
            propietario_id: usuarioId,
            estado: 'activo'
        })
        .select('_id nombre carpeta_padre_id')
        .lean();

        const mapaCarpetas = {};
        carpetas.forEach(c => {
            mapaCarpetas[c._id.toString()] = c;
        });

        const carpetasConRuta = carpetas.map(carpeta => {
            let ruta = carpeta.nombre;
            let padreId = carpeta.carpeta_padre_id;

            while (padreId && mapaCarpetas[padreId.toString()]) {
                const padre = mapaCarpetas[padreId.toString()];
                ruta = padre.nombre + ' / ' + ruta; // Concatenamos el nombre del padre
                padreId = padre.carpeta_padre_id;
            }

            return {
                _id: carpeta._id,
                nombre: ruta, // Reemplazamos el nombre simple por la ruta completa jerárquica
                carpeta_id: carpeta.carpeta_id
            };
        });

        carpetasConRuta.sort((a, b) => a.nombre.localeCompare(b.nombre));

        return carpetasConRuta;
    }

    async crear(nombre, carpetaPadreId, usuarioId) {
        if (carpetaPadreId) {
            const carpetaPadre = await Carpeta.findOne({
                _id: carpetaPadreId,
                estado: 'activo',
                $or: [
                    { propietario_id: usuarioId },
                    { accesos: { $elemMatch: { usuario_id: usuarioId, nivel_permiso: 'edicion' } } }
                ]
            });
            if (!carpetaPadre) throw new Error('CARPETA_PADRE_INVALIDA');
        }

        const carpetaExistente = await Carpeta.findOne({
            nombre: nombre,
            carpeta_padre_id: carpetaPadreId || null,
            propietario_id: usuarioId,
            estado: 'activo'
        });

        if (carpetaExistente) {
            throw new Error('NOMBRE_DUPLICADO');
        }

        const session = await mongoose.startSession();
        session.startTransaction();
        try{
            const nuevaCarpeta = new Carpeta({
                nombre,
                propietario_id: usuarioId,
                carpeta_padre_id: carpetaPadreId || null
            });

            await nuevaCarpeta.save({ session });

            await HistorialActividad.create([{
                usuario_id: usuarioId,
                recurso_id: nuevaCarpeta._id,
                tipo_recurso: 'carpeta',
                accion: 'creacion',
                detalles: `Carpeta creada: ${nombre}`
            }], { session });

            await session.commitTransaction();
            session.endSession();

            return nuevaCarpeta;
        }catch (error){
            await session.abortTransaction();
            session.endSession();
            throw error;
        }
    }

    async renombrar(idCarpeta, nuevoNombre, usuarioId) {
        const carpeta = await Carpeta.findOne({
            _id: carpetaId,
            estado: 'activo',
            $or: [
                { propietario_id: usuarioId },
                { accesos: { $elemMatch: { usuario_id: usuarioId, nivel_permiso: 'edicion' } } }
            ]
        });
        if (!carpeta) throw new Error('CARPETA_NO_ENCONTRADA');

        if (carpeta.nombre === nuevoNombre) return carpeta;

        const carpetaExistente = await Carpeta.findOne({
            nombre: nuevoNombre,
            carpeta_padre_id: carpeta.carpeta_padre_id, // Buscamos en el mismo nivel
            propietario_id: usuarioId,
            estado: 'activo'
        });

        if (carpetaExistente) {
            throw new Error('NOMBRE_DUPLICADO');
        }

        const session = await mongoose.startSession();
        session.startTransaction();
        try{
            carpeta.nombre = nuevoNombre;
            await carpeta.save({ session });

            await HistorialActividad.create([{
                usuario_id: usuarioId, recurso_id: carpeta._id, tipo_recurso: 'carpeta',
                accion: 'edicion', detalles: `Carpeta renombrada a ${nuevoNombre}`
            }], { session });

            await session.commitTransaction();
            session.endSession();

            return carpeta;
        } catch (error){
            await session.abortTransaction();
            session.endSession();
            throw error;
        }
    }

    async mover(idCarpeta, nuevaCarpetaPadreId, usuarioId) {
        const carpeta = await Carpeta.findOne({
            _id: carpetaId,
            estado: 'activo',
            $or: [
                { propietario_id: usuarioId },
                { accesos: { $elemMatch: { usuario_id: usuarioId, nivel_permiso: 'edicion' } } }
            ]
        });
        if (!carpetaMover) throw new Error('CARPETA_NO_ENCONTRADA');

        // Regla de negocio: No se puede mover a la misma carpeta donde ya esta
        if (String(carpetaMover.carpeta_padre_id) === String(nuevaCarpetaPadreId)) {
            return carpetaMover; // No hay cambios, retornamos silenciosamente
        }

        // Regla de negocio: Prevenir ciclos verificando el árbol hacia arriba
        if (nuevaCarpetaPadreId) {
            if (String(idCarpeta) === String(nuevaCarpetaPadreId)) {
                throw new Error('CICLO_DETECTADO'); // No puede meterse dentro de sí misma
            }

            let ancestro = await Carpeta.findById(nuevaCarpetaPadreId);
            while (ancestro) {
                if (String(ancestro._id) === String(idCarpeta)) {
                    throw new Error('CICLO_DETECTADO'); // No puede meterse dentro de una subcarpeta propia
                }
                if (!ancestro.carpeta_padre_id) break;
                ancestro = await Carpeta.findById(ancestro.carpeta_padre_id);
            }
        }

        const carpetaExistente = await Carpeta.findOne({
            nombre: carpetaMover.nombre, // Usamos el nombre de la carpeta que estamos moviendo
            carpeta_padre_id: nuevaCarpetaPadreId || null,
            propietario_id: usuarioId,
            estado: 'activo'
        });

        if (carpetaExistente) {
            throw new Error('NOMBRE_DUPLICADO_DESTINO');
        }

        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            carpetaMover.carpeta_padre_id = nuevaCarpetaPadreId || null;
            await carpetaMover.save({ session });

            await HistorialActividad.create([{
                usuario_id: usuarioId, recurso_id: carpetaMover._id, tipo_recurso: 'carpeta',
                accion: 'edicion', detalles: 'Carpeta movida de ubicación'
            }], {session});
            await session.commitTransaction();
            session.endSession();

            return carpetaMover;
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            throw error;
        }
    }
}

module.exports = new CarpetaService();