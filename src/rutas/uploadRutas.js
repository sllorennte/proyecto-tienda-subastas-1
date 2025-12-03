const express = require('express');
const router = express.Router();
const ctrl = require('../controladores/uploadController');
const { verifyToken } = require('../middlewares/auth');

// Subir uno o varios ficheros (protegido)
router.post('/uploads', verifyToken, ctrl.subirArchivos);

module.exports = router;
