const express = require('express');
const router = express.Router();
const reporteController = require('../controllers/reporteController');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');

router.use(authMiddleware);
router.use(adminMiddleware); // Todos los reportes requieren ser administrador

router.get('/archivos', reporteController.reporteArchivos);
router.get('/usuarios', reporteController.reporteUsuarios);
router.get('/comparticion', reporteController.reporteComparticion);
router.get('/actividad', reporteController.reporteActividad);

module.exports = router;