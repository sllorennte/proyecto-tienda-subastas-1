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

function fetchUnreadCount() {
  if (typeof window === 'undefined' || !fetch) return;
  var headers = _token_noti ? { Authorization: 'Bearer ' + _token_noti } : {};
  fetch('/api/notificaciones/unread-count', { headers: headers }).then(function(res) {
    if (!res.ok) return;
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
}
