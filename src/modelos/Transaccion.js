const mongoose = require('mongoose');

const TransaccionSchema = new mongoose.Schema({
  usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  producto: { type: mongoose.Schema.Types.ObjectId, ref: 'Producto' },
  tipo: { type: String, enum: ['pago','recibo'], required: true },
  importe: { type: Number, required: true },
  estado: { type: String, enum: ['pendiente','completada','fallida'], default: 'pendiente' },
  fecha: { type: Date, default: Date.now },
  meta: { type: Object }
});

module.exports = mongoose.model('Transaccion', TransaccionSchema);
