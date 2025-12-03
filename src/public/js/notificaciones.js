// Assumes token is stored in localStorage as 'token'
const token = localStorage.getItem('token');
const notiList = document.getElementById('noti-list');

async function loadNotificaciones() {
  try {
    const res = await fetch(apiUrl('/api/notificaciones'), { headers: { Authorization: 'Bearer ' + token } });
    if (!res.ok) throw new Error('Error fetching notificaciones');
    const data = await res.json();
    renderNotis(data.items || data);
  } catch (err) { notiList.innerHTML = '<p>Error cargando notificaciones</p>'; console.error(err); }
}

function renderNotis(items) {
  if (!items || items.length === 0) { notiList.innerHTML = '<p>No hay notificaciones.</p>'; return; }
  notiList.innerHTML = '';
  items.forEach(n => {
    const div = document.createElement('div');
    div.className = 'card mb-3';
    div.style.padding = '1rem';
    div.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:start"><div><strong>${n.titulo || ''}</strong><p style="color:var(--brand-text-muted);margin:0.25rem 0">${n.texto || ''}</p><small style="color:var(--brand-text-muted)">${new Date(n.fecha).toLocaleString()}</small></div><div><button class="btn btn-outline-primary" data-id="${n._id}">Marcar leído</button> <button class="btn btn-outline-primary" data-del="${n._id}">Eliminar</button></div></div>`;
    notiList.appendChild(div);
  });
  notiList.querySelectorAll('button[data-id]').forEach(b => b.addEventListener('click', marcarLeido));
  notiList.querySelectorAll('button[data-del]').forEach(b => b.addEventListener('click', eliminar));
}

async function marcarLeido(e) {
  const id = e.currentTarget.dataset.id;
  await fetch(apiUrl(`/api/notificaciones/${id}/leer`), { method: 'PUT', headers: { Authorization: 'Bearer ' + token } });
  loadNotificaciones();
}

async function eliminar(e) {
  const id = e.currentTarget.dataset.del;
  if (!confirm('Eliminar notificación?')) return;
  await fetch(apiUrl(`/api/notificaciones/${id}`), { method: 'DELETE', headers: { Authorization: 'Bearer ' + token } });
  loadNotificaciones();
}

// Socket.IO: join user room if possible
if (window.io && token) {
  const socket = io(window.SOCKET_URL || undefined);
  // try decode user id from token minimal
  try { const payload = JSON.parse(atob(token.split('.')[1])); socket.emit('joinUser', payload.id || payload._id); socket.on('notificacion', n => { loadNotificaciones(); }); } catch (e) { }
}

loadNotificaciones();
