const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Usuario = require('./models/Usuario');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

const usuariosIniciales = [
  { nombres: "Admin", apellidos: "Sistema", correo: "admin@empresa.com", rol: "administrador", contrasena: "password123" },
  { nombres: "Carlos", apellidos: "Gómez", correo: "carlos@empresa.com", rol: "usuario", contrasena: "password123" },
  { nombres: "María", apellidos: "López", correo: "maria@empresa.com", rol: "usuario", contrasena: "password123" },
  { nombres: "Juan", apellidos: "Pérez", correo: "juan@empresa.com", rol: "usuario", contrasena: "password123" },
  { nombres: "Ana", apellidos: "Martínez", correo: "ana@empresa.com", rol: "usuario", contrasena: "password123" },
  { nombres: "Luis", apellidos: "García", correo: "luis@empresa.com", rol: "usuario", contrasena: "password123" },
  { nombres: "Laura", apellidos: "Díaz", correo: "laura@empresa.com", rol: "usuario", contrasena: "password123" },
  { nombres: "José", apellidos: "Hernández", correo: "jose@empresa.com", rol: "usuario", contrasena: "password123" }
];

const poblarBaseDeDatos = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Conectado a MongoDB para la carga inicial...');

    // Limpiar usuarios existentes
    await Usuario.deleteMany({});
    console.log('Colección de usuarios limpiada.');

    const salt = await bcrypt.genSalt(10);
    
    // Encriptar utilizando el campo 'contrasena'
    for (let user of usuariosIniciales) {
      user.contrasena = await bcrypt.hash(user.contrasena, salt);
    }

    await Usuario.insertMany(usuariosIniciales);
    console.log('8 Usuarios iniciales creados exitosamente.');

    process.exit();
  } catch (error) {
    console.error('Error poblando la base de datos:', error);
    process.exit(1);
  }
};

poblarBaseDeDatos();