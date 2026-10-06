const Carpeta = require('../models/Carpeta');
const Archivo = require('../models/Archivo');

exports.crearCarpeta = async (req, res) => {
    try {
        const { nombre, carpeta_padre_id } = req.body;
        const usuario_id = req.usuario._id;

        if (carpeta_padre_id) {
            const carpetaPadre = await Carpeta.findById(carpeta_padre_id);
            if(!carpetaPadre || carpetaPadre.propietario_id.toString() !== usuario_id) {
                return res.status(403).json({ mensaje: 'No tienes permiso para crear una subcarpeta en esta carpeta.' });
            }
        }

        const nuevaCarpeta = new Carpeta({
            nombre,
            propietario_id: usuario_id,
            carpeta_padre_id: carpeta_padre_id || null
        });

        await nuevaCarpeta.save();
        res.status(201).json({ mensaje: 'Carpeta creada exitosamente.', carpeta: nuevaCarpeta });
    }catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al crear la carpeta.' });
    }
};

exports.obtenerContenido = async (req, res) => {
    try {
        const { id } = req.params;
        const usuario_id = req.usuario_id;
        const buscarPadreId = id === 'raiz' ? null : id;

        const carpetas = await Carpeta.find({
            propietario_id: usuario_id,
            carpeta_padre_id: buscarPadreId,
            estado: 'activo'
        }).select('-accesos');

        const archivos = await Archivo.find({
            propietario_id: usuario_id,
            carpeta_id: buscarPadreId,
            estado: 'activo'
        }).select('-accesos');

        res.json({
            mensaje : 'Contenido obtenido exitosamente.',
            contenido: {
                carpetas,
                archivos
            }
        });
    }catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al obtener el contenido de la carpeta.' });
    }
};