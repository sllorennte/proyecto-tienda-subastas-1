const Resena   = require('../modelos/Resena');
const Producto = require('../modelos/Producto');

// Crear una reseña
exports.crearResena = async (req, res) => {
  try {
    const { producto: productoId, calificacion, comentario } = req.body;
    const usuarioId = req.user.id;

    if (!productoId || !calificacion)
      return res.status(400).json({ error: 'Producto y calificación obligatorios.' });

    if (calificacion < 1 || calificacion > 5)
      return res.status(400).json({ error: 'La calificación debe estar entre 1 y 5.' });

    const producto = await Producto.findById(productoId);
    if (!producto) return res.status(404).json({ error: 'Producto no encontrado.' });

    const ya = await Resena.findOne({ producto: productoId, usuario: usuarioId });
    if (ya) return res.status(400).json({ error: 'Ya has reseñado este producto.' });

    const resena = await Resena.create({
      producto: productoId,
      usuario: usuarioId,
      calificacion,
      comentario: comentario || ''
    });

    await resena.populate('usuario', 'username');
    res.status(201).json(resena);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al crear reseña.' });
  }
};

// Obtener reseñas de un producto
exports.obtenerResenasPorProducto = async (req, res) => {
  try {
    const { producto: productoId } = req.query;
    if (!productoId)
      return res.status(400).json({ error: 'Query ?producto=<id> obligatoria.' });

    const resenas = await Resena.find({ producto: productoId })
      .sort({ fecha: -1 });
    res.json(resenas);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al leer reseñas.' });
  }
};

// Editar reseña propia
exports.actualizarResena = async (req, res) => {
  try {
    const { id } = req.params;
    const usuarioId = req.user.id;
    const { calificacion, comentario } = req.body;

    const resena = await Resena.findById(id);
    if (!resena) return res.status(404).json({ error: 'Reseña no encontrada.' });
    if (resena.usuario.toString() !== usuarioId)
      return res.status(403).json({ error: 'No autorizado.' });

    if (calificacion != null) {
      if (calificacion < 1 || calificacion > 5)
        return res.status(400).json({ error: 'Calificación 1–5.' });
      resena.calificacion = calificacion;
    }
    if (comentario != null) resena.comentario = comentario;

    await resena.save();
    await resena.populate('usuario', 'username');
    res.json(resena);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar reseña.' });
  }
};

// Borrar reseña propia
exports.eliminarResena = async (req, res) => {
  try {
    const { id } = req.params;
    const usuarioId = req.user.id;

    const resena = await Resena.findById(id);
    if (!resena) return res.status(404).json({ error: 'Reseña no encontrada.' });
    if (resena.usuario.toString() !== usuarioId)
      return res.status(403).json({ error: 'No autorizado.' });

    await Resena.findByIdAndDelete(id);
    res.json({ mensaje: 'Reseña eliminada.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al eliminar reseña.' });
  }
};
