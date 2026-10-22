const express = require('express');
const router = express.Router();
const comparticionController = require('../controllers/comparticionController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

router.post('/', comparticionController.compartirRecurso);
router.delete('/revocar', comparticionController.revocarPermiso);

router.get('/conmigo', comparticionController.obtenerCompartidosConmigo);
router.get('/accesos/:tipo/:id', comparticionController.obtenerAccesos);

module.exports = router;