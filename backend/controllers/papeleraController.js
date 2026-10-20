const papeleraService = require('../services/papeleraService');

exports.obtenerPapelera = async (req, res) => {
    try {
        const contenido = await papeleraService.obtener(req.usuario.id);
        res.json({ mensaje: 'Papelera obtenida', contenido });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al obtener la papelera' });
    }
};

exports.cambiarEstado = async (req, res) => {
    try {
        const { id, tipo, accion } = req.body;
        const elemento = await papeleraService.cambiarEstado(id, tipo, accion, req.usuario.id);
        
        res.json({ mensaje: `Elemento cambiado a estado: ${accion}`, elemento });
    } catch (error) {
        if (error.message === 'PARAMETROS_INVALIDOS') return res.status(400).json({ mensaje: 'Parámetros inválidos' });
        if (error.message === 'ELEMENTO_NO_ENCONTRADO') return res.status(404).json({ mensaje: 'Elemento no encontrado o sin permisos' });
        
        console.error(error);
        res.status(500).json({ mensaje: 'Error al cambiar estado del elemento' });
    }
};

exports.eliminarDefinitivo = async (req, res) => {
    try {
        const { id, tipo } = req.body;
        await papeleraService.eliminarDefinitivo(id, tipo, req.usuario.id);
        
        res.json({ mensaje: `${tipo === 'archivo' ? 'Archivo eliminado definitivamente y espacio liberado' : 'Carpeta eliminada definitivamente'}` });
    } catch (error) {
        if (error.message === 'ELEMENTO_NO_ENCONTRADO') return res.status(404).json({ mensaje: 'Elemento no encontrado en la papelera' });
        if (error.message === 'TIPO_INVALIDO') return res.status(400).json({ mensaje: 'Tipo de recurso no válido' });
        
        console.error(error);
        res.status(500).json({ mensaje: 'Error al eliminar definitivamente' });
    }
};