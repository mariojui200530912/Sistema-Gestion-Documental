const Archivo = require('../models/Archivo');
const Usuario = require('../models/Usuario');
const HistorialActividad = require('../models/HistorialActividad');

class ReporteService {
    
    async obtenerReporteArchivos() {
        // Cantidad agrupada por tipo
        const agrupadosPorTipo = await Archivo.aggregate([
            { $group: { _id: "$tipo_archivo", total: { $sum: 1 }, tamanoTotal: { $sum: "$tamano" } } }
        ]);

        // Archivos almacenados en el ultimo mes
        const fechaInicio = new Date();
        fechaInicio.setMonth(fechaInicio.getMonth() - 1);
        const archivosRecientes = await Archivo.countDocuments({ createdAt: { $gte: fechaInicio } });

        // Archivos con mas operaciones (cruzando con el historial)
        const archivosMasActivos = await HistorialActividad.aggregate([
            { $match: { tipo_recurso: 'archivo' } },
            { $group: { _id: "$recurso_id", cantidadOperaciones: { $sum: 1 } } },
            { $sort: { cantidadOperaciones: -1 } },
            { $limit: 5 },
            { $lookup: { from: 'archivos', localField: '_id', foreignField: '_id', as: 'archivoInfo' } },
            { $unwind: "$archivoInfo" },
            { $project: { _id: 1, cantidadOperaciones: 1, "archivoInfo.nombre": 1 } }
        ]);

        return { agrupadosPorTipo, archivosRecientes, archivosMasActivos };
    }

    async obtenerReporteUsuarios() {
        // Top 10 usuarios con mayor cantidad de archivos
        const topArchivos = await Archivo.aggregate([
            { $group: { _id: "$propietario_id", totalArchivos: { $sum: 1 } } },
            { $sort: { totalArchivos: -1 } },
            { $limit: 10 },
            { $lookup: { from: 'usuarios', localField: '_id', foreignField: '_id', as: 'usuario' } },
            { $unwind: "$usuario" },
            { $project: { _id: 1, totalArchivos: 1, "usuario.nombres": 1, "usuario.correo": 1 } }
        ]);

        // Usuarios con mayor cantidad de recursos compartidos
        const topCompartidores = await Archivo.aggregate([
            { $project: { propietario_id: 1, cantidadCompartida: { $size: { $ifNull: ["$accesos", []] } } } },
            { $group: { _id: "$propietario_id", totalComparticiones: { $sum: "$cantidadCompartida" } } },
            { $sort: { totalComparticiones: -1 } },
            { $limit: 5 },
            { $lookup: { from: 'usuarios', localField: '_id', foreignField: '_id', as: 'usuario' } },
            { $unwind: "$usuario" },
            { $project: { _id: 1, totalComparticiones: 1, "usuario.nombres": 1 } }
        ]);

        return { topArchivos, topCompartidores };
    }

    async obtenerReporteActividad() {
        // Cantidad de operaciones agrupadas por tipo
        const operacionesPorTipo = await HistorialActividad.aggregate([
            { $group: { _id: "$accion", total: { $sum: 1 } } },
            { $sort: { total: -1 } }
        ]);

        // Principales acciones del sistema
        const accionesGenerales = await HistorialActividad.aggregate([
            { $group: { _id: "$tipo_recurso", totalAcciones: { $sum: 1 } } }
        ]);

        return { operacionesPorTipo, accionesGenerales };
    }
}

module.exports = new ReporteService();