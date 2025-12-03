const express = require('express');
const router = express.Router();
const notificacionController = require('../controladores/notificacionController');
const { verifyToken } = require('../middlewares/auth');

router.get('/notificaciones', verifyToken, notificacionController.obtenerNotificaciones);
router.get('/notificaciones/unread-count', verifyToken, notificacionController.unreadCount);
router.put('/notificaciones/:id/leer', verifyToken, notificacionController.marcarLeido);
router.delete('/notificaciones/:id', verifyToken, notificacionController.borrar);

module.exports = router;
