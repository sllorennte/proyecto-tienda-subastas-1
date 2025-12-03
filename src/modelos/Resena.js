const mongoose = require('mongoose');
const { Schema } = mongoose;

const ResenaSchema = new Schema({
  producto: {
    type: Schema.Types.ObjectId,
    ref: 'Producto',
    required: true
  },
  usuario: {
    type: Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  calificacion: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },
  comentario: {
    type: String,
    trim: true,
    maxlength: 1000,
    default: ''
  },
  fecha: {
    type: Date,
    default: Date.now
  }
});

// Cada vez que hagamos un find, poblamos usuario.username
ResenaSchema.pre(/^find/, function(next) {
  this.populate('usuario', 'username');
  next();
});

module.exports = mongoose.model('Resena', ResenaSchema);
