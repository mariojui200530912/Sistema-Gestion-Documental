const mongoose = require('mongoose');

const usuarioSchema = new mongoose.Schema({
    nombres: {type: String, required: true},
    apellidos: {type: String, required: true},
    correo: {type: String, required: true, unique: true},
    contrasena: {type: String, required: true},
    espacioAsignado: { type: Number, default: 1073741824 },
    espacioUtilizado: { type: Number, default: 0 },
    estado: { type: String, enum: ['activo', 'inactivo'], default: 'activo' },
    rol: { type: String, enum: ['administrador', 'usuario'], default: 'usuario' }
}, { timestamps: true });

module.exports = mongoose.model('Usuario', usuarioSchema);