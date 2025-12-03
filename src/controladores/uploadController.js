const path = require('path');
const fs = require('fs');
const multer = require('multer');

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, '..', 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // sanitize name and add timestamp
    const safe = file.originalname.replace(/[^a-z0-9.\-\_\s]/gi, '').replace(/\s+/g, '_');
    const finalName = `${Date.now()}_${safe}`;
    cb(null, finalName);
  }
});

const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

exports.subirArchivos = [
  // middleware multer para multiples files con campo 'files'
  upload.array('files', 6),
  (req, res) => {
    try {
      if (!req.files || !req.files.length) return res.status(400).json({ error: 'No se recibieron ficheros' });
      const nombres = req.files.map(f => f.filename);
      // devolver nombres relativos (el frontend sabe agregar /uploads/)
      res.json({ archivos: nombres });
    } catch (err) {
      console.error('Error en subirArchivos', err);
      res.status(500).json({ error: 'Error subiendo archivos' });
    }
  }
];
