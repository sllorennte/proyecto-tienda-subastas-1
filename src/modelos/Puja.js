const mongoose = require('mongoose');

const pujaSchema = new mongoose.Schema({
  producto: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Producto',
    required: true
  },
  pujador: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  cantidad: {
    type: Number,
    required: true,
    min: 0
  },
  fechaPuja: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Puja', pujaSchema);