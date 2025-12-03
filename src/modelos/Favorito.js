const mongoose = require('mongoose');

const FavoritoSchema = new mongoose.Schema({
  usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  producto: { type: mongoose.Schema.Types.ObjectId, ref: 'Producto', required: true },
  fecha: { type: Date, default: Date.now }
});

FavoritoSchema.index({ usuario: 1, producto: 1 }, { unique: true });

module.exports = mongoose.model('Favorito', FavoritoSchema);
