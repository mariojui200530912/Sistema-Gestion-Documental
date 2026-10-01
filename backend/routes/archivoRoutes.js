const express = require('express');
const router = express.Router();
const archivoController = require('../controllers/archivoController');
const authMiddleware = require('../middlewares/authMiddleware');
const uploadMiddleware = require('../middlewares/uploadMiddleware');

router.post('/upload', authMiddleware, uploadMiddleware.single('documento'), archivoController.subirArchivo);

module.exports = router;