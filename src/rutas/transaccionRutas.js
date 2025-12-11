const express = require('express');
const router = express.Router();
const transaccionController = require('../controladores/transaccionController');
const { verifyToken } = require('../middlewares/auth');

router.get('/transacciones', verifyToken, transaccionController.obtenerTransacciones);
// Eliminar una transacción (propio)
router.delete('/transacciones/:id', verifyToken, transaccionController.eliminarTransaccion);

module.exports = router;
