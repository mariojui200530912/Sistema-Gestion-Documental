const mongoose = require('mongoose');
const Carpeta = require('../models/Carpeta');
const Archivo = require('../models/Archivo');
const HistorialActividad = require('../models/HistorialActividad');
const Usuario = require('../models/Usuario');

class PapeleraService {
    
    async obtener(usuarioId) {
        const carpetas = await Carpeta.find({ propietario_id: usuarioId, estado: 'papelera' });
        const archivos = await Archivo.find({ propietario_id: usuarioId, estado: 'papelera' });
        return { carpetas, archivos };
    }

    async cambiarEstado(id, tipo, accion, usuarioId) {
        if (!['archivo', 'carpeta'].includes(tipo) || !['papelera', 'activo'].includes(accion)) {
            throw new Error('PARAMETROS_INVALIDOS');
        }

        let elemento;
        if (tipo === 'archivo') {
            elemento = await Archivo.findOneAndUpdate(
                { _id: id, propietario_id: usuarioId },
                { estado: accion },
                { new: true }
            );
        } else {
            elemento = await Carpeta.findOneAndUpdate(
                { _id: id, propietario_id: usuarioId },
                { estado: accion },
                { new: true }
            );
        }

        if (!elemento) throw new Error('ELEMENTO_NO_ENCONTRADO');

        await HistorialActividad.create({
            usuario_id: usuarioId,
            recurso_id: elemento._id,
            tipo_recurso: tipo,
            accion: accion === 'papelera' ? 'eliminacion' : 'restauracion'
        });

        return elemento;
    }

    async _eliminarCarpetaRecursivamente(carpetaId, usuarioId) {
        const archivos = await Archivo.find({ carpeta_id: carpetaId });
        const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: 'fs' });

        for (const archivo of archivos) {
            await bucket.delete(archivo.gridfs_id);
            await Usuario.findByIdAndUpdate(usuarioId, { $inc: { espacioUtilizado: -archivo.tamano } });
            await Archivo.findByIdAndDelete(archivo._id);
        }
        // buscar subcarpetas y eliminarlas recursivamente
        const subcarpetas = await Carpeta.find({ carpeta_padre_id: carpetaId });
        for (const subcarpeta of subcarpetas) {
            await this._eliminarCarpetaRecursivamente(subcarpeta._id, usuarioId);
        }
        await Carpeta.findByIdAndDelete(carpetaId);
    }

    async eliminarDefinitivo(id, tipo, usuarioId) {
        if (tipo === 'carpeta') {
            const carpeta = await Carpeta.findOne({ _id: id, propietario_id: usuarioId, estado: 'papelera' });
            if (!carpeta) throw new Error('ELEMENTO_NO_ENCONTRADO');
            await this._eliminarCarpetaRecursivamente(carpeta._id, usuarioId);
            return carpeta;
            
        } else if (tipo === 'archivo') {
            const archivo = await Archivo.findOne({ _id: id, propietario_id: usuarioId, estado: 'papelera' });
            if (!archivo) throw new Error('ELEMENTO_NO_ENCONTRADO');

            // Eliminar archivo fisico de GridFS
            const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: 'fs' });
            await bucket.delete(archivo.gridfs_id);

            // Liberar espacio de almacenamiento del usuario
            await Usuario.findByIdAndUpdate(usuarioId, { $inc: { espacioUtilizado: -archivo.tamano } });

            // Eliminar el documento de la coleccion Archivos
            await Archivo.findByIdAndDelete(archivo._id);
            
            return archivo;
        } else {
            throw new Error('TIPO_INVALIDO');
        }
    }
}

module.exports = new PapeleraService();