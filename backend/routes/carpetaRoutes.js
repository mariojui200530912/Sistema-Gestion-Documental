const express = require('express');
const router = express.Router();
const carpetaController = require('../controllers/carpetaController');
const authMiddleware = require('../middlewares/authMiddleware');

// Todas las rutas de carpetas requieren que el usuario esté autenticado
router.use(authMiddleware);

// Rutas GET
router.get('/todas', authMiddleware, carpetaController.obtenerTodasLasCarpetas);
router.get('/', carpetaController.obtenerRaiz);
router.get('/:id', carpetaController.obtenerCarpeta);

// Rutas POST
router.post('/', carpetaController.crearCarpeta);

// Rutas PUT (Actualizaciones)
router.put('/:id/renombrar', carpetaController.renombrarCarpeta);
router.put('/:id/mover', carpetaController.moverCarpeta);
router.post('/:id/comentarios', carpetaController.agregarComentario);

module.exports = router;