const mongoose = require('mongoose');

const accesoSchema = new mongoose.Schema({
    usuario_id : { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
    nivel_permiso: { type: String, enum: ['lectura', 'edicion', 'comentar'], required: true }
}, { _id: false });

module.exports = accesoSchema;