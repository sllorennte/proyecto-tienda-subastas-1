const express = require('express');
const router = express.Router();
const ctrl = require('../controladores/usuarioController');
const { verifyToken } = require('../middlewares/auth');

// Crear usuario
router.post('/usuarios', ctrl.crearUsuario);

// Obtener todos usuarios
router.get('/usuarios', ctrl.obtenerUsuarios);

// Obtener usuario autenticado (token)
router.get('/usuarios/me', verifyToken, ctrl.obtenerUsuarioActual);

// Obtener usuario por ID
router.get('/usuarios/:id', ctrl.obtenerUsuarioPorId);

// Actualizar usuario por ID
router.put('/usuarios/:id', ctrl.actualizarUsuario);

// Eliminar usuario por ID
router.delete('/usuarios/:id', ctrl.eliminarUsuario);

// Login
router.post('/login', ctrl.login);

module.exports = router;