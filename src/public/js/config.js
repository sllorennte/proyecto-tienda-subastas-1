// config.js — configura la base de la API para el frontend
// Este archivo se carga mediante <script> clásico, por eso exponemos variables en `window`.
(function () {
  // Cambia esto si quieres apuntar a otro host/puerto en local
  const DEFAULT_API_BASE = 'http://localhost:3000';

  // `apiBase` puede ser sobrescrito por el entorno si es necesario
  window.apiBase = window.apiBase || DEFAULT_API_BASE;

  // Función utilitaria para construir URLs a la API
  window.apiUrl = function (path) {
    if (!path) return window.apiBase;
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    return window.apiBase.replace(/\/$/, '') + '/' + path.replace(/^\//, '');
  };
})();
