const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const Usuario = require('./models/Usuario');
const Carpeta = require('./models/Carpeta');
const Archivo = require('./models/Archivo');
const HistorialActividad = require('./models/HistorialActividad');

const MONGODB_URI = process.env.MONGODB_URI;

const poblarBaseDeDatos = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Conectado a MongoDB para la carga inicial...');

    // Limpiar las colecciones
    await Usuario.deleteMany({});
    await Carpeta.deleteMany({});
    await Archivo.deleteMany({});
    await HistorialActividad.deleteMany({});
    await mongoose.connection.db.collection('fs.files').deleteMany({});
    await mongoose.connection.db.collection('fs.chunks').deleteMany({});
    console.log('Colecciones limpiadas exitosamente.');

    // Crear usuarios
    const salt = await bcrypt.genSalt(10);
    const passHash = await bcrypt.hash('password123', salt);

    const usuariosData = [
      { nombres: "Admin", apellidos: "Sistema", correo: "admin@empresa.com", rol: "administrador", contrasena: passHash },
      { nombres: "Carlos", apellidos: "Gómez", correo: "carlos@empresa.com", rol: "usuario", contrasena: passHash },
      { nombres: "María", apellidos: "López", correo: "maria@empresa.com", rol: "usuario", contrasena: passHash },
      { nombres: "Juan", apellidos: "Pérez", correo: "juan@empresa.com", rol: "usuario", contrasena: passHash }
    ];

    const usuarios = await Usuario.insertMany(usuariosData);
    const usuariosRegulares = usuarios.filter(u => u.rol === 'usuario');
    console.log('✅ Usuarios creados.');

    // Crear carpetas asegurando la relación correcta con su propietario
    const estructuraCarpetas = []; // Guardaremos { usuario, principal, subcarpeta }

    for (const usuario of usuariosRegulares) {
      const principal = await Carpeta.create({ 
        nombre: 'Carpeta Principal', 
        propietario_id: usuario._id,
        carpeta_padre_id: null
      });

      const subcarpeta = await Carpeta.create({
        nombre: 'Subcarpeta 1', 
        propietario_id: usuario._id,
        carpeta_padre_id: principal._id
      });

      estructuraCarpetas.push({ usuario, principal, subcarpeta });
    }
    console.log('✅ Carpetas creadas y asignadas correctamente a sus dueños.');

    const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: 'fs' });
    const archivosCreados = [];
    const historiales = [];

    // Crear 18 archivos por cada usuario (Total: 54 archivos)
    for (const info of estructuraCarpetas) {
      // Alternamos entre la carpeta principal y la subcarpeta para tener variedad
      const carpetaDestino = Math.random() > 0.5 ? info.principal : info.subcarpeta;
      
      for (let i = 0; i < 18; i++) {
        const isMarkdown = i % 2 === 0;
        const extension = isMarkdown ? 'md' : 'txt';
        const mimeType = isMarkdown ? 'text/markdown' : 'text/plain';
        const nombreArchivo = `archivo_${info.usuario.nombres.toLowerCase()}_${i}.${extension}`;
        const contenido = `Este es el contenido del archivo ${nombreArchivo}`;
        
        // Subir a GridFS
        const uploadStream = bucket.openUploadStream(nombreArchivo, { contentType: mimeType });
        uploadStream.end(contenido);
        await new Promise((resolve) => uploadStream.on('finish', resolve));

        // Registrar en la colección
        const nuevoArchivo = await Archivo.create({
          nombre: nombreArchivo,
          tipo_archivo: mimeType,
          tamano: Buffer.byteLength(contenido),
          propietario_id: info.usuario._id,
          carpeta_id: carpetaDestino._id, // <-- AQUÍ ESTÁ LA CORRECCIÓN: Carpeta del mismo dueño
          gridfs_id: uploadStream.id
        });
        
        archivosCreados.push(nuevoArchivo);

        historiales.push({
          usuario_id: info.usuario._id,
          recurso_id: nuevoArchivo._id,
          tipo_recurso: 'archivo',
          accion: 'creacion'
        });

        await Usuario.findByIdAndUpdate(info.usuario._id, { $inc: { espacioUtilizado: nuevoArchivo.tamano } });
      }
    }
    console.log(`✅ ${archivosCreados.length} Archivos creados físicamente y registrados.`);

    // Compartir archivos de forma equitativa
    const permisosDisponibles = ['lectura', 'edicion', 'comentar'];
    let contadorCompartidos = 0;

    for (let i = 0; i < 30; i++) { // Compartiremos 30 archivos al azar
      const archivoTarget = archivosCreados[i];
      
      // Buscar un beneficiario que NO sea el dueño del archivo
      const beneficiariosPosibles = usuariosRegulares.filter(u => u._id.toString() !== archivoTarget.propietario_id.toString());
      const beneficiario = beneficiariosPosibles[Math.floor(Math.random() * beneficiariosPosibles.length)];
      const nivel = permisosDisponibles[Math.floor(Math.random() * permisosDisponibles.length)];

      archivoTarget.accesos.push({ usuario_id: beneficiario._id, nivel_permiso: nivel });
      await archivoTarget.save();

      historiales.push({
        usuario_id: archivoTarget.propietario_id,
        recurso_id: archivoTarget._id,
        tipo_recurso: 'archivo',
        accion: 'compartir',
        detalles: `Compartido con ${beneficiario.correo} (${nivel})`
      });
      contadorCompartidos++;
    }
    console.log(`✅ ${contadorCompartidos} Operaciones de compartición realizadas (repartidas al azar).`);

    // Mandar a papelera los últimos 10 archivos
    for (let i = archivosCreados.length - 10; i < archivosCreados.length; i++) {
      const archivoEliminado = archivosCreados[i];
      archivoEliminado.estado = 'papelera';
      await archivoEliminado.save();

      historiales.push({
        usuario_id: archivoEliminado.propietario_id,
        recurso_id: archivoEliminado._id,
        tipo_recurso: 'archivo',
        accion: 'eliminacion'
      });
    }
    console.log('✅ 10 Elementos enviados a la papelera.');

    await HistorialActividad.insertMany(historiales);
    console.log('✅ Historial de actividades guardado.');

    console.log('✅ Carga inicial completada con éxito. Los datos están 100% coherentes.');
    process.exit();
  } catch (error) {
    console.error('❌ Error poblando la base de datos:', error);
    process.exit(1);
  }
};

poblarBaseDeDatos();