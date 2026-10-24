const express = require('express');
const router = express.Router();
const archivoController = require('../controllers/archivoController');
const authMiddleware = require('../middlewares/authMiddleware');
const uploadMiddleware = require('../middlewares/uploadMiddleware');
const validarSubidaMiddleware = require('../middlewares/validarSubidaMiddleware');

router.use(authMiddleware);

router.post('/upload', validarSubidaMiddleware, (req, res, next) => {
    const uploadSingle = uploadMiddleware.single('archivo');
    uploadSingle(req, res, function (err) {
        if (err) {
            return res.status(400).json({ message: err.message });
        }
        next();
    });
}, archivoController.subirArchivo);

router.get('/descargar/:id', archivoController.descargarArchivo);
router.put('/:id/renombrar', archivoController.renombrarArchivo);
router.put('/:id/mover', archivoController.moverArchivo);
router.post('/:id/comentarios', archivoController.agregarComentario);

module.exports = router;