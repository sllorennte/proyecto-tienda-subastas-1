const express = require('express');
const router = express.Router();
const favoritoController = require('../controladores/favoritoController');
const { verifyToken } = require('../middlewares/auth');

router.get('/favoritos', verifyToken, favoritoController.listar);
router.post('/favoritos', verifyToken, favoritoController.agregar);
router.delete('/favoritos/:id', verifyToken, favoritoController.eliminar);

module.exports = router;
