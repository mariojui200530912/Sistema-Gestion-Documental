const express = require('express');
const router = express.Router();

const usuariosRouter = require('./usuarioRoutes');
const archivosRouter = require('./archivoRoutes');
const carpetasRouter = require('./carpetaRoutes');
const papeleraRouter = require('./papeleraRoutes');
const comparticionRouter = require('./comparticionRoutes');
const reporteRouter = require('./reporteRoutes');

router.use('/usuarios', usuariosRouter);
router.use('/archivos', archivosRouter);
router.use('/carpetas', carpetasRouter);
router.use('/papelera', papeleraRouter);
router.use('/compartir', comparticionRouter);
router.use('/reportes', reporteRouter);

module.exports = router;