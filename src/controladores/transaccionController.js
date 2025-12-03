const Transaccion = require('../modelos/Transaccion');

exports.obtenerTransacciones = async (req, res) => {
  const usuarioId = req.user && req.user.id;
  if (!usuarioId) return res.status(401).json({ error: 'No autorizado' });
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  try {
    const total = await Transaccion.countDocuments({ usuario: usuarioId });
    const items = await Transaccion.find({ usuario: usuarioId })
      .sort({ fecha: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('producto');
    res.json({ total, page, limit, items });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error al obtener transacciones' }); }
};
