const Archivo = require('../models/Archivo');
const Carpeta = require('../models/Carpeta');
const HistorialActividad = require('../models/HistorialActividad');
const Usuario = require('../models/Usuario');

exports.compartirRecurso = async (req, res) => {
    try {
        const { id_recurso, tipo_recurso, correo_beneficiario, nivel_permiso} = req.body;
        const propietario_id = req.usuario._id;

        if (!['carpeta', 'archivo'].includes(tipo_recurso)) {
            return res.status(400).json({ mensaje: 'Tipo de recurso inválido.' });
        }
        if (!['lectura', 'edicion', 'comentar'].includes(nivel_permiso)) {
            return res.status(400).json({ mensaje: 'Nivel de permiso inválido.' });
        }
        const beneficiario = await Usuario.findOne({ correo: correo_beneficiario });
        if (!beneficiario) {
            return res.status(404).json({ mensaje: 'Beneficiario no encontrado.' });
        }
        if (beneficiario._id.equals(propietario_id)) {
            return res.status(400).json({ mensaje: 'No puedes compartir un recurso contigo mismo.' });
        }

        const Modelo = tipo_recurso === 'carpeta' ? Carpeta : Archivo;
        const recurso = await Modelo.findOne({ _id: id_recurso, propietario_id: propietarioId, estado: 'activo' });

        if (!recurso) return res.status(404).json({ mensaje: 'Recurso no encontrado o no pertenece al usuario.' });

        const indiceAcceso = recurso.accesos.findIndex(a => a.usuario_id.toString() === beneficiario._id.toString());

        if(indiceAcceso !== -1) {
            recurso.accesos[indiceAcceso].nivel_permiso = nivel_permiso;
        } else {
            recurso.accesos.push({ usuario_id: beneficiario._id, nivel_permiso });
        }

        await recurso.save();

        await HistorialActividad.create({
            usuario_id: propietario_id,
            recurso_id: recurso._id,
            tipo_recurso,
            accion: 'compartir',
            detalles: `Compartido con ${correo_beneficiario} con permiso de ${nivel_permiso}`
        });

        res.json({ mensaje: 'Recurso compartido correctamente.', accesos: recurso.accesos });

    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al compartir el recurso.' });
    }
};

exports.revocarPermiso = async (req, res) => {
    try {
        const { id_recurso, tipo_recurso, id_usuario_revocar } = req.body;
        const propietarioId = req.usuario.id;

        const Modelo = tipo_recurso === 'archivo' ? Archivo : Carpeta;
        const recurso = await Modelo.findOne({ _id: id_recurso, propietario_id: propietarioId });

        if (!recurso) return res.status(404).json({ mensaje: 'Recurso no encontrado o no tienes permisos' });

        const accesosIniciales = recurso.accesos.length;
        recurso.accesos = recurso.accesos.filter(a => a.usuario_id.toString() !== id_usuario_revocar);

        if (recurso.accesos.length === accesosIniciales) {
            return res.status(404).json({ mensaje: 'El usuario especificado no tiene acceso a este recurso' });
        }

        await recurso.save();

        res.json({ mensaje: 'Acceso revocado exitosamente' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al revocar el permiso' });
    }
};

exports.obtenerCompartidosConmigo = async (req, res) => {
    try {
        const miId = req.usuario.id;

        const archivos = await Archivo.find({ 'accesos.usuario_id': miId, estado: 'activo' }).populate('propietario_id', 'nombres apellidos correo');
        const carpetas = await Carpeta.find({ 'accesos.usuario_id': miId, estado: 'activo' }).populate('propietario_id', 'nombres apellidos correo');

        res.json({ mensaje: 'Recursos compartidos obtenidos', contenido: { carpetas, archivos } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al obtener recursos compartidos' });
    }
};