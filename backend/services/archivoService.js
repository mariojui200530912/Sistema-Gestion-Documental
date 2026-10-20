const mongoose = require('mongoose');
const Archivo = require('../models/Archivo');
const Carpeta = require('../models/Carpeta');
const Usuario = require('../models/Usuario');
const HistorialActividad = require('../models/HistorialActividad');

class ArchivoService {
    async crearArchivo(file, carpetaId, usuarioId) {
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
        if (usuario.espacioUtilizado + file.size > usuario.espacioAsignado) {
            const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: 'fs' });
            await bucket.delete(file.id);
            throw new Error('CUOTA_EXCEDIDA');
        }
        const nuevoArchivo = new Archivo({
            nombre: file.filename,
            propietario_id: usuarioId,
            carpeta_id: carpetaId || null,
            gridfs_id: file.id,
            tamano: file.size,
            tipo_archivo: file.mimetype,
        });

        await nuevoArchivo.save();
        usuario.espacioUtilizado += file.size;
        await usuario.save();

        await HistorialActividad.create({
            usuario_id: usuarioId,
            recurso_id: nuevoArchivo._id,
            tipo_recurso: 'archivo',
            accion: 'creacion',
            detalle: `Archivo ${nuevoArchivo.nombre} subido a la carpeta ${carpetaId || 'raíz'}`,
        });
        return nuevoArchivo;
    }



    async descargarArchivo(archivoId, usuarioId) {
        const archivo = await Archivo.findByOne({ _id: archivoId, estado: 'activo' });
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
        const archivo = await Archivo.findOne({ _id: idArchivo, estado: 'activo' });
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

        archivo.nombre = nuevoNombre;
        await archivo.save();

        await HistorialActividad.create({
            usuario_id: usuarioId, 
            recurso_id: archivo._id, 
            tipo_recurso: 'archivo',
            accion: 'edicion', 
            detalles: `Renombrado a ${nuevoNombre}`
        });

        return archivo;
    }

    async mover(idArchivo, nuevaCarpetaId, usuarioId) {
        const archivo = await Archivo.findOne({ _id: idArchivo, propietario_id: usuarioId, estado: 'activo' });
        if (!archivo) throw new Error('ARCHIVO_NO_ENCONTRADO');

        if (nuevaCarpetaId) {
            const carpetaDestino = await Carpeta.findOne({ _id: nuevaCarpetaId, propietario_id: usuarioId });
            if (!carpetaDestino) throw new Error('CARPETA_DESTINO_INVALIDA');
        }

        const archivoExistente = await Archivo.findOne({
            nombre: archivoMover.nombre,
            carpeta_id: nuevaCarpetaId || null,
            propietario_id: usuarioId,
            estado: 'activo'
        });

        if (archivoExistente) {
            throw new Error('NOMBRE_DUPLICADO_DESTINO');
        }

        archivo.carpeta_id = nuevaCarpetaId || null;
        await archivo.save();

        await HistorialActividad.create({
            usuario_id: usuarioId, recurso_id: archivo._id, tipo_recurso: 'archivo',
            accion: 'edicion', detalles: 'Archivo movido'
        });

        return archivo;
    }
}

module.exports = new ArchivoService();