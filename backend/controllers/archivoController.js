const Archivo = require('../models/Archivo');
const Usuario = require('../models/Usuario');

exports.subirArchivo = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No se proporcionó ningún archivo' });
        }

        const { carpeta_id } = req.body;
        const tamanoArchivo = req.file.size;
        const usuarioId = req.usuario.id;

        const usuario = await Usuario.findById(usuarioId);
        if (usuario.espacioUtilizado + tamanoArchivo > usuario.espacioAsignado) {
            return res.status(400).json({ message: 'No hay suficiente espacio disponible para subir este archivo' });
        }

        const nuevoArchivo = new Archivo({
            nombre: req.file.filename,
            tipo_archivo: req.file.mimetype,
            tamano: tamanoArchivo,
            propietario_id: usuarioId,
            carpeta_id: carpeta_id || null,
            gridfs_id: req.file.id
        });

        await nuevoArchivo.save();

        usuario.espacioUtilizado += tamanoArchivo;
        await usuario.save();

        req.status(201).json({ message: 'Archivo subido exitosamente', archivo: nuevoArchivo });
   
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al subir el archivo' });
    }
};