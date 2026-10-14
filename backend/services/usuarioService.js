const Usuario = require('../models/usuarioModel');
const Archivo = require('../models/Archivo');
const Carpeta = require('../models/Carpeta');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

class UsuarioService {
    async autenticarUsuario(correo, contrasena) {
        const usuario = await Usuario.findOne({ correo });
        if (!usuario) {
            throw new Error('CREDENCIALES_INVALIDAS');
        }

        if (usuario.estado === 'inactivo') {
            throw new Error('CUENTA_DESACTIVADA');
        }

        const esPasswordValido = await bcrypt.compare(contrasena, usuario.contrasena);
        if (!esPasswordValido) {
            throw new Error('CREDENCIALES_INVALIDAS');
        }

        const payload = {
            usuario: {
                id: usuario._id,
                rol: usuario.rol
            }
        };

        const token = await new Promise((resolve, reject) => {
            jwt.sign(
                payload,
                process.env.JWT_SECRET,
                { expiresIn: '8h' },
                (error, token) => {
                    if (error) reject(error);
                    resolve(token);
                });
        });
        
        return { token, usuario };
    }
    
    async registrarUsuario(datos) {
        const { nombres, apellidos, correo, password, rol } = datos;
        const usuarioExistente = await Usuario.findOne({ correo });
        if (usuarioExistente) {
            throw new Error('USUARIO_EXISTENTE');
        }
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const nuevoUsuario = new Usuario({
            nombres,
            apellidos,
            correo,
            contrasena: passwordHash,
            rol: rol || 'usuario'
        });
        
        await nuevoUsuario.save();
        return nuevoUsuario;
    }

    async obtenerUsuarios() {
        const usuarios = await Usuario.find().select('-contrasena');
        return usuarios;
    }

    async obtenerUsuarioPorId(idUsuario) {
        const usuario = await Usuario.findById(idUsuario).select('-contrasena');
        if (!usuario) {
            throw new Error('USUARIO_NO_ENCONTRADO');
        }
        return usuario;
    }

    async actualizarUsuario(idDestino, datos, usuarioAuntenticado) {
        const { nombres, apellidos, correo, password, rol, espacioAsignado, estado } = datos;
        let usuario = await Usuario.findById(idDestino);
        
        if (!usuario) {
            throw new Error('USUARIO_NO_ENCONTRADO');
        }

        if(usuarioAuntenticado.rol !== 'admin' && usuarioAuntenticado.id !== idDestino) {
            throw new Error('PERMISO_DENEGADO');
        }

        if (nombres) usuario.nombres = nombres;
        if (apellidos) usuario.apellidos = apellidos;
        if (correo) usuario.correo = correo;
        
        if (password) {
            const salt = await bcrypt.genSalt(10);
            usuario.contrasena = await bcrypt.hash(password, salt);
        }

        await usuario.save();

        const usuarioActualizado = usuario.toObject();
        delete usuarioActualizado.contrasena;

        return usuarioActualizado;
    }



    async desactivarUsuario(idUsuario) {
        const usuario = await Usuario.findByIdAndUpdate(
            idUsuario,
            { estado: 'inactivo' },
            { new: true }
        ).select('-contrasena');

        if (!usuario) {
            throw new Error('USUARIO_NO_ENCONTRADO');
        }

        await Archivo.updateMany(
            { 'accesos.usuario_id': idUsuario },
            { $pull: { accesos: { usuario_id: idUsuario } } }
        );
        await Carpeta.updateMany(
            { 'accesos.usuario_id': idUsuario },
            { $pull: { accesos: { usuario_id: idUsuario } } }
        );

        await Archivo.updateMany(
            { propietario_id: idUsuario, estado: 'activo' },
            { estado: 'papelera' }
        );
        await Carpeta.updateMany(
            { propietario_id: idUsuario, estado: 'activo' },
            { estado: 'papelera' }
        );

        return usuario;
    }
}

module.exports = new UsuarioService();
