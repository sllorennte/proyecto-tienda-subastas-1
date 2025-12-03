const mongoose = require('mongoose');

const productoSchema = new mongoose.Schema({
  titulo: {
    type: String,
    required: true,
    trim: true
  },
  descripcion: String,
  precioInicial: {
    type: Number,
    required: true,
    min: 0
  },
  imagenes: [String],       // URLs de las imágenes
  vendedor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  categoria: {
    type: String,
    trim: true,
    default: 'General'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  fechaExpiracion: {
    type: Date,
    required: true
  },
  estado: {
    type: String,
    enum: ['activo', 'vendido', 'cancelado'],
    default: 'activo'
  }
});

// Campos opcionales para registrar el resultado final de la subasta
productoSchema.add({
  ganador: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', default: null },
  precioFinal: { type: Number, default: null }
});

// Índices útiles para consultas de expiración y estado
productoSchema.index({ estado: 1, fechaExpiracion: 1 });

module.exports = mongoose.model('Producto', productoSchema);