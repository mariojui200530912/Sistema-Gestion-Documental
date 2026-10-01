const mongoose = require('mongoose');

const archivoSchema = new mongoose.Schema({
    nombre: { type: String, required: true },
    propietario_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
    carpeta_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Carpeta', default: null },
    gridfs_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    estado: { type: String, enum: ['activo', 'papelera'], default: 'activo' },
    tamano: { type: Number, required: true },
    tipo_archivo: { type: String, required: true },
    accesos: [accesoSchema]
}, { timestamps: true });

module.exports = mongoose.model('Archivo', archivoSchema);