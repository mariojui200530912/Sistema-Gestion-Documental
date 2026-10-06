const Archivo = require('../models/Archivo');
const Usuario = require('../models/Usuario');
const HistorialActividad = require('../models/HistorialActividad');

// Reporte de Archivos y Almacenamiento
exports.reporteArchivos = async (req, res) => {
    try {
        const agrupadosPorTipo = await Archivo.aggregate([
            { $group: {_id: "$tipo_archivo", total: { $sum: 1 }, tamanoTotal: { $sum: "$tamano" } } },
        ]);

        const fechaInicio = new Date();
        fechaInicio.setMonth(fechaInicio.getMonth() - 1); // Último mes
        const archivosRecientes = await Archivo.countDocuments({ createdAt: { $gte: fechaInicio } });

        const archivosMasActivos = await HistorialActividad.aggregate([
            { $match: { tipo_recurso: 'archivo' } },
            { $group: { _id: "$recurso_id", cantidadOperaciones: { $sum: 1 } } },
            { $sort: { cantidadOperaciones: -1 } },
            { $limit: 5 },
            { $lookup: { from: 'archivos', localField: '_id', foreignField: '_id', as: 'archivoInfo' } },
            { $unwind: "$archivoInfo" },
            { $project: { _id: 1, cantidadOperaciones: 1, "archivoInfo.nombre": 1 } }
        ]);

        res.json({ agrupadosPorTipo, archivosRecientes, archivosMasActivos });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error generando reporte de archivos' });
    }
};

// Reporte de Usuarios
exports.reporteUsuarios = async (req, res) => {
    try {
        const topArchivos = await Archivo.aggregate([
            { $group: { _id: "$propietario_id", totalArchivos: { $sum: 1 } } },
            { $sort: { totalArchivos: -1 } },
            { $limit: 5 },
            { $lookup: { from: 'usuarios', localField: '_id', foreignField: '_id', as: 'usuario' } },
            { $unwind: "$usuario" },
            { $project: { _id: 1, totalArchivos: 1, "usuario.nombre": 1, "usuario.email": 1 } }
        ]);

        const topCompartidores = await Archivo.aggregate([
            { $project: { propietario_id: 1, cantidadCompartida: { $size: "$accesos" } } },
            { $group: { _id: "$propietario_id", totalComparticiones: { $sum: "$cantidadCompartida" } } },
            { $sort: { totalComparticiones: -1 } },
            { $limit: 5 },
            { $lookup: { from: 'usuarios', localField: '_id', foreignField: '_id', as: 'usuario' } },
            { $unwind: "$usuario" },
            { $project: { _id: 1, totalComparticiones: 1, "usuario.nombres": 1 } }
        ]);

        res.json({ topArchivos, topCompartidores });
    }catch (error){
        res.status(500).json({ mensaje: 'Error generando reporte de usuarios'});
    }
};

// Reporte de Actividad y Comparticion
exports.reporteActividad = async (req, res) => {
    try{
        const operacionesPorTipo = await HistorialActividad.aggregate([
            { $group: { _id: "$accion", total: { $sum: 1 } } },
            { $sort: { total: -1 } }
        ]);
        const accionesGenerales = await HistorialActividad.aggregate([
            { $group: { _id: "$tipo_recurso", total: { $sum: 1 } } },
        ]);
        res.json({ operacionesPorTipo, accionesGenerales });
    }catch (error){
        res.status(500).json({ mensaje: 'Error generando reporte de actividad'});
    }
};