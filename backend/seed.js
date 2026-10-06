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

    // Limpiar las colecciones antes de insertar los datos iniciales
    await Usuario.deleteMany({});
    await Carpeta.deleteMany({});
    await Archivo.deleteMany({});
    await HistorialActividad.deleteMany({});
    await mongoose.connection.db.collection('fs.files').deleteMany({});
    await mongoose.connection.db.collection('fs.chunks').deleteMany({});
    console.log('Colecciones limpiadas exitosamente.');

    // Limpiar usuarios existentes
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

   // Crear carpetas para cada usuario regular
   const carpetas = [];
   for (const usuario of usuariosRegulares) {
      const carpetaPrincipal = await Carpeta.create({ 
        nombre: 'Carpeta Principal', 
        propietario_id: usuario._id,
        carpeta_padre_id: null
      });
      carpetas.push(carpetaPrincipal);

      const subCarpeta = await Carpeta.create({
        nombre: 'Subcarpeta 1', 
        propietario_id: usuario._id,
        carpeta_padre_id: carpetaPrincipal._id
      });
      carpetas.push(subCarpeta);
    }
    console.log('✅ Carpetas creadas.');

    // Crear archivos para cada carpeta
    const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: 'fs' });
    const archivos = [];
    const historiales = [];
    for (let i = 0; i < 50; i++) {
      const propietario = usuariosRegulares[i % usuariosRegulares.length];
      const carpetaAsignada = carpetas[i % carpetas.length];
      const isMarkdown = i % 2 === 0; // Alternar entre archivos de texto y markdown
      const extension = isMarkdown ? 'md' : 'txt';
      const mimeType = isMarkdown ? 'text/markdown' : 'text/plain';

      const nombreArchivo = `archivo_prueba_${i}.${extension}`;
      const contenido =  `Este es el contenido autogenerado para el archivo ${nombreArchivo}`;
      const uploadStream = bucket.openUploadStream(nombreArchivo, { contentType: mimeType });
      uploadStream.end(contenido);
      await new Promise((resolve) => uploadStream.on('finish', resolve));

      // Crear documento en la colección Archivos
      const nuevoArchivo = await Archivo.create({
        nombre: nombreArchivo,
        tipo_archivo: mimeType,
        tamano: Buffer.byteLength(contenido),
        propietario_id: propietario._id,
        carpeta_id: carpetaAsignada._id,
        gridfs_id: uploadStream.id
      });
      archivos.push(nuevoArchivo);

      // Generar Historial de creacion
      historiales.push({
        usuario_id: propietario._id,
        recurso_id: nuevoArchivo._id,
        tipo_recurso: 'archivo',
        accion: 'creacion'
      });

      // Sumar espacio al usuario
      await Usuario.findByIdAndUpdate(propietario._id, { $inc: { espacioUtilizado: nuevoArchivo.tamano } });
    }
    console.log('50 Archivos creados físicamente en GridFS y registrados.');

    const permisosDisponibles = ['lectura', 'edicion', 'comentar'];
    for (let i = 0; i < 20; i++) {
      const archivoTarget = archivos[i]; // Tomamos los primeros 20 archivos
      const beneficiario = usuariosRegulares.find(u => u._id.toString() !== archivoTarget.propietario_id.toString());
      const nivel = permisosDisponibles[i % 3];

      archivoTarget.accesos.push({ usuario_id: beneficiario._id, nivel_permiso: nivel });
      await archivoTarget.save();

      historiales.push({
        usuario_id: archivoTarget.propietario_id,
        recurso_id: archivoTarget._id,
        tipo_recurso: 'archivo',
        accion: 'compartir',
        detalles: `Compartido con ${beneficiario.correo} (${nivel})`
      });
    }
    console.log('✅ 20 Operaciones de compartición realizadas.');

    for (let i = 45; i < 50; i++) { // Mandamos a papelera los últimos 5 archivos
      const archivoEliminado = archivos[i];
      archivoEliminado.estado = 'papelera';
      await archivoEliminado.save();

      historiales.push({
        usuario_id: archivoEliminado.propietario_id,
        recurso_id: archivoEliminado._id,
        tipo_recurso: 'archivo',
        accion: 'eliminacion'
      });
    }
    console.log('✅ Elementos enviados a la papelera.');

    await HistorialActividad.insertMany(historiales);
    console.log('✅ Historial de actividades guardado.');

    console.log('🎉 Carga inicial completada con éxito. El sistema cumple con todos los requisitos.');
    process.exit();
  } catch (error) {
    console.error('❌ Error poblando la base de datos:', error);
    process.exit(1);
  }
};

poblarBaseDeDatos();
