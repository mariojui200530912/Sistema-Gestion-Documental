const mongoose = require('mongoose');

const historialActividadSchema = new mongoose.Schema({
    usuario_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
    recurso_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    tipo_recurso: { type: String, enum: ['archivo', 'carpeta'], required: true },
    accion: { type: String, 
        enum: ['creacion', 'lectura', 'edicion', 'eliminacion', 'restauracion', 'compartir', 'descarga'], 
        required: true 
    },
    detalles: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('HistorialActividad', historialActividadSchema);