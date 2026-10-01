const Usuario = require('../models/Usuario');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.autenticarUsuario = async (req, res) => {
    try {
        const { correo, contrasena } = req.body;
        const usuario = await Usuario.findOne({ correo });
        if (!usuario) {
            return res.status(400).json({ message: 'Correo o contraseña incorrectos' });
        }

        const esPasswordValido = await bcrypt.compare(contrasena, usuario.contrasena);
        if (!esPasswordValido) {
            return res.status(400).json({ message: 'Correo o contraseña incorrectos' });
        }

        const payload = {
            usuario: {
                id: usuario._id,
                rol: usuario.rol
            }
        };

        const token = jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '8h' },
            (error, token) => {
                if (error) throw error;
                res.json({ 
                    token,
                    usuario: {
                        _id: usuario._id,
                        nombres: usuario.nombres,
                        apellidos: usuario.apellidos,
                        correo: usuario.correo,
                        rol: usuario.rol,
                        espacioUtilizado: usuario.espacioUtilizado,
                        espacioAsignado: usuario.espacioAsignado
                    } 
                });
            }
        );

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al autenticar el usuario' });
    }
};

exports.registrarUsuario = async (req, res) => {
    try {
        const { nombres, apellidos, correo, password, rol } = req.body;
        let (usuario) = await Usuario.findOne({ correo });
        if (usuario) {
            return res.status(400).json({ message: 'El correo ya está registrado' });
        }

        usuario = new Usuario({
            nombres,
            apellidos,
            correo,
            contrasena,
            rol: rol || 'usuario'
        });

        const salt = await bcrypt.genSalt(10);
        usuario.contrasena = await bcrypt.hash(password, salt);

        await usuario.save();
        res.status(201).json({ 
            message: 'Usuario registrado exitosamente', 
            usuario: {
                _id: usuario._id,
                nombres: usuario.nombres,
                apellidos: usuario.apellidos,
                correo: usuario.correo
            }
        });
    }catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al registrar el usuario' });
    }
};