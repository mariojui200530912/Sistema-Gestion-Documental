const multer = require('multer');
const { GridFsStorage } = require('multer-gridfs-storage');
require('dotenv').config();

const storage = new GridFsStorage({
    url: process.env.MONGODB_URI,
    file: (req, file) => {
        return {
            filename: file.originalname,
            bucketName: 'fs' // Nombre del bucket en GridFS
        };
    }
});

const fileFilter = (req, file, cb) => {
    const extensionsPermitidas = /txt|md/;
    const mimetypesPermitidos = /text\/plain|text\/markdown/;

    const extname = extensionsPermitidas.test(file.originalname.split('.').pop());
    const mimetype = mimetypesPermitidos.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true);
    } else {
        return cb(new Error('Solo se permiten archivos de texto (.txt, .md)'), false);
    }
}

const upload = multer({ storage, fileFilter });

module.exports = upload;