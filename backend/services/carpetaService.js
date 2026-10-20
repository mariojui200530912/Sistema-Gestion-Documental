const Carpeta = require('../models/Carpeta');
const Archivo = require('../models/Archivo');
const HistorialActividad = require('../models/HistorialActividad');

class CarpetaService {
    async obtenerRaiz(usuario_id) {
        const carpetas = await Carpeta.find({
            propietario_id: usuario_id,
            carpeta_padre_id: null,
            estado: 'activo'
        });
        const archivos = await Archivo.find({
            propietario_id: usuario_id,
            carpeta_id: null,
            estado: 'activo'
        });
        return { carpetas, archivos };
    }

    async obtenerContenido(idCarpeta, usuarioId) {
        const carpetaActual = await Carpeta.findOne({ _id: idCarpeta, propietario_id: usuarioId, estado: 'activo' });
        if (!carpetaActual) {
            throw new Error('CARPETA_NO_ENCONTRADA');
        }

        const carpetas = await Carpeta.find({ carpeta_padre_id: idCarpeta, estado: 'activo' });
        const archivos = await Archivo.find({ carpeta_id: idCarpeta, estado: 'activo' });

        return { carpetaActual, contenido: { carpetas, archivos } };
    }

    async crear(nombre, carpetaPadreId, usuarioId) {
        if (carpetaPadreId) {
            const padre = await Carpeta.findOne({ _id: carpetaPadreId, propietario_id: usuarioId, estado: 'activo' });
            if (!padre) throw new Error('CARPETA_PADRE_INVALIDA');
        }

        const carpetaExistente = await Carpeta.findOne({
            nombre: nombre,
            carpeta_padre_id: carpetaPadreId || null,
            propietario_id: usuarioId,
            estado: 'activo'
        });

        if (carpetaExistente) {
            throw new Error('NOMBRE_DUPLICADO');
        }

        const nuevaCarpeta = new Carpeta({
            nombre,
            propietario_id: usuarioId,
            carpeta_padre_id: carpetaPadreId || null
        });

        await nuevaCarpeta.save();

        await HistorialActividad.create({
            usuario_id: usuarioId,
            recurso_id: nuevaCarpeta._id,
            tipo_recurso: 'carpeta',
            accion: 'creacion',
            detalles: `Carpeta creada: ${nombre}`
        });

        return nuevaCarpeta;
    }

    async renombrar(idCarpeta, nuevoNombre, usuarioId) {
        const carpeta = await Carpeta.findOne({ _id: idCarpeta, propietario_id: usuarioId, estado: 'activo' });
        if (!carpeta) throw new Error('CARPETA_NO_ENCONTRADA');

        if (carpeta.nombre === nuevoNombre) return carpeta;

        const carpetaExistente = await Carpeta.findOne({
            nombre: nuevoNombre,
            carpeta_padre_id: carpeta.carpeta_padre_id, // Buscamos en el mismo nivel
            propietario_id: usuarioId,
            estado: 'activo'
        });

        if (carpetaExistente) {
            throw new Error('NOMBRE_DUPLICADO');
        }

        carpeta.nombre = nuevoNombre;
        await carpeta.save();

        await HistorialActividad.create({
            usuario_id: usuarioId, recurso_id: carpeta._id, tipo_recurso: 'carpeta',
            accion: 'edicion', detalles: `Carpeta renombrada a ${nuevoNombre}`
        });

        return carpeta;
    }

    async mover(idCarpeta, nuevaCarpetaPadreId, usuarioId) {
        const carpetaMover = await Carpeta.findOne({ _id: idCarpeta, propietario_id: usuarioId, estado: 'activo' });
        if (!carpetaMover) throw new Error('CARPETA_NO_ENCONTRADA');

        // Regla de negocio: No se puede mover a la misma carpeta donde ya esta
        if (String(carpetaMover.carpeta_padre_id) === String(nuevaCarpetaPadreId)) {
            return carpetaMover; // No hay cambios, retornamos silenciosamente
        }

        // Regla de negocio: Prevenir ciclos verificando el árbol hacia arriba
        if (nuevaCarpetaPadreId) {
            if (String(idCarpeta) === String(nuevaCarpetaPadreId)) {
                throw new Error('CICLO_DETECTADO'); // No puede meterse dentro de sí misma
            }

            let ancestro = await Carpeta.findById(nuevaCarpetaPadreId);
            while (ancestro) {
                if (String(ancestro._id) === String(idCarpeta)) {
                    throw new Error('CICLO_DETECTADO'); // No puede meterse dentro de una subcarpeta propia
                }
                if (!ancestro.carpeta_padre_id) break;
                ancestro = await Carpeta.findById(ancestro.carpeta_padre_id);
            }
        }

        const carpetaExistente = await Carpeta.findOne({
            nombre: carpetaMover.nombre, // Usamos el nombre de la carpeta que estamos moviendo
            carpeta_padre_id: nuevaCarpetaPadreId || null,
            propietario_id: usuarioId,
            estado: 'activo'
        });

        if (carpetaExistente) {
            throw new Error('NOMBRE_DUPLICADO_DESTINO');
        }

        carpetaMover.carpeta_padre_id = nuevaCarpetaPadreId || null;
        await carpetaMover.save();

        await HistorialActividad.create({
            usuario_id: usuarioId, recurso_id: carpetaMover._id, tipo_recurso: 'carpeta',
            accion: 'edicion', detalles: 'Carpeta movida de ubicación'
        });

        return carpetaMover;
    }
}

module.exports = new CarpetaService();