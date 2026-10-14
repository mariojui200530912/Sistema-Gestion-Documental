const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');

// Ruta para crear un usuario: POST /api/usuarios
router.post('/', usuarioController.registrarUsuario);
router.post('/login', usuarioController.autenticarUsuario);

router.use(authMiddleware);

// Rutas exclusivas para Administrador
router.get('/', adminMiddleware, usuarioController.obtenerUsuarios);
router.delete('/:id', adminMiddleware, usuarioController.eliminarUsuario); 

// Rutas de uso mixto 
router.get('/:id', usuarioController.obtenerUsuario);
router.put('/:id', usuarioController.actualizarUsuario);

module.exports = router;
