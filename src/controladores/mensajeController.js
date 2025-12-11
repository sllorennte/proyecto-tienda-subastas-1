const Mensaje = require('../modelos/Mensaje');
const Usuario = require('../modelos/Usuario');
const mongoose = require('mongoose');

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
    const idParam = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(idParam)) return res.status(400).json({ error: 'ID de mensaje inválido' });
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
    try {
      const io = req.app && req.app.locals && req.app.locals.io;
      const room = `user_${destinatarioId}`;
      if (io) io.to(room).emit('mensaje', { mensajeId: resp._id, from: userId });
    } catch (e) { console.warn('No se pudo emitir socket mensaje:', e && e.message ? e.message : e); }
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
    try {
      const io = req.app && req.app.locals && req.app.locals.io;
      const room = `user_${destinatario}`;
      if (io) io.to(room).emit('mensaje', { mensajeId: nuevoMensaje._id, from: remitente });
    } catch (e) { console.warn('No se pudo emitir socket mensaje:', e && e.message ? e.message : e); }
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

// Enviar mensaje al primer admin encontrado
exports.enviarSoporte = async (req, res) => {
  try {
    const remitente = req.user.id;
    const { texto } = req.body;
    if (!texto || typeof texto !== 'string' || texto.trim() === '') return res.status(400).json({ error: 'Texto vacío' });
    const admin = await Usuario.findOne({ rol: 'admin' });
    if (!admin) return res.status(404).json({ error: 'No hay administrador configurado' });

    console.log('enviarSoporte: remitente=', remitente, 'admin=', admin && admin._id);
    const nuevo = new Mensaje({ remitente, destinatario: admin._id, texto, fecha: new Date() });
    await nuevo.save();
    try {
      const io = req.app && req.app.locals && req.app.locals.io;
      const room = `user_${admin._id}`;
      if (io) io.to(room).emit('mensaje', { mensajeId: nuevo._id, from: remitente });
    } catch (e) { console.warn('No se pudo emitir socket mensaje soporte:', e && e.message ? e.message : e); }
    res.status(201).json(nuevo);
  } catch (err) {
    console.error('Error enviarSoporte:', err);
    // Para depuración temporal devolvemos detalles (eliminar en producción)
    res.status(500).json({ error: 'Error al enviar mensaje a soporte', details: err && err.message ? err.message : String(err), stack: err && err.stack ? err.stack.split('\n').slice(0,10) : undefined });
  }
};
