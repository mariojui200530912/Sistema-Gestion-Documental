const express = require('express');
const router = express.Router();
const papeleraController = require('../controllers/papeleraController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

router.get('/', papeleraController.obtenerPapelera);
router.post('/estado', papeleraController.cambiarEstado);
router.post('/eliminar', papeleraController.eliminarDefinitivo);

module.exports = router;