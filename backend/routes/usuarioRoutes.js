const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');

// Ruta para crear un usuario: POST /api/usuarios
router.post('/', usuarioController.registrarUsuario);
router.post('/login', usuarioController.autenticarUsuario);

module.exports = router;