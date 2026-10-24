const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Inicializar express
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

app.use('/api', require('./routes'));

const frontendPath = path.join(__dirname, '../frontend/dist/frontend/browser');

app.use(express.static(frontendPath));

app.use((req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
});

const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;

mongoose.connect(MONGODB_URI)
    .then(() => {
        console.log('Conectado a la base de datos');
        app.listen(PORT, () => {
            console.log(`Servidor corriendo en http://localhost:${PORT}`);
        });
    })
    .catch(err => {
        console.error('Error al conectar a la base de datos', err);
    });

app.get('/', (req, res) => {
    res.send('Bienvenido al API sistema de gestión documental');
});

