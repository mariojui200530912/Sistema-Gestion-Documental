const reporteService = require('../services/reporteService');

exports.reporteArchivos = async (req, res) => {
    try {
        const reporte = await reporteService.obtenerReporteArchivos();
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

exports.reporteActividad = async (req, res) => {
    try {
        const reporte = await reporteService.obtenerReporteActividad();
        res.json(reporte);
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error generando reporte de actividad' });
    }
};