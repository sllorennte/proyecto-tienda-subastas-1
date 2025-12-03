const Usuario = require('../modelos/Usuario');
const bcrypt  = require('bcrypt');
const jwt     = require('jsonwebtoken');

exports.crearUsuario = async (req, res) => {
  try {
    const { username, email, password, rol = 'usuario' } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
    }

    const existe = await Usuario.findOne({ $or: [{ email }, { username }] });
    if (existe) {
      return res.status(400).json({ error: 'El usuario o email ya está en uso.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    const nuevoUsuario = new Usuario({
      username,
      email,
      password: hashed,
      rol
    });

    await nuevoUsuario.save();

    // Generar token automáticamente al registrarse
    const payload = {
      id: nuevoUsuario._id,
      username: nuevoUsuario.username,
      rol: nuevoUsuario.rol
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '2h'
    });

    res.status(201).json({ mensaje: 'Usuario creado', token });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno al crear usuario.' });
  }
};

exports.obtenerUsuarios = async (req, res) => {
  try {
    const usuarios = await Usuario.find().select('-password');
    res.json(usuarios);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al leer usuarios' });
  }
};

exports.obtenerUsuarioPorId = async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.params.id).select('-password');
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(usuario);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al leer usuario' });
  }
};

exports.actualizarUsuario = async (req, res) => {
  try {
    const { username, email } = req.body;
    const usuario = await Usuario.findByIdAndUpdate(
      req.params.id,
      { username, email },
      { new: true, runValidators: true }
    ).select('-password');
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json({ mensaje: 'Usuario actualizado', usuario });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: 'Error al actualizar', detalles: err });
  }
};

exports.eliminarUsuario = async (req, res) => {
  try {
    const usuario = await Usuario.findByIdAndDelete(req.params.id);
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json({ mensaje: 'Usuario eliminado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al eliminar' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const usuario = await Usuario.findOne({ email });
    if (!usuario) {
      return res.status(400).json({ error: 'Credenciales incorrectas' });
    }

    const isMatch = await bcrypt.compare(password, usuario.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Credenciales incorrectas' });
    }

    const payload = {
      id: usuario._id,
      username: usuario.username,
      rol: usuario.rol
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '2h'
    });

    res.json({ mensaje: 'Login exitoso', token });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};

exports.obtenerUsuarioActual = async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.user.id).select('-password');
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(usuario);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener usuario actual' });
  }
};