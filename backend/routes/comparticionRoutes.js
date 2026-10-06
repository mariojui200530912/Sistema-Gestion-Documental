const express = require('express');
const router = express.Router();
const comparticionController = require('../controllers/comparticionController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

router.post('/', comparticionController.compartirRecurso);
router.delete('/revocar', comparticionController.revocarPermiso);

router.get('/conmigo', comparticionController.obtenerCompartidosConmigo);

module.exports = router;