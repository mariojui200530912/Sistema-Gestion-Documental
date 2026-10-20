const mongoose = require('mongoose');
const Archivo = require('../models/Archivo');
const Usuario = require('../models/Usuario');

const LIMITE_MAXIMO = process.env.LIMITE_CUOTA_BYTES;

const calcularCuota = async (usuarioId) => {
    const resultado = await Archivo.aggregate([
        { 
            $match: { 
                propietario_id: new mongoose.Types.ObjectId(usuarioId), 
                estado: 'activo' 
            } 
        },
        { 
            $group: { 
                _id: null, 
                totalUsado: { $sum: "$tamano" } 
            } 
        }
    ]);
    
    return resultado.length > 0 ? resultado[0].totalUsado : 0;
};

const validarSubida = async (req, res, next) => {
    try {
        const nombre = req.headers['x-archivo-nombre'];
        const tamano = parseInt(req.headers['x-archivo-tamano']) || 0;
        const carpetaId = req.headers['x-carpeta-id'] || null;
        const usuarioId = req.usuario.id;

        if (!nombre) {
            return res.status(400).json({ mensaje: 'Faltan metadatos del archivo' });
        }

        const archivoExistente = await Archivo.findOne({
            nombre: nombre,
            carpeta_id: carpetaId,
            propietario_id: usuarioId,
            estado: 'activo'
        });

        if (archivoExistente) {
            return res.status(400).json({ mensaje: 'Ya existe un archivo con ese nombre en esta carpeta' });
        }

        const cuotaUsada = await calcularCuota(usuarioId);
        
        if (cuotaUsada + tamano > LIMITE_MAXIMO) {
            const limiteMB = (LIMITE_MAXIMO / (1024 * 1024)).toFixed(0);
            const usadoMB = (cuotaUsada / (1024 * 1024)).toFixed(2);
            return res.status(400).json({ 
                mensaje: `Cuota excedida. Tu límite es de ${limiteMB}MB y ya has usado ${usadoMB}MB.` 
            });
        }

        next();

    } catch (error) {
        console.error('Error en pre-validación:', error);
        res.status(500).json({ mensaje: 'Error al validar la subida' });
    }
};

module.exports = validarSubida;