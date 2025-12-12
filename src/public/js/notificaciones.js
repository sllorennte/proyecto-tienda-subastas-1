// Assumes token is stored in localStorage as 'token'
const token = localStorage.getItem('token');
const notiList = document.getElementById('noti-list');
const notiEmpty = document.getElementById('noti-empty');
// Delete modal elements
const deleteModalEl = document.getElementById('modal-eliminar-notificacion');
const deleteNotiBody = document.getElementById('delete-noti-body');
const confirmDeleteNotiBtn = document.getElementById('confirm-delete-notification');
let bsDeleteModal = null;
let pendingDeleteId = null;
try { if (window.bootstrap && deleteModalEl) bsDeleteModal = new bootstrap.Modal(deleteModalEl); } catch (e) { bsDeleteModal = null; }

async function loadNotificaciones() {
  try {
    const res = await fetch(apiUrl('/api/notificaciones'), { headers: { Authorization: 'Bearer ' + token } });
    if (!res.ok) throw new Error('Error fetching notificaciones');
    const data = await res.json();
    renderNotis(data.items || data);
  } catch (err) {
    if (notiEmpty) {
      notiList.innerHTML = '';
      notiEmpty.classList.remove('d-none');
    } else {
      notiList.innerHTML = '<p>Error cargando notificaciones</p>';
    }
    console.error(err);
  }
}

function renderNotis(items) {
  if (!items || items.length === 0) {
    notiList.innerHTML = '';
    if (notiEmpty) notiEmpty.classList.remove('d-none');
    return;
  }
  if (notiEmpty) notiEmpty.classList.add('d-none');
  notiList.innerHTML = '';
  items.forEach(n => {
    const div = document.createElement('div');
    div.className = 'card mb-3';
    div.style.padding = '1rem';
    div.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:start"><div><strong>${n.titulo || ''}</strong><p style="color:var(--brand-text-muted);margin:0.25rem 0">${n.texto || ''}</p><small style="color:var(--brand-text-muted)">${new Date(n.fecha).toLocaleString()}</small></div><div><button class="btn btn-outline-primary" data-id="${n._id}">Marcar leído</button> <button class="btn btn-outline-primary" data-del="${n._id}">Eliminar</button></div></div>`;
    notiList.appendChild(div);
  });
  notiList.querySelectorAll('button[data-id]').forEach(b => b.addEventListener('click', marcarLeido));
  notiList.querySelectorAll('button[data-del]').forEach(b => b.addEventListener('click', (e) => {
    // open modal confirmation instead of native confirm
    const id = e.currentTarget.dataset.del;
    pendingDeleteId = id;
    const card = e.currentTarget.closest('.card');
    const titulo = card ? (card.querySelector('strong') ? card.querySelector('strong').textContent : '') : '';
    deleteNotiBody.textContent = titulo ? `¿Eliminar "${titulo}"? Esta acción no se puede deshacer.` : '¿Eliminar esta notificación? Esta acción no se puede deshacer.';
    try { if (bsDeleteModal) bsDeleteModal.show(); else if (confirm('Eliminar notificación?')) doDelete(pendingDeleteId); } catch (err) { console.warn(err); }
  }));
}

async function marcarLeido(e) {
  const id = e.currentTarget.dataset.id;
  await fetch(apiUrl(`/api/notificaciones/${id}/leer`), { method: 'PUT', headers: { Authorization: 'Bearer ' + token } });
  loadNotificaciones();
}

async function eliminar(e) {
  // legacy fallback; kept for compatibility
  const id = e.currentTarget ? e.currentTarget.dataset.del : null;
  if (!id) return;
  await doDelete(id);
}

// confirm button handler for modal
if (confirmDeleteNotiBtn) {
  confirmDeleteNotiBtn.addEventListener('click', async () => {
    if (!pendingDeleteId) return;
    confirmDeleteNotiBtn.disabled = true;
    try {
      await doDelete(pendingDeleteId);
    } finally {
      confirmDeleteNotiBtn.disabled = false;
      pendingDeleteId = null;
      try { if (bsDeleteModal) bsDeleteModal.hide(); } catch (e) {}
    }
  });
}

async function doDelete(id) {
  try {
    const res = await fetch(apiUrl(`/api/notificaciones/${id}`), { method: 'DELETE', headers: { Authorization: 'Bearer ' + token } });
    if (res.ok) {
      try { if (window.mostrarNotificacion) window.mostrarNotificacion('Notificación eliminada', 'success'); }
      catch(e){}
      // remove card if present
      const btn = notiList.querySelector(`button[data-del="${id}"]`);
      const card = (btn && typeof btn.closest === 'function') ? btn.closest('.card') : null;
      if (card) card.remove();
      // if empty, show empty state
      if (!notiList.querySelector('.card')) {
        if (notiEmpty) notiEmpty.classList.remove('d-none');
      }
      return true;
    } else {
      try { if (window.mostrarNotificacion) window.mostrarNotificacion('No se pudo eliminar la notificación.', 'danger'); } catch(e){}
      return false;
    }
  } catch (err) {
    console.error('Error borrando notificación:', err);
    try { if (window.mostrarNotificacion) window.mostrarNotificacion('Error de red al eliminar notificación.', 'danger'); } catch(e){}
    return false;
  }
}

// Socket.IO: join user room if possible
if (window.io && token) {
  const socket = io(window.SOCKET_URL || undefined);
  // try decode user id from token minimal
  try { const payload = JSON.parse(atob(token.split('.')[1])); socket.emit('joinUser', payload.id || payload._id); socket.on('notificacion', n => { loadNotificaciones(); }); } catch (e) { }
}

loadNotificaciones();
