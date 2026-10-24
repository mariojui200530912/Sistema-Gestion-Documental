const mongoose = require('mongoose');
const accesoSchema = require('./Acceso');

const carpetaSchema = new mongoose.Schema({
    nombre: { type: String, required: true },
    propietario_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
    carpeta_padre_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Carpeta', default: null },
    estado: { type: String, enum: ['activo', 'papelera'], default: 'activo' },
    accesos: [accesoSchema],
    comentarios: [{
        usuario_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
        texto: { type: String, required: true },
        fecha: { type: Date, default: Date.now }
    }],
}, { timestamps: true });

module.exports = mongoose.model('Carpeta', carpetaSchema);