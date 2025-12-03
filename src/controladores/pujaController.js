const Puja     = require('../modelos/Puja');
const Producto = require('../modelos/Producto');

exports.crearPuja = async (req, res) => {
  try {
    const { producto: productoId } = req.body;
    let { cantidad } = req.body;
    const pujador = req.user && req.user.id;

    if (!pujador) {
      return res.status(401).json({ error: 'No autenticado. Token inválido o expirado.' });
    }

    if (cantidad === undefined || cantidad === null) {
      return res.status(400).json({ error: 'Cantidad de la puja requerida.' });
    }

    cantidad = Number(cantidad);
    if (isNaN(cantidad) || cantidad <= 0) {
      return res.status(400).json({ error: 'Cantidad inválida. Debe ser un número mayor que 0.' });
    }

      console.log('[crearPuja] inicio - user:', req.user ? { id: req.user.id, username: req.user.username } : null);
      console.log('[crearPuja] body:', { producto: productoId, cantidad });

    const producto = await Producto.findById(productoId);
    if (!producto) 
      return res.status(404).json({ error: 'Producto no encontrado' });

    const ahora = new Date();
    const exp = new Date(producto.fechaExpiracion);
    if (producto.estado !== 'activo' || ahora > exp)
      return res.status(400).json({ error: 'No se puede pujar: subasta cerrada' });

    const ultimaPuja = await Puja.find({ producto: productoId })
      .sort({ cantidad: -1 })
      .limit(1);

    const maxActual = ultimaPuja.length 
      ? ultimaPuja[0].cantidad 
      : producto.precioInicial;

      console.log('[crearPuja] producto.precioInicial:', producto.precioInicial, 'ultimaPuja:', ultimaPuja, 'maxActual:', maxActual);

    if (cantidad <= maxActual)
      return res.status(400).json({
        error: `La puja debe ser superior a ${maxActual}`
      });

    const puja = new Puja({ producto: productoId, pujador, cantidad });
    await puja.save();

    // Emitir evento en tiempo real si Socket.IO está disponible
    try {
      const io = req.app && req.app.locals && req.app.locals.io;
      if (io) {
        const room = `producto_${productoId}`;
        io.to(room).emit('nuevaPuja', {
          producto: productoId,
          pujador,
          cantidad,
          fechaPuja: puja.fechaPuja
        });
      }
    } catch (e) {
      console.warn('No se pudo emitir evento Socket.IO:', e.message || e);
    }

    res.status(201).json({ mensaje: 'Puja registrada', puja });
  } catch (err) {
      console.error('[crearPuja] error:', err);
      res.status(500).json({ error: 'Error al crear puja', detalles: err.message || err });
  }
};

exports.obtenerPujas = async (req, res) => {
  try {
    const filtro = {};
    if (req.query.producto) filtro.producto = req.query.producto;

    const pujas = await Puja.find(filtro)
      .populate('pujador', 'username email')
      .populate('producto', 'titulo precioInicial')
      .sort({ cantidad: -1 });

    res.json(pujas);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al leer pujas' });
  }
};

exports.obtenerPujaPorId = async (req, res) => {
  try {
    const puja = await Puja.findById(req.params.id)
      .populate('pujador', 'username email')
      .populate('producto', 'titulo precioInicial');
    if (!puja) return res.status(404).json({ error: 'Puja no encontrada' });
    res.json(puja);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al leer puja' });
  }
};

exports.eliminarPuja = async (req, res) => {
  try {
    const puja = await Puja.findByIdAndDelete(req.params.id);
    if (!puja) return res.status(404).json({ error: 'Puja no encontrada' });
    res.json({ mensaje: 'Puja eliminada' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al eliminar puja' });
  }
};

exports.obtenerPujasDelUsuario = async (req, res) => {
  try {
    const pujas = await Puja.find({ pujador: req.user.id })
      .populate('producto', 'titulo precioInicial fechaExpiracion estado')
      .sort({ cantidad: -1 });
    res.json(pujas);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener pujas del usuario' });
  }
};