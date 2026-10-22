const carpetaService = require('../services/carpetaService');

exports.obtenerRaiz = async (req, res) => {
    try {
        const contenido = await carpetaService.obtenerRaiz(req.usuario.id);
        res.json({ mensaje: 'Contenido de la raíz obtenido', contenido });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al obtener el directorio raíz' });
    }
};

exports.obtenerCarpeta = async (req, res) => {
    try {
        const resultado = await carpetaService.obtenerContenido(req.params.id, req.usuario.id);
        res.json({ mensaje: 'Contenido obtenido', contenido: resultado });
    } catch (error) {
        if (error.message === 'CARPETA_NO_ENCONTRADA') return res.status(404).json({ mensaje: 'Carpeta no encontrada o sin permisos' });
        console.error(error);
        res.status(500).json({ mensaje: 'Error al obtener el contenido de la carpeta' });
    }
};

exports.obtenerTodasLasCarpetas = async (req, res) => {
    try {
        const carpetas = await carpetaService.obtenerTodas(req.usuario.id);
        res.status(200).json({ carpetas });
    } catch (error) {
        console.error('Error al obtener todas las carpetas:', error);
        res.status(500).json({ mensaje: 'Error al cargar el listado de carpetas' });
    }
};

exports.crearCarpeta = async (req, res) => {
    try {
        const nuevaCarpeta = await carpetaService.crear(req.body.nombre, req.body.carpeta_padre_id, req.usuario.id);
        res.status(201).json({ mensaje: 'Carpeta creada exitosamente', carpeta: nuevaCarpeta });
    } catch (error) {
        if (error.message === 'CARPETA_PADRE_INVALIDA') return res.status(400).json({ mensaje: 'La carpeta destino no existe o no te pertenece' });
        if (error.message === 'NOMBRE_DUPLICADO') return res.status(400).json({ mensaje: 'Ya existe una carpeta con ese nombre en esta ubicación' });
        console.error(error);
        res.status(500).json({ mensaje: 'Error al crear la carpeta' });
    }
};

exports.renombrarCarpeta = async (req, res) => {
    try {
        const carpeta = await carpetaService.renombrar(req.params.id, req.body.nuevo_nombre, req.usuario.id);
        res.json({ mensaje: 'Carpeta renombrada exitosamente', carpeta });
    } catch (error) {
        if (error.message === 'CARPETA_NO_ENCONTRADA') return res.status(404).json({ mensaje: 'Carpeta no encontrada' });
        if (error.message === 'NOMBRE_DUPLICADO') return res.status(400).json({ mensaje: 'Ya existe una carpeta con ese nombre en esta ubicación' });
        console.error(error);
        res.status(500).json({ mensaje: 'Error al renombrar la carpeta' });
    }
};

exports.moverCarpeta = async (req, res) => {
    try {
        const carpeta = await carpetaService.mover(req.params.id, req.body.nueva_carpeta_padre_id, req.usuario.id);
        res.json({ mensaje: 'Carpeta movida exitosamente', carpeta });
    } catch (error) {
        if (error.message === 'CARPETA_NO_ENCONTRADA') return res.status(404).json({ mensaje: 'Carpeta no encontrada' });
        if (error.message === 'CICLO_DETECTADO') return res.status(400).json({ mensaje: 'Estructura inválida: No puedes mover una carpeta dentro de sí misma o de sus subcarpetas' });
        if (error.message === 'NOMBRE_DUPLICADO_DESTINO') return res.status(400).json({ mensaje: 'Ya existe una carpeta con el mismo nombre en el destino' });
        console.error(error);
        res.status(500).json({ mensaje: 'Error al mover la carpeta' });
    }
};