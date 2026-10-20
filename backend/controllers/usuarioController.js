const usuarioService = require('../services/usuarioService');

exports.autenticarUsuario = async (req, res) => {
    try {
        const { correo, contrasena } = req.body;
        const { token, usuario } = await usuarioService.autenticarUsuario(correo, contrasena);
        res.json({ 
            token, 
            usuario: { 
                _id: usuario._id, 
                nombres: usuario.nombres, 
                apellidos: usuario.apellidos, 
                correo: usuario.correo, 
                rol: usuario.rol, 
                estado: usuario.estado,
                espacioUtilizado: usuario.espacioUtilizado,
                espacioAsignado: usuario.espacioAsignado
            } 
        });
    } catch (error) {
        if (error.message === 'CREDENCIALES_INVALIDAS') {
            return res.status(401).json({ mensaje: 'Correo o contraseña incorrectos' });
        }
        if (error.message === 'CUENTA_DESACTIVADA') {
            return res.status(403).json({ mensaje: 'La cuenta está desactivada. Contacta al administrador.' });
        }
        console.error(error);
        res.status(500).json({ mensaje: 'Error al autenticar el usuario' });
    }
};

exports.registrarUsuario = async (req, res) => {
    try {
        const usuario = await usuarioService.registrarUsuario(req.body);
        res.status(201).json({ 
            message: 'Usuario registrado exitosamente',
            usuario: { 
                _id: usuario._id, 
                nombres: usuario.nombres, 
                apellidos: usuario.apellidos, 
                correo: usuario.correo, 
                rol: usuario.rol,
                estado: usuario.estado,
                espacioUtilizado: usuario.espacioUtilizado,
                espacioAsignado: usuario.espacioAsignado
            } 
        });
    }catch (error) {
        if (error.message === 'USUARIO_EXISTENTE') {
            return res.status(400).json({ message: 'El correo ya está registrado' });
        }
        console.error(error);
        res.status(500).json({ mensaje: 'Error al registrar el usuario' });
    }
};

exports.obtenerUsuarios = async (req, res) => {
    try {
        const usuarios = await usuarioService.obtenerUsuarios();
        res.json({ usuarios });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al obtener los usuarios' });
    }
};

exports.obtenerUsuario = async (req, res) => {
    try {
        const idUsuario = req.params.id;
        const usuario = await usuarioService.obtenerUsuarioPorId(idUsuario);
        res.json({ usuario });
    } catch (error) {
        if (error.message === 'USUARIO_NO_ENCONTRADO') {
            return res.status(404).json({ mensaje: 'Usuario no encontrado' });
        }
        console.error(error);
        res.status(500).json({ mensaje: 'Error al obtener el usuario' });
    }
};

exports.actualizarUsuario = async (req, res) => {
    try {
       const idDestino = req.params.id;
       const datos = req.body;
       const usuarioAuntenticado = req.usuario; // Usuario que hace la peticion

       const usuarioActualizado = await usuarioService.actualizarUsuario(idDestino, datos, usuarioAuntenticado);
       res.json({
        message: 'Usuario actualizado exitosamente',
        usuario: usuarioActualizado
       });
    } catch (error) {
        if (error.message === 'USUARIO_NO_ENCONTRADO') {
            return res.status(404).json({ mensaje: 'Usuario no encontrado' });
        }
        if (error.message === 'PERMISO_DENEGADO') {
            return res.status(403).json({ mensaje: 'No tienes permiso para actualizar este usuario' });
        }
        console.error(error);
        res.status(500).json({ mensaje: 'Error al actualizar el usuario' });
    }
};

exports.eliminarUsuario = async (req, res) => {
    try {
        const idUsuario = req.params.id;
        const usuario = await usuarioService.desactivarUsuario(idUsuario);
        res.json({ mensaje: 'Usuario desactivado exitosamente', usuario });
    } catch (error) {
        if (error.message === 'USUARIO_NO_ENCONTRADO') {
            return res.status(404).json({ mensaje: 'Usuario no encontrado' });
        }
        console.error(error);
        res.status(500).json({ mensaje: 'Error al desactivar el usuario' });
    }
};