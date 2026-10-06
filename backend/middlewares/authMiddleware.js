const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        return res.status(401).json({ message: 'No se proporcionó un token de autenticación' });
    }
    const token = authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Formato de token inválido' });
    }

    try {
        const cifrado = jwt.verify(token, process.env.JWT_SECRET);
        req.usuario = cifrado.usuario; // Almacena la información del usuario en la solicitud
        next();
    } catch (error) {
        return res.status(403).json({ message: 'Token de autenticación inválido' });
    }
};    
