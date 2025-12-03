const express = require('express');
const router  = express.Router();
const ctrl    = require('../controladores/productoController');
const { verifyToken } = require('../middlewares/auth');

// Crear producto (protegido)
router.post('/productos', verifyToken, ctrl.crearProducto);

// Listar productos con paginación y búsqueda (público)
router.get('/productos', ctrl.obtenerProductos);

// Listar subastas finalizadas (vendidas)
router.get('/productos/finalizadas', ctrl.obtenerFinalizadas);

// Obtener productos del usuario autenticado (propios)
router.get('/productos/mios', verifyToken, ctrl.obtenerProductosMios);

// Obtener lista de categorías (registrar solo si existe el controlador)
if (ctrl && typeof ctrl.obtenerCategorias === 'function') {
	router.get('/categorias', ctrl.obtenerCategorias);
} else {
	console.warn('Controlador obtenerCategorias no disponible - ruta /categorias no registrada');
}

// Obtener producto por ID (público)
router.get('/productos/:id', ctrl.obtenerProductoPorId);

// Actualizar producto (protegido)
router.put('/productos/:id', verifyToken, ctrl.actualizarProducto);

// Eliminar producto (protegido)
router.delete('/productos/:id', verifyToken, ctrl.eliminarProducto);

module.exports = router;