const mongoose = require('mongoose');

const usuarioSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  rol: {
    type: String,
    enum: ['admin', 'usuario'],
    default: 'usuario'
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Usuario', usuarioSchema);