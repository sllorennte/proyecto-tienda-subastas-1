// notificacion.module.js — ES module wrapper exporting mostrarNotificacion
export function mostrarNotificacion(mensaje, tipo = 'info') {
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

// Expose globally for classic pages
if (typeof window !== 'undefined') window.mostrarNotificacion = mostrarNotificacion;

// Unread badge & realtime listener (same as classic)
const _token_noti = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

async function fetchUnreadCount() {
  if (!window || !fetch) return;
  try {
    const headers = _token_noti ? { Authorization: 'Bearer ' + _token_noti } : {};
    const res = await fetch('/api/notificaciones/unread-count', { headers });
    if (!res.ok) return;
    const data = await res.json();
    updateBadge(Number(data.unread || 0));
  } catch (e) {
    console.warn('No se pudo obtener count notificaciones', e && e.message ? e.message : e);
  }
}

function updateBadge(count) {
  try {
    const anchors = document.querySelectorAll('a[href="notificaciones.html"]');
    anchors.forEach(a => {
      let b = a.querySelector('.noti-badge');
      if (!b) {
        b = document.createElement('span');
        b.className = 'noti-badge';
        b.style.cssText = 'display:inline-block;min-width:18px;height:18px;padding:0 6px;border-radius:12px;background:#dc3545;color:white;font-size:12px;text-align:center;margin-left:6px;line-height:18px;';
        a.appendChild(b);
      }
      b.textContent = count > 99 ? '99+' : String(count);
      b.style.display = count > 0 ? 'inline-block' : 'none';
      a.classList.toggle('has-noti', count > 0);
    });
  } catch (e) { console.warn('Error updating badge', e); }
}

try {
  function initSocketAndJoin() {
    if (typeof window === 'undefined' || !window.io || !_token_noti) return false;
    const socket = io(window.SOCKET_URL || undefined);
    try {
      const payload = JSON.parse(atob(_token_noti.split('.')[1]));
      const uid = payload.id || payload._id;
      if (uid) socket.emit('joinUser', uid);
    } catch (e) { }
    socket.on('notificacion', () => fetchUnreadCount());
    return true;
  }

  // Try to initialize immediately; if Socket.IO script hasn't loaded yet, poll briefly
  if (!initSocketAndJoin()) {
    let attempts = 0;
    const iv = setInterval(() => {
      attempts += 1;
      if (initSocketAndJoin() || attempts >= 10) clearInterval(iv);
    }, 500);
  }
} catch (e) { }

if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    fetchUnreadCount();
    // ensure socket init is attempted on load as well
    try { if (typeof initSocketAndJoin === 'function') initSocketAndJoin(); } catch (e) {}
  });
}
