const Producto = require('../modelos/Producto');
const Puja = require('../modelos/Puja');

exports.crearProducto = async (req, res) => {
  try {
    const {
      titulo,
      descripcion,
      precioInicial,
      imagenes,
      vendedor,
      categoria,
      fechaExpiracion
    } = req.body;

    // Si la ruta está protegida con verifyToken, podemos usar el usuario autenticado como vendedor por defecto
    const vendedorId = vendedor || (req.user && req.user.id);

    if (!titulo || precioInicial == null || !vendedorId || !fechaExpiracion) {
      return res.status(400).json({
        error: 'Título, precio inicial, vendedor y fecha de expiración son obligatorios.'
      });
    }
    const fecha = new Date(fechaExpiracion);
    if (isNaN(fecha.getTime()) || fecha <= new Date()) {
      return res.status(400).json({ error: 'Fecha de expiración inválida o ya pasada.' });
    }

    let listaImagenes = [];
    if (imagenes && typeof imagenes === 'string') {
      listaImagenes = imagenes
        .split(',')
        .map(nombre => nombre.trim())
        .filter(nombre => nombre);

      const invalidas = listaImagenes.filter(nombre => {
        return !/\.(jpe?g|png|gif)$/i.test(nombre);
      });
      if (invalidas.length) {
        return res.status(400).json({
          error: `Estos nombres no parecen imágenes válidas: ${invalidas.join(', ')}`
        });
      }

      listaImagenes = listaImagenes.map(nombre => `/uploads/${nombre}`);
    }

    const producto = new Producto({
      titulo,
      descripcion,
      precioInicial: parseFloat(precioInicial),
      imagenes: listaImagenes,
      vendedor: vendedorId,
      categoria: categoria || 'General',
      fechaExpiracion: fecha
    });

    await producto.save();
    res.status(201).json({ mensaje: 'Producto creado', producto });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno al crear producto.' });
  }
};

exports.obtenerProductos = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit) || 10, 1);
    const search = req.query.search ? req.query.search.trim() : '';
    const categoria = req.query.categoria ? req.query.categoria.trim() : '';

  const filtro = {};
  // por defecto sólo devolvemos subastas activas en el listado público
  filtro.estado = 'activo';
    if (search) {
      filtro.$or = [
        { titulo: { $regex: search, $options: 'i' } },
        { descripcion: { $regex: search, $options: 'i' } }
      ];
    }
    if (categoria) {
      filtro.categoria = categoria;
    }

    const totalItems = await Producto.countDocuments(filtro);
    const totalPages = Math.ceil(totalItems / limit);
    const skip = (page - 1) * limit;

    const productos = await Producto.find(filtro)
      .populate('vendedor', 'username email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      metadata: {
        page,
        limit,
        totalPages,
        totalItems
      },
      productos
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al leer productos' });
  }
};

// Obtener subastas finalizadas (vendidas) con ganador y precio final
exports.obtenerFinalizadas = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit) || 10, 1);
    const skip = (page - 1) * limit;

    const filtro = { estado: 'vendido' };
    const totalItems = await Producto.countDocuments(filtro);
    const totalPages = Math.ceil(totalItems / limit);

    const productos = await Producto.find(filtro)
      .populate('vendedor', 'username email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Para cada producto buscamos la puja más alta para obtener ganador y precio final
    // Si el producto ya tiene campos resultado, úsalos; si no, intenta recuperar la puja más alta como fallback
    const productosConResultado = await Promise.all(productos.map(async p => {
      let ganador = null;
      let precioFinal = null;
      if (p.ganador) {
        ganador = await (await Producto.populate(p, { path: 'ganador', select: 'username email' })).ganador;
        precioFinal = p.precioFinal != null ? p.precioFinal : null;
      } else {
        const highest = await Puja.find({ producto: p._id }).sort({ cantidad: -1 }).limit(1).populate('pujador', 'username email');
        const top = highest.length ? highest[0] : null;
        ganador = top ? top.pujador : null;
        precioFinal = top ? top.cantidad : null;
      }
      return Object.assign({}, p.toObject(), { ganador, precioFinal });
    }));

    res.json({ metadata: { page, limit, totalPages, totalItems }, productos: productosConResultado });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al leer subastas finalizadas' });
  }
};

exports.obtenerProductoPorId = async (req, res) => {
  try {
    const producto = await Producto.findById(req.params.id)
      .populate('vendedor', 'username email');
    if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(producto);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al leer producto' });
  }
};

exports.obtenerCategorias = async (req, res) => {
  try {
    const categorias = await Producto.distinct('categoria');
    res.json(categorias);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al leer categorías' });
  }
};

exports.actualizarProducto = async (req, res) => {
  try {
    const datos = (({ titulo, descripcion, precioInicial, imagenes, fechaExpiracion, estado }) =>
      ({ titulo, descripcion, precioInicial, imagenes, fechaExpiracion, estado }))(req.body);

    if (datos.imagenes && typeof datos.imagenes === 'string') {
      let lista = datos.imagenes
        .split(',')
        .map(nombre => nombre.trim())
        .filter(nombre => nombre);
      const invalidas = lista.filter(nombre => !/\.(jpe?g|png|gif)$/i.test(nombre));
      if (invalidas.length) {
        return res.status(400).json({
          error: `Estos nombres no parecen imágenes válidas: ${invalidas.join(', ')}`
        });
      }
      datos.imagenes = lista.map(nombre => `/uploads/${nombre}`);
    }

    if (datos.fechaExpiracion) {
      const fecha = new Date(datos.fechaExpiracion);
      if (isNaN(fecha.getTime()) || fecha <= new Date()) {
        return res.status(400).json({ error: 'Fecha de expiración inválida o ya pasada.' });
      }
      datos.fechaExpiracion = fecha;
    }

    const producto = await Producto.findByIdAndUpdate(
      req.params.id,
      datos,
      { new: true, runValidators: true }
    );
    if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json({ mensaje: 'Producto actualizado', producto });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: 'Error al actualizar producto', detalles: err });
  }
};

exports.eliminarProducto = async (req, res) => {
  try {
    const producto = await Producto.findByIdAndDelete(req.params.id);
    if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json({ mensaje: 'Producto eliminado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al eliminar producto' });
  }
};

exports.obtenerProductosMios = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit) || 10, 1);
    const skip = (page - 1) * limit;

    const totalItems = await Producto.countDocuments({ vendedor: userId });
    const totalPages = Math.ceil(totalItems / limit);

    const productos = await Producto.find({ vendedor: userId })
      .populate('vendedor', 'username email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      metadata: { page, limit, totalPages, totalItems },
      productos
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener productos propios' });
  }
};