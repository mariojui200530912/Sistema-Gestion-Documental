const mongoose = require('mongoose');
const Carpeta = require('../models/Carpeta');
const Archivo = require('../models/Archivo');
const HistorialActividad = require('../models/HistorialActividad');
const Usuario = require('../models/Usuario');

exports.obtenerPapelera = async (req, res) => {
    try {
        const usuarioId = req.usuario._id; // Obtén el ID del usuario desde el token de autenticación
        const carpetas = await Carpeta.find({ usuario: usuarioId, estado: 'papelera' });
        const archivos = await Archivo.find({ usuario: usuarioId, estado: 'papelera' });
        
        res.json({mensaje: 'Papelera obtenida correctamente', contenido: { carpetas, archivos } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al obtener la papelera.' });
    }
};

exports.cambiarEstado = async (req, res) => {
    try {
        const {id, tipo, accion } = req.body;
        const usuarioId = req.usuario._id; 
        if (!['carpeta', 'archivo'].includes(tipo) || !['papelera', 'activo'].includes(accion)) {
            return res.status(400).json({ mensaje: 'Tipo o acción inválida.' });
        }
        let elemento;
        if (tipo === 'carpeta') {
            elemento = await Carpeta.findOneAndUpdate(
                { _id: id, propietario_id: usuarioId }, 
                { estado: accion }, 
                { new: true }
            );
        } else {
            elemento = await Archivo.findOneAndUpdate(
                { _id: id, propietario_id: usuarioId }, 
                { estado: accion }, 
                { new: true }
            );
        }
        if(!elemento) {
            return res.status(404).json({ mensaje: 'Elemento no encontrado o no pertenece al usuario.' });
        }

        await HistorialActividad.create({
            usuario_id: usuarioId,
            recurso_id: elemento._id,
            tipo_recurso: tipo,
            accion: accion === 'papelera' ? 'eliminacion' : 'restauracion',
        });
        res.json({ mensaje: `Elemento cambiado a estado ${accion} correctamente.`, elemento });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al cambiar el estado del elemento.' });
    }
};

exports.eliminarDefinitivo = async (req, res) => {
    try {
        const {id, tipo } = req.body;
        const usuarioId = req.usuario._id;

        if (tipo === 'carpeta') {
            const carpeta = await Carpeta.findOneAndDelete({ _id: id, propietario_id: usuarioId, estado: 'papelera' });
            if (!carpeta) {
                return res.status(404).json({ mensaje: 'Carpeta no encontrada o no pertenece al usuario.' });
            }
            res.json({ mensaje: 'Carpeta eliminada definitivamente.' });
        }else if (tipo === 'archivo') {
            const archivo = await Archivo.findOneAndDelete({ _id: id, propietario_id: usuarioId, estado: 'papelera' });
            if (!archivo){
                return res.status(404).json({ mensaje: 'Archivo no encontrado o no pertenece al usuario.' });
            }
            const bucket = mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: 'fs' });
            await bucket.delete(archivo.gridFs_id);
            await Usuario.findByIdAndUpdate(usuarioId, { $inc: { espacio_utilizado: -archivo.tamano } });
            await Archivo.findByIdAndDelete(id);
            res.json({ mensaje: 'Archivo eliminado definitivamente y espacio liberado.' });
        }else{
            return res.status(400).json({ mensaje: 'Tipo inválido. Debe ser "carpeta" o "archivo".' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al eliminar el elemento definitivamente.' });
    }
};