const express    = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose   = require('mongoose');
const path       = require('path');
require('dotenv').config();

const usuarioRutas  = require('./rutas/usuarioRutas');
const productoRutas = require('./rutas/productoRutas');
const pujaRutas     = require('./rutas/pujaRutas');
const resenasRutas  = require('./rutas/resenasRutas'); 
const mensajeRutas = require('./rutas/mensajeRutas');
const notificacionRutas = require('./rutas/notificacionRutas');
const uploadRutas = require('./rutas/uploadRutas');
const transaccionRutas = require('./rutas/transaccionRutas');
const favoritoRutas = require('./rutas/favoritoRutas');

const app = express();
const http = require('http');
const server = http.createServer(app);
let io;
try {
  const { Server } = require('socket.io');
  io = new Server(server, { cors: { origin: '*' } });
  app.locals.io = io;
  io.on('connection', socket => {
    console.log('Socket conectado:', socket.id);
    socket.on('joinProducto', productoId => {
      const room = `producto_${productoId}`;
      socket.join(room);
      console.log(`Socket ${socket.id} joined ${room}`);
    });

    socket.on('joinUser', userId => {
      const room = `user_${userId}`;
      socket.join(room);
      console.log(`Socket ${socket.id} joined user room ${room}`);
    });
  });
} catch (e) {
  console.warn('Socket.IO no disponible:', e.message);
}

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// CORS: permitir peticiones desde el frontend. En producción define FRONTEND_URL
const allowedOrigin = process.env.FRONTEND_URL && process.env.FRONTEND_URL.trim() !== '' ? process.env.FRONTEND_URL : '*';
app.use(cors({ origin: allowedOrigin, credentials: true }));
app.options('*', cors());

// Conexión a MongoDB
const defaultLocalUri = 'mongodb://127.0.0.1:27017/tienda';
const mongoUri = process.env.MONGODB_URI && process.env.MONGODB_URI.trim() !== '' ? process.env.MONGODB_URI : defaultLocalUri;

// Loguear la URI usada 
const hideCredentials = uri => {
  try {
    if (uri.includes('@')) {
      const parts = uri.split('@');
      const before = parts[0];
      const after = parts.slice(1).join('@');
      const ob = before.split('//')[0] + '//***:***@' + after;
      return ob;
    }
    return uri;
  } catch (e) {
    return 'URI inválida';
  }
};

console.log(`Usando MONGODB_URI: ${hideCredentials(mongoUri)}`);

mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})
.then(() => console.log('MongoDB conectado'))
.catch(err => {
  console.error('Error de conexión a MongoDB:', err.message || err);
  console.warn('La aplicación continuará ejecutándose, pero la funcionalidad de DB no estará disponible hasta que la conexión se restablezca.');
});

// rutas bajo /api
app.use('/api', usuarioRutas);    // /api/usuarios...
app.use('/api', productoRutas);   // /api/productos...
app.use('/api', pujaRutas);       // /api/pujas...
app.use('/api', resenasRutas);    // /api/resenas...
app.use('/api', mensajeRutas);
app.use('/api', notificacionRutas);
app.use('/api', uploadRutas);
app.use('/api', transaccionRutas);
app.use('/api', favoritoRutas);

// Punto de entrada del front-end
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Health check sencillo para plataformas de despliegue
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.get('/favoritos.html', (req, res) => res.sendFile(path.join(__dirname, 'public', 'favoritos.html')));
app.get('/notificaciones.html', (req, res) => res.sendFile(path.join(__dirname, 'public', 'notificaciones.html')));
app.get('/transacciones.html', (req, res) => res.sendFile(path.join(__dirname, 'public', 'transacciones.html')));
app.get('/subastas-finalizadas.html', (req, res) => res.sendFile(path.join(__dirname, 'public', 'subastas-finalizadas.html')));

// servidor
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Servidor en puerto ${PORT}`));

// Mejor manejo de errores en el servidor 
server.on('error', err => {
  if (err && err.code === 'EADDRINUSE') {
    console.error(`Error: puerto ${PORT} en uso. Asegúrate de que no haya otra instancia ejecutándose o cambia la variable PORT.`);
    process.exit(1);
  }
  console.error('Error en el servidor:', err);
  process.exit(1);
});

// Cerrar servidor limpiamente en SIGINT/SIGTERM 
process.on('SIGINT', () => {
  console.log('Recibido SIGINT, cerrando servidor...');
  server.close(() => process.exit(0));
});
process.on('SIGTERM', () => {
  console.log('Recibido SIGTERM, cerrando servidor...');
  server.close(() => process.exit(0));
});

// Nodemon reinicia enviando SIGUSR2; cerrar limpio evita EADDRINUSE
process.once('SIGUSR2', () => {
  console.log('Recibido SIGUSR2 (nodemon), reiniciando servidor...');
  server.close(() => {
    process.kill(process.pid, 'SIGUSR2');
  });
});

// revisa y emite cierre de subastas cada 30s
const Producto = require('./modelos/Producto');
const Puja = require('./modelos/Puja');
const Transaccion = require('./modelos/Transaccion');
setInterval(async () => {
  if (!io) return;
  try {
    const now = new Date();
    const expiradas = await Producto.find({ estado: 'activo', fechaExpiracion: { $lte: now } });
    for (const p of expiradas) {
      // Intentar cerrar la subasta : actualizar producto, crear transacción y emitir evento
      try {
        let session;
        try {
          session = await mongoose.startSession();
        } catch (se) {
          session = null;
        }

        if (session && typeof session.withTransaction === 'function') {
          await session.withTransaction(async () => {
            // re-load producto dentro de la sesión para evitar condiciones de carrera
            const prod = await Producto.findOne({ _id: p._id, estado: 'activo' }).session(session);
            if (!prod) return; // ya gestionado 

            // buscar la puja más alta
            const highest = await Puja.find({ producto: prod._id }).sort({ cantidad: -1 }).limit(1).session(session).populate('pujador', 'username email');
            const ganador = highest.length ? highest[0].pujador : null;
            const precioFinal = highest.length ? highest[0].cantidad : prod.precioInicial;

            prod.estado = 'vendido';
            prod.ganador = ganador ? ganador._id : null;
            prod.precioFinal = precioFinal;
            await prod.save({ session });

            // crear transaccion si hay ganador
            if (ganador) {
              await Transaccion.create([
                {
                  usuario: ganador._id,
                  producto: prod._id,
                  tipo: 'recibo',
                  importe: precioFinal,
                  estado: 'completada',
                  meta: { generadoPor: 'job_expiracion' }
                }
              ], { session });
            }
          });
          if (session) session.endSession();
        } else {
          // comprobar estado antes de modificar
          const prod = await Producto.findOne({ _id: p._id, estado: 'activo' });
          if (!prod) continue;
          const highest = await Puja.find({ producto: prod._id }).sort({ cantidad: -1 }).limit(1).populate('pujador', 'username email');
          const ganador = highest.length ? highest[0].pujador : null;
          const precioFinal = highest.length ? highest[0].cantidad : prod.precioInicial;

          prod.estado = 'vendido';
          prod.ganador = ganador ? ganador._id : null;
          prod.precioFinal = precioFinal;
          await prod.save();

          if (ganador) {
            await Transaccion.create({ usuario: ganador._id, producto: prod._id, tipo: 'recibo', importe: precioFinal, estado: 'completada', meta: { generadoPor: 'job_expiracion' } });
          }
        }

        // Emitir evento con la información final (intenta obtener ganador y precio desde el producto actualizado)
        const prodFinal = await Producto.findById(p._id).populate('ganador', 'username email');
        const room = `producto_${p._id}`;
        io.to(room).emit('subastaCerrada', { producto: p._id, ganador: prodFinal.ganador ? prodFinal.ganador._id : null, precioFinal: prodFinal.precioFinal });
        console.log('Emitido subastaCerrada para', p._id);
      } catch (innerErr) {
        console.error('Error cerrando subasta para', p._id, innerErr);
      }
    }
  } catch (err) {
    console.error('Error job expiracion:', err);
  }
}, 30 * 1000);