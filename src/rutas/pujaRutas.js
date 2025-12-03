const express = require('express');
const router = express.Router();
const ctrl = require('../controladores/pujaController');
const { verifyToken } = require('../middlewares/auth');

// Crear puja (protegido)
router.post('/pujas', verifyToken, ctrl.crearPuja);

// Listar todas o filtrar por producto
router.get('/pujas', ctrl.obtenerPujas);

// Obtener pujas del usuario autenticado
router.get('/pujas/mias', verifyToken, ctrl.obtenerPujasDelUsuario);

// Obtener puja por ID
router.get('/pujas/:id', ctrl.obtenerPujaPorId);

// Eliminar puja (protegido)
router.delete('/pujas/:id', verifyToken, ctrl.eliminarPuja);

module.exports = router;