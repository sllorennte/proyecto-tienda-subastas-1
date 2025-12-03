const Favorito = require('../modelos/Favorito');

exports.listar = async (req, res) => {
  const usuarioId = req.user && req.user.id;
  if (!usuarioId) return res.status(401).json({ error: 'No autorizado' });
  try {
    const items = await Favorito.find({ usuario: usuarioId }).populate('producto');
    res.json(items);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error al obtener favoritos' }); }
};

exports.agregar = async (req, res) => {
  const usuarioId = req.user && req.user.id;
  const { producto } = req.body;
  if (!usuarioId) return res.status(401).json({ error: 'No autorizado' });
  if (!producto) return res.status(400).json({ error: 'producto requerido' });
  try {
    const fav = new Favorito({ usuario: usuarioId, producto });
    await fav.save();
    res.status(201).json({ mensaje: 'Agregado a favoritos' });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: 'Ya en favoritos' });
    console.error(err); res.status(500).json({ error: 'Error al agregar favorito' });
  }
};

exports.eliminar = async (req, res) => {
  const usuarioId = req.user && req.user.id;
  const id = req.params.id;
  if (!usuarioId) return res.status(401).json({ error: 'No autorizado' });
  try {
    const f = await Favorito.findOneAndDelete({ usuario: usuarioId, producto: id });
    if (!f) return res.status(404).json({ error: 'No encontrado' });
    res.json({ mensaje: 'Eliminado' });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error al eliminar favorito' }); }
};
