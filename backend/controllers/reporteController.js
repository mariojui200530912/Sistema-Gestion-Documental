const reporteService = require('../services/reporteService');

exports.reporteArchivos = async (req, res) => {
    try {
        const { fechaInicio, fechaFin } = req.query;
        const reporte = await reporteService.obtenerReporteArchivos(fechaInicio, fechaFin);
        res.json(reporte);
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error generando reporte de archivos' });
    }
};

exports.reporteUsuarios = async (req, res) => {
    try {
        const reporte = await reporteService.obtenerReporteUsuarios();
        res.json(reporte);
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error generando reporte de usuarios' });
    }
};

exports.reporteComparticion = async (req, res) => {
    try {
        const { usuarioId } = req.query;
        const reporte = await reporteService.obtenerReporteComparticion(usuarioId);
        res.json(reporte);
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error generando reporte de compartición' });
    }
};

exports.reporteActividad = async (req, res) => {
    try {
        const { usuarioId, fechaInicio, fechaFin, periodo } = req.query;
        const reporte = await reporteService.obtenerReporteActividad({ usuarioId, fechaInicio, fechaFin, periodo });
        res.json(reporte);
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error generando reporte de actividad' });
    }
};