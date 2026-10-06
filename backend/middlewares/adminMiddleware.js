const adminMiddleware = (req, res, next) => {
    if(req.usuario && req.usuario.rol === 'administrador') {
        next();
    } else {
        res.status(403).json({ mensaje: 'Acceso denegado. Se requiere rol de administrador' });
    }
};

module.exports = adminMiddleware;