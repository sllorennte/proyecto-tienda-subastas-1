const express         = require('express');
const router          = express.Router();
const ctrl            = require('../controladores/resenaController');
const { verifyToken } = require('../middlewares/auth');

// Listar reseñas de un producto
router.get('/resenas', ctrl.obtenerResenasPorProducto);

// Crear nueva reseña
router.post('/resenas', verifyToken, ctrl.crearResena);

// Editar reseña propia
router.put('/resenas/:id', verifyToken, ctrl.actualizarResena);

// Borrar reseña propia
router.delete('/resenas/:id', verifyToken, ctrl.eliminarResena);

module.exports = router;
