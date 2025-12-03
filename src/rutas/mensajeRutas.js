const express       = require('express');
const router        = express.Router();
const ctrl          = require('../controladores/mensajeController');
const { verifyToken } = require('../middlewares/auth');

router.get('/mensajes', verifyToken, ctrl.listarMensajes);
router.post('/mensajes/:id', verifyToken, ctrl.responderMensaje);
router.post('/mensajes', verifyToken, ctrl.crearMensaje);
router.delete('/mensajes/:id', verifyToken, ctrl.eliminarMensaje);

module.exports = router;
