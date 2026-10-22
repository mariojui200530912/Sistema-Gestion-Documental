const comparticionService = require('../services/comparticionService');

exports.compartirRecurso = async (req, res) => {
    try {
        const { id_recurso, tipo_recurso, correo_beneficiario, nivel_permiso } = req.body;
        const propietarioId = req.usuario.id;

        const accesosActualizados = await comparticionService.compartir(
            id_recurso, tipo_recurso, correo_beneficiario, nivel_permiso, propietarioId
        );

        res.json({ mensaje: 'Permisos actualizados exitosamente', accesos: accesosActualizados });

    } catch (error) {
        if (error.message === 'TIPO_INVALIDO') return res.status(400).json({ mensaje: 'Tipo de recurso inválido' });
        if (error.message === 'PERMISO_INVALIDO') return res.status(400).json({ mensaje: 'Nivel de permiso inválido' });
        if (error.message === 'BENEFICIARIO_NO_ENCONTRADO') return res.status(404).json({ mensaje: 'El usuario con ese correo no existe' });
        if (error.message === 'AUTO_COMPARTIR') return res.status(400).json({ mensaje: 'No puedes compartir un recurso contigo mismo' });
        if (error.message === 'RECURSO_NO_ENCONTRADO') return res.status(404).json({ mensaje: 'Recurso no encontrado o no tienes permisos' });
        
        console.error(error);
        res.status(500).json({ mensaje: 'Error al compartir el recurso' });
    }
};

exports.revocarPermiso = async (req, res) => {
    try {
        const { id_recurso, tipo_recurso, id_usuario_revocar } = req.body;
        const propietarioId = req.usuario.id;

        await comparticionService.revocar(id_recurso, tipo_recurso, id_usuario_revocar, propietarioId);

        res.json({ mensaje: 'Acceso revocado exitosamente' });

    } catch (error) {
        if (error.message === 'RECURSO_NO_ENCONTRADO') return res.status(404).json({ mensaje: 'Recurso no encontrado o no tienes permisos' });
        if (error.message === 'ACCESO_INEXISTENTE') return res.status(404).json({ mensaje: 'El usuario especificado no tiene acceso a este recurso' });

        console.error(error);
        res.status(500).json({ mensaje: 'Error al revocar el permiso' });
    }
};

exports.obtenerCompartidosConmigo = async (req, res) => {
    try {
        const contenido = await comparticionService.obtenerCompartidosConmigo(req.usuario.id);
        res.json({ 
            mensaje: 'Recursos compartidos obtenidos', 
            carpetas: contenido.carpetas,
            archivos: contenido.archivos
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al obtener recursos compartidos' });
    }
};

exports.obtenerAccesos = async (req, res) => {
    try {
        const { id, tipo } = req.params;
        const accesos = await comparticionService.obtenerAccesos(id, tipo, req.usuario.id);
        
        res.json({ mensaje: 'Accesos obtenidos correctamente', accesos });
    } catch (error) {
        if (error.message === 'RECURSO_NO_ENCONTRADO') return res.status(404).json({ mensaje: 'Recurso no encontrado o sin permisos' });
        if (error.message === 'TIPO_INVALIDO') return res.status(400).json({ mensaje: 'Tipo de recurso no válido' });
        
        console.error(error);
        res.status(500).json({ mensaje: 'Error al obtener los accesos del recurso' });
    }
};