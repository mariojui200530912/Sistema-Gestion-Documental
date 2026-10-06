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

exports.descargarArchivo = async (req, res) => {
    try {
        const { id } = req.params;
        const usuarioId = req.usuario.id;
        
        const archivo = await Archivo.findOne({ _id: id, estado: 'activo' });
        if (!archivo) {
            return res.status(404).json({ message: 'Archivo no encontrado' });
        }
        const esPropietario = archivo.propietario_id.toString() === usuarioId;
        const tienePermiso = await archivo.accesos.some(a => a.usuario_id.toString() === usuarioId);

        if (!esPropietario && !tienePermiso) {
            return res.status(403).json({ message: 'No tienes permiso para descargar este archivo' });
        }
        const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: 'fs' });

        res.set('Content-Type', archivo.tipo_archivo);
        res.set('Content-Disposition', `attachment; filename="${archivo.nombre}"`);
        const downloadStream = bucket.openDownloadStream(archivo.gridfs_id);

        downloadStream.on('error', (err) => {
            console.error(err);
            res.status(500).json({ message: 'Error al descargar el archivo' });
        });
        downloadStream.pipe(res);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al descargar el archivo' });
    }
};

exports.renombrarArchivo = async (req, res) => {
    try {
        const { id } = req.params;
        const { nuevoNombre } = req.body;
        const usuarioId = req.usuario.id;
        const archivo = await Archivo.findOne({ _id: id, estado: 'activo' });
        if (!archivo) return res.status(404).json({ mensaje: 'Archivo no encontrado' });

        const esPropietario = archivo.propietario_id.toString() === usuarioId;
        const puedeEditar = archivo.accesos.some(a => a.usuario_id.toString() === usuarioId && a.nivel_permiso === 'edicion');

        if (!esPropietario && !puedeEditar) {
            return res.status(403).json({ mensaje: 'No tienes permiso de edición para renombrar' });
        }
        if (!nuevoNombre.endsWith('.txt') && !nuevoNombre.endsWith('.md')) {
            return res.status(400).json({ mensaje: 'El nuevo nombre debe conservar la extensión .txt o .md' });
        }

        archivo.nombre = nuevoNombre;
        await archivo.save();

        await HistorialActividad.create({
            usuario_id: usuarioId,
            recurso_id: archivo._id,
            tipo_recurso: 'archivo',
            accion: 'edicion',
            detalles: `Archivo renombrado a ${nuevoNombre}`
        });

        res.json({ mensaje: 'Archivo renombrado exitosamente', archivo });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al renombrar el archivo' });
    }
};

exports.moverArchivo = async (req, res) => {
    try {
        const { id } = req.params;
        const { nueva_carpeta_id } = req.body; 
        const usuarioId = req.usuario.id;

        const archivo = await Archivo.findOne({ _id: id, propietario_id: usuarioId, estado: 'activo' });
        if (!archivo) return res.status(404).json({ mensaje: 'Archivo no encontrado o no eres el propietario' });

        if (nueva_carpeta_id) {
            const carpetaDestino = await Carpeta.findOne({ _id: nueva_carpeta_id, propietario_id: usuarioId });
            if (!carpetaDestino) return res.status(403).json({ mensaje: 'La carpeta destino no existe o no te pertenece' });
        }

        archivo.carpeta_id = nueva_carpeta_id || null;
        await archivo.save();

        await HistorialActividad.create({
            usuario_id: usuarioId,
            recurso_id: archivo._id,
            tipo_recurso: 'archivo',
            accion: 'edicion',
            detalles: 'Archivo movido de ubicación'
        });

        res.json({ mensaje: 'Archivo movido exitosamente', archivo });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al mover el archivo' });
    }
};