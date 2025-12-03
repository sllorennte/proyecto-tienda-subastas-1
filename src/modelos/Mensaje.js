const mongoose = require('mongoose');
const { Schema, model, Types } = mongoose;

const mensajeSchema = new Schema({
  remitente:    { type: Types.ObjectId, ref: 'Usuario', required: true },
  destinatario: { type: Types.ObjectId, ref: 'Usuario', required: true },
  texto:        { type: String, required: true, trim: true },
  fecha:        { type: Date, default: Date.now }
});

// Siempre que hagamos find(), poblamos el remitente
mensajeSchema.pre(/^find/, function(next) {
  this.populate('remitente', 'username');
  next();
});

module.exports = model('Mensaje', mensajeSchema);
