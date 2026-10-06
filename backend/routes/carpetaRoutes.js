const express = require('express');
const router = express.Router();
const carpetaController = require('../controllers/carpetaController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware); // Aplica el middleware de autenticación a todas las rutas de este router

router.post('/', carpetaController.crearCarpeta);
router.get('/:id', carpetaController.obtenerContenido);

module.exports = router;