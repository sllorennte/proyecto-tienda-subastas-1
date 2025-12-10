const express       = require('express');
const router        = express.Router();
const ctrl          = require('../controladores/mensajeController');
const { verifyToken } = require('../middlewares/auth');

router.get('/mensajes', verifyToken, ctrl.listarMensajes);
// Colocar la ruta de soporte antes de la ruta con :id para evitar colisiones
router.post('/mensajes/soporte', verifyToken, ctrl.enviarSoporte);
router.post('/mensajes/:id', verifyToken, ctrl.responderMensaje);
router.post('/mensajes', verifyToken, ctrl.crearMensaje);
router.delete('/mensajes/:id', verifyToken, ctrl.eliminarMensaje);

module.exports = router;
