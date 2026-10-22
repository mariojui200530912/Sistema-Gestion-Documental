const archivoService = require('../services/archivoService');

exports.subirArchivo = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No se proporcionó ningún archivo' });
        }
        const archivoSubido = await archivoService.crearArchivo(req.file, req.body.carpeta_id, req.usuario.id);
        
        res.status(201).json({ mensaje: 'Archivo subido exitosamente', archivo: archivoSubido });
    } catch (error) {
        if (error.message === 'CARPETA_DESTINO_INVALIDA_O_SIN_PERMISO'){
            return res.status(400).json({ mensaje: 'Carpeta no encontrada o no tiene los permisos'});
        }
        if (error.message === 'NOMBRE_DUPLICADO') {
            return res.status(400).json({ mensaje: 'Ya existe un archivo con ese nombre en esta carpeta' });
        }
        console.error(error);
        res.status(500).json({ message: 'Error al subir el archivo' });
    }
};

exports.descargarArchivo = async (req, res) => {
    try {
        const { metadata, stream } = await archivoService.descargarArchivo(req.params.id, req.usuario.id); 
        res.set('Content-Type', metadata.tipo_archivo);
        res.set('Content-Disposition', `attachment; filename="${metadata.nombre}"`);

        stream.on('error', (err) => {
            console.error(err);
            res.status(500).json({ mensaje: 'Error al descargar el archivo' });
        });
        stream.pipe(res);

    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al descargar el archivo' });
    }
};

exports.renombrarArchivo = async (req, res) => {
    try {
        const archivo = await archivoService.renombrar(req.params.id, req.body.nuevo_nombre, req.usuario.id);
        res.json({ message: 'Archivo renombrado exitosamente', archivo });
    } catch (error) {
        if (error.message === 'EXTENSION_INVALIDA') return res.status(400).json({ message: 'El nuevo nombre debe conservar la extensión .txt o .md' });
        if (error.message === 'ARCHIVO_NO_ENCONTRADO') return res.status(404).json({ message: 'Archivo no encontrado' });
        if (error.message === 'PERMISO_DENEGADO') return res.status(403).json({ message: 'No tienes permiso para renombrar este archivo' });
        if (error.message === 'NOMBRE_DUPLICADO') return res.status(400).json({ mensaje: 'Ya existe un archivo con ese nombre en esta carpeta' });
        
        res.status(500).json({ mensaje: 'Error al renombrar el archivo' });
    }
};

exports.moverArchivo = async (req, res) => {
    try {
        const archivo = await archivoService.mover(req.params.id, req.body.nueva_carpeta_id, req.usuario.id);
        res.json({ message: 'Archivo movido exitosamente', archivo });
    } catch (error) {
        if (error.message === 'CARPETA_DESTINO_INVALIDA') return res.status(400).json({ message: 'Carpeta de destino no válida o sin permisos' });
        if (error.message === 'ARCHIVO_NO_ENCONTRADO') return res.status(404).json({ message: 'Archivo no encontrado' });
        if (error.message === 'NOMBRE_DUPLICADO_DESTINO') return res.status(400).json({ mensaje: 'Ya existe un archivo con el mismo nombre en la carpeta de destino' });
        res.status(500).json({ mensaje: 'Error al mover el archivo' });
    }
};