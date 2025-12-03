const mongoose = require('mongoose');

const NotificacionSchema = new mongoose.Schema({
  usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  tipo: { type: String, enum: ['puja','mensaje','sistema','otro'], default: 'otro' },
  titulo: String,
  texto: String,
  link: String,
  leido: { type: Boolean, default: false },
  fecha: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Notificacion', NotificacionSchema);
