const mongoose = require('mongoose');
const Archivo = require('../models/Archivo');
const Carpeta = require('../models/Carpeta');
const Usuario = require('../models/Usuario');
const HistorialActividad = require('../models/HistorialActividad');

class ArchivoService {
    async crearArchivo(file, carpetaId, usuarioId) {
        if (carpetaId) {
            const carpetaDestino = await Carpeta.findOne({
                _id: carpetaId,
                estado: 'activo',
                $or: [
                    { propietario_id: usuarioId },
                    { accesos: { $elemMatch: { usuario_id: usuarioId, nivel_permiso: 'edicion' } } }
                ]
            });
            if (!carpetaDestino) throw new Error('CARPETA_DESTINO_INVALIDA_O_SIN_PERMISO');
        }

        const archivoExistente = await Archivo.findOne({
            nombre: file.originalname,
            carpeta_id: carpetaId || null,
            propietario_id: usuarioId,
            estado: 'activo'
        });

        if (archivoExistente) {
            throw new Error('NOMBRE_DUPLICADO');
        }
        
        const usuario = await Usuario.findById(usuarioId);
        const session = await mongoose.startSession();
        session.startTransaction();
        try{
            const nuevoArchivo = new Archivo({
                nombre: file.filename,
                propietario_id: usuarioId,
                carpeta_id: carpetaId || null,
                gridfs_id: file.id,
                tamano: file.size,
                tipo_archivo: file.mimetype,
            });

            await nuevoArchivo.save({ session });
            usuario.espacioUtilizado += file.size;
            await usuario.save({ session });

            await HistorialActividad.create([{
                usuario_id: usuarioId,
                recurso_id: nuevoArchivo._id,
                tipo_recurso: 'archivo',
                accion: 'creacion',
                detalle: `Archivo ${nuevoArchivo.nombre} subido a la carpeta ${carpetaId || 'raíz'}`,
            }], {session});
            await session.commitTransaction();
            session.endSession();

            return nuevoArchivo;
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            throw error;
        }
    }


    async descargarArchivo(archivoId, usuarioId) {
        const archivo = await Archivo.findOne({
            _id: archivoId,
            estado: 'activo',
            $or: [
                { propietario_id: usuarioId },
                { 'accesos.usuario_id': usuarioId } 
            ]
        });
        if (!archivo) {
            throw new Error('ARCHIVO_NO_ENCONTRADO');
        }

        const esPropietario = archivo.propietario_id.toString() === usuarioId;
        const tienePermiso = await archivo.accesos.some(a => a.usuario_id.toString() === usuarioId);

        if (!esPropietario && !tienePermiso) {
            throw new Error('PERMISO_DENEGADO');
        }

        const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: 'fs' });
        const stream = bucket.openDownloadStream(archivo.gridfs_id);

        await HistorialActividad.create({
            usuario_id: usuarioId,
            recurso_id: archivo._id,
            tipo_recurso: 'archivo',
            accion: 'descarga',
            detalle: `Archivo ${archivo.nombre} descargado`,
        });

        return { metadata: archivo, stream };
    }

    async renombrar(idArchivo, nuevoNombre, usuarioId) {
        const archivo = await Archivo.findOne({
            _id: idArchivo,
            estado: 'activo',
            $or: [
                { propietario_id: usuarioId },
                { accesos: { $elemMatch: { usuario_id: usuarioId, nivel_permiso: 'edicion' } } }
            ]
        });
        if (!archivo) throw new Error('ARCHIVO_NO_ENCONTRADO');
        if (archivo.nombre === nuevoNombre) return archivo;

        const esPropietario = archivo.propietario_id.toString() === usuarioId;
        const puedeEditar = archivo.accesos.some(a => a.usuario_id.toString() === usuarioId && a.nivel_permiso === 'edicion');

        if (!esPropietario && !puedeEditar) throw new Error('PERMISO_DENEGADO');

        if (!nuevoNombre.endsWith('.txt') && !nuevoNombre.endsWith('.md')) {
            throw new Error('EXTENSION_INVALIDA');
        }

        const archivoExistente = await Archivo.findOne({
            nombre: nuevoNombre,
            carpeta_id: archivo.carpeta_id, // Buscamos en la misma carpeta
            propietario_id: usuarioId,
            estado: 'activo'
        });

        if (archivoExistente) {
            throw new Error('NOMBRE_DUPLICADO');
        }

        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            archivo.nombre = nuevoNombre;
            await archivo.save({ session });
            
            await HistorialActividad.create([{
                usuario_id: usuarioId, 
                recurso_id: archivo._id, 
                tipo_recurso: 'archivo',
                accion: 'edicion', 
                detalles: `Renombrado a ${nuevoNombre}`
            }], { session });

            await session.commitTransaction();
            session.endSession();

            return archivo;
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            throw error;
        }
    }

    async mover(idArchivo, nuevaCarpetaId, usuarioId) {
        const archivo = await Archivo.findOne({
            _id: idArchivo,
            estado: 'activo',
            $or: [
                { propietario_id: usuarioId },
                { accesos: { $elemMatch: { usuario_id: usuarioId, nivel_permiso: 'edicion' } } }
            ]
        });
        if (!archivo) throw new Error('ARCHIVO_NO_ENCONTRADO');

        if (nuevaCarpetaId) {
            const carpetaDestino = await Carpeta.findOne({ _id: nuevaCarpetaId, propietario_id: usuarioId });
            if (!carpetaDestino) throw new Error('CARPETA_DESTINO_INVALIDA');
        }

        const archivoExistente = await Archivo.findOne({
            nombre: archivo.nombre,
            carpeta_id: nuevaCarpetaId || null,
            propietario_id: usuarioId,
            estado: 'activo'
        });

        if (archivoExistente) {
            throw new Error('NOMBRE_DUPLICADO_DESTINO');
        }

        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            archivo.carpeta_id = nuevaCarpetaId || null;
            await archivo.save({ session });

            await HistorialActividad.create([{
                usuario_id: usuarioId, recurso_id: archivo._id, tipo_recurso: 'archivo',
                accion: 'edicion', detalles: 'Archivo movido'
            }], { session });
            await session.commitTransaction();
            session.endSession();

            return archivo;
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            throw error;
        }
    }

    async agregarComentario(archivoId, usuarioActual, texto) {
        const archivo = await Archivo.findById(archivoId);
        
        if (!archivo) {
            throw new Error('ARCHIVO_NO_ENCONTRADO');
        }

        // Validar permisos (Propietario, edicion o comentar)
        const esPropietario = archivo.propietario_id.toString() === usuarioActual;
        const acceso = archivo.accesos.find(a => a.usuario_id.toString() === usuarioActual);
        const tienePermiso = esPropietario || (acceso && ['edicion', 'comentar'].includes(acceso.nivel_permiso));

        if (!tienePermiso) {
            throw new Error('PERMISO_DENEGADO');
        }

        // Agregar comentario embebido
        archivo.comentarios.push({
            usuario_id: usuarioActual,
            texto: texto
        });

        await archivo.save();

        // Registrar en historial
        await HistorialActividad.create({
            usuario_id: usuarioActual,
            accion: 'comentar',
            tipo_recurso: 'archivo',
            recurso_id: archivo._id
        });

        // Devolver los comentarios actualizados con los datos del usuario poblados
        const archivoActualizado = await Archivo.findById(archivoId)
            .populate('comentarios.usuario_id', 'nombres apellidos correo');
            
        return archivoActualizado.comentarios;
    }
}

module.exports = new ArchivoService();