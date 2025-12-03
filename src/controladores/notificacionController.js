const Notificacion = require('../modelos/Notificacion');

exports.obtenerNotificaciones = async (req, res) => {
  const usuarioId = req.user && req.user.id;
  const page = parseInt(req.query.page || '1', 10);
  const limit = parseInt(req.query.limit || '20', 10);
  if (!usuarioId) return res.status(401).json({ error: 'No autorizado' });
  try {
    const skip = (page - 1) * limit;
    const total = await Notificacion.countDocuments({ usuario: usuarioId });
    const items = await Notificacion.find({ usuario: usuarioId }).sort({ fecha: -1 }).skip(skip).limit(limit);
    res.json({ total, page, limit, items });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error al obtener notificaciones' }); }
};

exports.marcarLeido = async (req, res) => {
  const id = req.params.id;
  const usuarioId = req.user && req.user.id;
  try {
    const n = await Notificacion.findOneAndUpdate({ _id: id, usuario: usuarioId }, { leido: true }, { new: true });
    if (!n) return res.status(404).json({ error: 'Notificacion no encontrada' });
    res.json({ mensaje: 'Marcado como leído' });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error al marcar notificacion' }); }
};

exports.borrar = async (req, res) => {
  const id = req.params.id;
  const usuarioId = req.user && req.user.id;
  try {
    const n = await Notificacion.findOneAndDelete({ _id: id, usuario: usuarioId });
    if (!n) return res.status(404).json({ error: 'Notificacion no encontrada' });
    res.json({ mensaje: 'Notificacion eliminada' });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error al eliminar notificacion' }); }
};

// Devuelve el número de notificaciones no leídas para el usuario autenticado
exports.unreadCount = async (req, res) => {
  const usuarioId = req.user && req.user.id;
  if (!usuarioId) return res.status(401).json({ error: 'No autorizado' });
  try {
    const count = await Notificacion.countDocuments({ usuario: usuarioId, leido: { $ne: true } });
    res.json({ unread: count });
  } catch (err) {
    console.error('Error unreadCount:', err);
    res.status(500).json({ error: 'Error al contar notificaciones' });
  }
};
