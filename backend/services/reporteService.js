const mongoose = require('mongoose');
const Archivo = require('../models/Archivo');
const Carpeta = require('../models/Carpeta');
const Usuario = require('../models/Usuario');
const HistorialActividad = require('../models/HistorialActividad');

class ReporteService {
    // REPORTES DE ARCHIVOS Y ALMACENAMIENTO
    async obtenerReporteArchivos(fechaInicio, fechaFin) {
        // Cantidad agrupada por tipo
        const agrupadosPorTipo = await Archivo.aggregate([
            { $group: { _id: "$tipo_archivo", total: { $sum: 1 }, tamanoTotal: { $sum: "$tamano" } } }
        ]);

        // Archivos almacenados dentro de un rango de fechas
        const filtroFecha = {};
        if (fechaInicio || fechaFin) {
            filtroFecha.createdAt = {};
            if (fechaInicio) filtroFecha.createdAt.$gte = new Date(fechaInicio);
            if (fechaFin) {
                const fin = new Date(fechaFin);
                fin.setHours(23, 59, 59, 999);
                filtroFecha.createdAt.$lte = fin;
            }
        } else {
            // Por defecto: último mes si no envian filtro
            const haceUnMes = new Date();
            haceUnMes.setMonth(haceUnMes.getMonth() - 1);
            filtroFecha.createdAt = { $gte: haceUnMes };
        }

        const archivosEnRango = await Archivo.find(filtroFecha)
            .populate('propietario_id', 'nombres apellidos correo')
            .select('nombre tipo_archivo tamano createdAt propietario_id')
            .sort({ createdAt: -1 })
            .limit(50);

        // Archivos con mas operaciones (cruzando con el historial)
        const archivosMasActivos = await HistorialActividad.aggregate([
            { $match: { tipo_recurso: 'archivo' } },
            { $group: { _id: "$recurso_id", cantidadOperaciones: { $sum: 1 } } },
            { $sort: { cantidadOperaciones: -1 } },
            { $limit: 10 },
            { $lookup: { from: 'archivos', localField: '_id', foreignField: '_id', as: 'archivoInfo' } },
            { $unwind: "$archivoInfo" },
            { $project: { _id: 1, cantidadOperaciones: 1, "archivoInfo.nombre": 1, "archivoInfo.tipo_archivo": 1 } }
        ]);

        const carpetasMasLlenas = await Archivo.aggregate([
            { $match: { carpeta_id: { $ne: null } } }, 
            { $group: { _id: "$carpeta_id", totalArchivos: { $sum: 1 }, espacioOcupado: { $sum: "$tamano" } } },
            { $sort: { totalArchivos: -1 } },
            { $limit: 10 },
            { $lookup: { from: 'carpetas', localField: '_id', foreignField: '_id', as: 'carpeta' } },
            { $unwind: "$carpeta" },
            { $project: { _id: 1, totalArchivos: 1, espacioOcupado: 1, "carpeta.nombre": 1 } }
        ]);

        const archivosNoCompartidos = await Archivo.aggregate([
            { $match: { $or: [{ accesos: { $exists: false } }, { accesos: { $size: 0 } }] } },
            { $sort: { createdAt: -1 } },
            { $limit: 15 },
            { $lookup: { from: 'usuarios', localField: 'propietario_id', foreignField: '_id', as: 'propietario' } },
            { $unwind: "$propietario" },
            { $project: { nombre: 1, tipo_archivo: 1, tamano: 1, "propietario.nombres": 1, "propietario.correo": 1 } }
        ]);

        return {
            agrupadosPorTipo,
            totalArchivosRango: archivosEnRango.length,
            archivosEnRango,
            archivosMasActivos,
            carpetasMasLlenas,
            archivosNoCompartidos
        };
    }

    // REPORTES DE USUARIOS
    async obtenerReporteUsuarios() {
        // Top 10 usuarios con mayor cantidad de archivos
        const topArchivos = await Archivo.aggregate([
            { $group: { _id: "$propietario_id", totalArchivos: { $sum: 1 }, espacioTotal: { $sum: "$tamano" } } },
            { $sort: { totalArchivos: -1 } },
            { $limit: 10 },
            { $lookup: { from: 'usuarios', localField: '_id', foreignField: '_id', as: 'usuario' } },
            { $unwind: "$usuario" },
            { $project: { _id: 1, totalArchivos: 1, espacioTotal: 1, "usuario.nombres": 1, "usuario.apellidos": 1, "usuario.correo": 1 } }
        ]);

        // Usuarios con mayor cantidad de recursos compartidos
        const topCompartidores = await Archivo.aggregate([
            {
                $project: {
                    propietario_id: 1,
                    esCompartido: { $gt: [{ $size: { $ifNull: ["$accesos", []] } }, 0] },
                    cantidadAccesos: { $size: { $ifNull: ["$accesos", []] } }
                }
            },
            {
                $unionWith: {
                    coll: 'carpetas',
                    pipeline: [
                        {
                            $project: {
                                propietario_id: 1,
                                esCompartido: { $gt: [{ $size: { $ifNull: ["$accesos", []] } }, 0] },
                                cantidadAccesos: { $size: { $ifNull: ["$accesos", []] } }
                            }
                        }
                    ]
                }
            },
            { $match: { esCompartido: true } },
            {
                $group: {
                    _id: "$propietario_id",
                    recursosCompartidos: { $sum: 1 },
                    totalAccesosOtorgados: { $sum: "$cantidadAccesos" }
                }
            },
            { $sort: { recursosCompartidos: -1, totalAccesosOtorgados: -1 } },
            { $limit: 10 },
            { $lookup: { from: 'usuarios', localField: '_id', foreignField: '_id', as: 'usuario' } },
            { $unwind: "$usuario" },
            { $project: { _id: 1, recursosCompartidos: 1, totalAccesosOtorgados: 1, "usuario.nombres": 1, "usuario.apellidos": 1, "usuario.correo": 1 } }
        ]);
        const listaUsuarios = await Usuario.find({}, 'nombres apellidos correo').sort({ nombres: 1 });
        return { topArchivos, topCompartidores, listaUsuarios };
    }


    // REPORTES DE COMPARTICION
    async obtenerReporteComparticion(usuarioId) {
        // Archivos compartidos con mayor cantidad de usuarios
        const archivosMasCompartidos = await Archivo.aggregate([
            { $project: { nombre: 1, tipo_archivo: 1, propietario_id: 1, cantidadUsuarios: { $size: { $ifNull: ["$accesos", []] } } } },
            { $match: { cantidadUsuarios: { $gt: 0 } } },
            { $sort: { cantidadUsuarios: -1 } },
            { $limit: 10 },
            { $lookup: { from: 'usuarios', localField: 'propietario_id', foreignField: '_id', as: 'propietario' } },
            { $unwind: "$propietario" },
            { $project: { _id: 1, nombre: 1, tipo_archivo: 1, cantidadUsuarios: 1, "propietario.nombres": 1, "propietario.correo": 1 } }
        ]);

        let compartidosPorUsuario = [];
        let recibidosPorUsuario = [];

        if (usuarioId && mongoose.Types.ObjectId.isValid(usuarioId)) {
            const objId = new mongoose.Types.ObjectId(usuarioId);

            // Recursos compartidos POR el usuario seleccionado
            const archivosPropiosComp = await Archivo.find({ propietario_id: objId, "accesos.0": { $exists: true } })
                .populate('accesos.usuario_id', 'nombres correo')
                .select('nombre tipo_archivo accesos');
            const carpetasPropiasComp = await Carpeta.find({ propietario_id: objId, "accesos.0": { $exists: true } })
                .populate('accesos.usuario_id', 'nombres correo')
                .select('nombre accesos');

            compartidosPorUsuario = [
                ...carpetasPropiasComp.map(c => ({ _id: c._id, nombre: c.nombre, tipo: 'carpeta', accesos: c.accesos })),
                ...archivosPropiosComp.map(a => ({ _id: a._id, nombre: a.nombre, tipo: 'archivo', accesos: a.accesos }))
            ];

            // Recursos recibidos POR el usuario seleccionado
            const archivosRecibidos = await Archivo.find({ "accesos.usuario_id": objId })
                .populate('propietario_id', 'nombres correo')
                .select('nombre propietario_id accesos');
            const carpetasRecibidas = await Carpeta.find({ "accesos.usuario_id": objId })
                .populate('propietario_id', 'nombres correo')
                .select('nombre propietario_id accesos');

            recibidosPorUsuario = [
                ...carpetasRecibidas.map(c => ({
                    _id: c._id,
                    nombre: c.nombre,
                    tipo: 'carpeta',
                    propietario: c.propietario_id,
                    permiso: c.accesos.find(ac => ac.usuario_id.toString() === usuarioId)?.nivel_permiso
                })),
                ...archivosRecibidos.map(a => ({
                    _id: a._id,
                    nombre: a.nombre,
                    tipo: 'archivo',
                    propietario: a.propietario_id,
                    permiso: a.accesos.find(ac => ac.usuario_id.toString() === usuarioId)?.nivel_permiso
                }))
            ];
        }

        return { archivosMasCompartidos, compartidosPorUsuario, recibidosPorUsuario };
    }

    // REPORTES DE ACTIVIDAD
    async obtenerReporteActividad({ usuarioId, fechaInicio, fechaFin, periodo = 'dia' }) {
        // Cantidad de operaciones agrupadas por tipo
        const operacionesPorTipo = await HistorialActividad.aggregate([
            { $group: { _id: "$accion", total: { $sum: 1 } } },
            { $sort: { total: -1 } }
        ]);

        // Principales acciones realizadas dentro del sistema (por tipo_recurso + accion)
        const accionesGenerales = await HistorialActividad.aggregate([
            { $group: { _id: { recurso: "$tipo_recurso", accion: "$accion" }, totalAcciones: { $sum: 1 } } },
            { $sort: { totalAcciones: -1 } },
            { $limit: 8 }
        ]);

        // Cantidad de operaciones agrupadas por período (día o mes)
        const formatoFecha = periodo === 'mes' ? "%Y-%m" : "%Y-%m-%d";
        const operacionesPorPeriodo = await HistorialActividad.aggregate([
            {
                $group: {
                    _id: { $dateToString: { format: formatoFecha, date: "$createdAt" } }, 
                    total: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } },
            { $limit: 30 }
        ]);

        // Historial de actividad de un usuario dentro de un rango de fechas
        const filtroHistorial = {};
        if (usuarioId && mongoose.Types.ObjectId.isValid(usuarioId)) {
            filtroHistorial.usuario_id = new mongoose.Types.ObjectId(usuarioId);
        }
        if (fechaInicio || fechaFin) {
            filtroHistorial.createdAt = {}; 
            if (fechaInicio) filtroHistorial.fecha.$gte = new Date(fechaInicio);
            if (fechaFin) {
                const fin = new Date(fechaFin);
                fin.setHours(23, 59, 59, 999);
                filtroHistorial.fecha.$lte = fin;
            }
        }

        const historialFiltrado = await HistorialActividad.find(filtroHistorial)
            .populate('usuario_id', 'nombres apellidos correo')
            .sort({ fecha: -1 })
            .limit(50);

        return {
            operacionesPorTipo,
            accionesGenerales,
            operacionesPorPeriodo,
            historialFiltrado
        };
    }
}

module.exports = new ReporteService();