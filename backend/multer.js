const multer = require('multer');
const path = require('path');
const fs = require('fs');

const carpetaFotos = path.join(__dirname, 'uploads', 'fotos');
if (!fs.existsSync(carpetaFotos)) fs.mkdirSync(carpetaFotos, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, carpetaFotos),
  filename: (req, file, cb) => {
    const nombreUnico = `${Date.now()}-${req.body.cedula || 'sinCedula'}.jpg`;
    cb(null, nombreUnico);
  }
});

const upload = multer({ storage });
module.exports = upload;