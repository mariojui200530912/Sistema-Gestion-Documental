const mongoose = require('mongoose');
const accesoSchema = require('./Acceso');

const carpetaSchema = new mongoose.Schema({
    nombre: { type: String, required: true },
    propietario_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
    carpeta_padre_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Carpeta', default: null },
    estado: { type: String, enum: ['activo', 'papelera'], default: 'activo' },
    accesos: [accesoSchema]
}, { timestamps: true });

module.exports = mongoose.model('Carpeta', carpetaSchema);