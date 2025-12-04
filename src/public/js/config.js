// config.js — configura la base de la API para el frontend
// Este archivo se carga mediante <script> clásico, por eso exponemos variables en `window`.
(function () {
  // En producción queremos usar la URL del origen (misma entidad que sirve el frontend),
  // en desarrollo local permitimos `http://localhost:3000`.
  var detectedOrigin = (typeof window !== 'undefined' && window.location) ? window.location.origin : '';
  var isLocalHost = detectedOrigin.includes('localhost') || detectedOrigin.includes('127.0.0.1');
  var DEFAULT_API_BASE = isLocalHost ? 'http://localhost:3000' : detectedOrigin || 'http://localhost:3000';

  // `apiBase` puede ser sobrescrito por el entorno si es necesario (p. ej. para pruebas)
  // Si DEFAULT_API_BASE es igual al origen, dejaremos las rutas relativas funcionando.
  window.apiBase = window.apiBase || DEFAULT_API_BASE;

  // Función utilitaria para construir URLs a la API
  window.apiUrl = function (path) {
    if (!path) return window.apiBase;
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    return window.apiBase.replace(/\/$/, '') + '/' + path.replace(/^\//, '');
  };
})();
