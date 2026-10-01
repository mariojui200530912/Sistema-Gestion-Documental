const express = require('express');
const router = express.Router();

const usuariosRouter = require('./usuariosRoutes');
const archivosRouter = require('./archivosRoutes');
const carpetasRouter = require('./carpetasRoutes');

router.use('/usuarios', usuariosRouter);
router.use('/archivos', archivosRouter);
router.use('/carpetas', carpetasRouter);

module.exports = router;