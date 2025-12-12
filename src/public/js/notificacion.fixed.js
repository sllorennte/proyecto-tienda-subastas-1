// notificacion.fixed.js — versión no-modular para <script> clásico
function mostrarNotificacion(mensaje, tipo = 'info') {
  const container = document.getElementById('notificacion-container');
  if (!container) return;

  const div = document.createElement('div');
  div.className = `toast align-items-center text-bg-${tipo} border-0 show mb-2`;
  div.setAttribute('role', 'alert');
  div.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">${mensaje}</div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
    </div>
  `;
  container.appendChild(div);

  setTimeout(() => div.remove(), 4000);
}

window.mostrarNotificacion = mostrarNotificacion;

// Código para badge de notificaciones y socket (versión clásica)
var _token_noti = (typeof window !== 'undefined') ? localStorage.getItem('token') : null;

function updateBadge(count) {
  try {
    var anchors = document.querySelectorAll('a[href="notificaciones.html"]');
    anchors.forEach(function(a) {
      var b = a.querySelector('.noti-badge');
      if (!b) {
        b = document.createElement('span');
        b.className = 'noti-badge';
        b.style.cssText = 'display:inline-block;min-width:18px;height:18px;padding:0 6px;border-radius:12px;background:#dc3545;color:white;font-size:12px;text-align:center;margin-left:6px;line-height:18px;';
        a.appendChild(b);
      }
      b.textContent = (count > 99) ? '99+' : String(count);
      b.style.display = (count > 0) ? 'inline-block' : 'none';
      a.classList.toggle('has-noti', count > 0);
    });
  } catch (e) { console.warn('Error updating badge', e); }
}

function updateMessageDot(show) {
  try {
    var anchors = document.querySelectorAll('a[href="mensajes.html"]');
    anchors.forEach(function(a) {
      var d = a.querySelector('.msg-dot');
      if (!d) {
        d = document.createElement('span');
        d.className = 'msg-dot';
        d.style.cssText = 'display:inline-block;width:10px;height:10px;border-radius:50%;background:#dc3545;margin-left:6px;vertical-align:middle;';
        a.appendChild(d);
      }
      d.style.display = show ? 'inline-block' : 'none';
    });
  } catch (e) { console.warn('Error updating message dot', e); }
}

function fetchUnreadCount() {
  if (typeof window === 'undefined' || !fetch) return;
  // Si no hay token no intentamos llamar al endpoint protegido
  if (!_token_noti) {
    try { updateBadge(0); } catch (e) {}
    return;
  }

  var headers = { Authorization: 'Bearer ' + _token_noti };
  fetch('/api/notificaciones/unread-count', { headers: headers }).then(function(res) {
    if (!res.ok) {
      // si no está autorizado, ocultamos badge
      if (res.status === 401) try { updateBadge(0); } catch (e) {}
      return null;
    }
    return res.json();
  }).then(function(data) {
    if (!data) return;
    updateBadge(Number(data.unread || 0));
  }).catch(function(err) { console.warn('No se pudo obtener count notificaciones', err && err.message ? err.message : err); });
}

function initSocketAndJoin() {
  if (typeof window === 'undefined' || !window.io || !_token_noti) return false;
  var socket = io(window.SOCKET_URL || undefined);
  try {
    var payload = JSON.parse(atob(_token_noti.split('.')[1]));
    var uid = payload.id || payload._id;
    if (uid) socket.emit('joinUser', uid);
  } catch (e) { }
  socket.on('notificacion', function() { fetchUnreadCount(); });
  socket.on('mensaje', function() { updateMessageDot(true); });
  return true;
}

// Intentar inicializar inmediatamente, si falla probar unas veces
if (!initSocketAndJoin()) {
  var attempts = 0;
  var iv = setInterval(function() {
    attempts += 1;
    if (initSocketAndJoin() || attempts >= 10) clearInterval(iv);
  }, 500);
}

if (typeof window !== 'undefined') {
  window.addEventListener('load', function() {
    fetchUnreadCount();
    try { if (typeof initSocketAndJoin === 'function') initSocketAndJoin(); } catch (e) {}
  });

  // Inicialmente ocultar punto de mensajes (se mostrará al recibir 'mensaje')
  try { updateMessageDot(false); } catch (e) {}
}

// Resaltar el enlace activo del header según la página actual
function activarNavSegunPagina() {
  try {
    const path = window.location.pathname.split('/').pop() || 'index.html';
    const page = (path === '' ? 'index.html' : path);
    const anchors = document.querySelectorAll('.app-nav a');
    anchors.forEach(a => a.classList.remove('is-active'));
    if (page === 'index.html') return; // no resaltar nada en la home
    anchors.forEach(a => {
      const href = a.getAttribute('href') || '';
      const file = href.split('/').pop();
      if (!file) return;
      if (file === page) a.classList.add('is-active');
      // páginas dinámicas como producto.html?id=... deben resaltar 'productos'
      if (page.startsWith('producto.html') && file === 'productos.html') a.classList.add('is-active');
    });
  } catch (e) {}
}

try { window.addEventListener('DOMContentLoaded', activarNavSegunPagina); } catch (e) {}
