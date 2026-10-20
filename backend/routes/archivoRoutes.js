const express = require('express');
const router = express.Router();
const archivoController = require('../controllers/archivoController');
const authMiddleware = require('../middlewares/authMiddleware');
const uploadMiddleware = require('../middlewares/uploadMiddleware');
const validarSubidaMiddleware = require('../middlewares/validarSubidaMiddleware');

router.post('/upload', authMiddleware, validarSubidaMiddleware, (req, res, next) => {
    const uploadSingle = uploadMiddleware.single('archivo');
    uploadSingle(req, res, function (err) {
        if (err) {
            return res.status(400).json({ message: err.message });
        }
        next();
    });
}, archivoController.subirArchivo);

router.get('/descargar/:id', authMiddleware, archivoController.descargarArchivo);
router.put('/renombrar/:id', authMiddleware, archivoController.renombrarArchivo);
router.put('/mover/:id', authMiddleware, archivoController.moverArchivo);

module.exports = router;