const Mensaje = require('../modelos/Mensaje');

exports.listarMensajes = async (req, res) => {
  try {
    // el usuario autenticado ve todos los mensajes donde sea destinatario
    const userId = req.user.id;
    const msgs = await Mensaje.find({ destinatario: userId })
                              .sort({ fecha: -1 });
    res.json(msgs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al listar mensajes' });
  }
};

exports.responderMensaje = async (req, res) => {
  try {
    const userId = req.user.id;
    const { texto } = req.body;
    if (!texto || typeof texto !== 'string' || texto.trim() === '') return res.status(400).json({ error: 'Texto de la respuesta vacío' });
    const orig = await Mensaje.findById(req.params.id);
    if (!orig) return res.status(404).json({ error: 'Mensaje no encontrado' });
    // destinatario debe ser el _id del remitente original
    const destinatarioId = orig.remitente && orig.remitente._id ? orig.remitente._id : orig.remitente;
    console.log('Responder mensaje: orig.remitente =>', orig.remitente, 'destinatarioId =>', destinatarioId, 'userId =>', userId);
    const resp = new Mensaje({
      remitente: userId,
      destinatario: destinatarioId,
      texto
    });
    await resp.save();
    res.status(201).json(resp);
  } catch (err) {
    console.error('Error en responderMensaje:', err);
    res.status(500).json({ error: 'Error al responder mensaje', details: err && err.message ? err.message : String(err) });
  }
};

exports.crearMensaje = async (req, res) => {
  try {
    const remitente = req.user.id;
    const { destinatario, texto } = req.body;

    if (!destinatario || !texto) {
      return res.status(400).json({ error: 'Faltan destinatario o texto' });
    }

    const nuevoMensaje = new Mensaje({
      remitente,
      destinatario,
      texto,
      fecha: new Date()
    });

    await nuevoMensaje.save();
    res.status(201).json(nuevoMensaje);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al enviar el mensaje' });
  }
};

exports.eliminarMensaje = async (req, res) => {
  try {
    const usuarioId = req.user && req.user.id;
    const id = req.params.id;
    // allow deletion if the authenticated user is either destinatario or remitente
    const encontrado = await Mensaje.findOneAndDelete({ _id: id, $or: [{ destinatario: usuarioId }, { remitente: usuarioId }] });
    if (!encontrado) return res.status(404).json({ error: 'Mensaje no encontrado o sin permiso para eliminar' });
    res.json({ mensaje: 'Mensaje eliminado' });
  } catch (err) {
    console.error('Error al eliminar mensaje:', err);
    res.status(500).json({ error: 'Error al eliminar mensaje', details: err && err.message ? err.message : String(err) });
  }
};
