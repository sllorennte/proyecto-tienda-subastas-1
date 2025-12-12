import { mostrarNotificacion } from './notificacion.module.js';

document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('token');
  if (!token) {
    return window.location.href = 'login.html';
  }

  const listaMensajes = document.getElementById('lista-mensajes');
  const sinMensajes = document.getElementById('no-mensajes');
  const modal = new bootstrap.Modal(document.getElementById('modal-respuesta'));
  const inputRespuesta = document.getElementById('input-respuesta');
  const btnEnviarRespuesta = document.getElementById('btn-enviar-respuesta');
  let mensajeIdSeleccionado = null;
  // Delete confirmation modal
  const deleteModalEl = document.getElementById('modal-eliminar-mensaje');
  const deleteMessageBody = document.getElementById('delete-message-body');
  const confirmDeleteBtn = document.getElementById('confirm-delete-message');
  let bsDeleteModal = null;
  let pendingDeleteId = null;
  try { if (window.bootstrap && deleteModalEl) bsDeleteModal = new bootstrap.Modal(deleteModalEl); } catch (e) { bsDeleteModal = null; }

  try {
    const res = await fetch(apiUrl('/api/mensajes'), {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!res.ok) throw new Error('Error al cargar mensajes');
    const mensajes = await res.json();

    // ocultar el punto de nuevo mensaje (si existe) cuando el usuario carga la página
    try { document.querySelectorAll('a[href="mensajes.html"]').forEach(a => { const d = a.querySelector('.msg-dot'); if (d) d.style.display = 'none'; }); } catch (e) {}

    if (!Array.isArray(mensajes) || mensajes.length === 0) {
      sinMensajes.classList.remove('d-none');
      return;
    }

    sinMensajes.classList.add('d-none');

    mensajes.forEach(m => {
      const card = document.createElement('div');
      card.className = 'card shadow-sm mb-3';

      const fechaFormateada = m.fecha ? new Date(m.fecha).toLocaleString() : '';
      const remitenteNombre = (m.remitente && (m.remitente.username || m.remitente.nombre)) ? (m.remitente.username || m.remitente.nombre) : 'Anónimo';

      card.innerHTML = `
        <div class="card-body d-flex flex-column gap-2">
          <div class="d-flex justify-content-between align-items-center">
            <div><strong>De: ${remitenteNombre}</strong><br/><small class="text-muted">${fechaFormateada}</small></div>
            <div class="btn-group">
              <button data-id="${m._id}" class="btn btn-outline-danger btn-sm btn-eliminar">Eliminar</button>
              <button data-id="${m._id}" class="btn btn-outline-primary btn-sm btn-responder">Responder</button>
            </div>
          </div>
          <p class="card-text mb-0">${m.texto}</p>
        </div>
      `;
      listaMensajes.appendChild(card);
    });

    document.querySelectorAll('.btn-responder').forEach(btn => {
      btn.addEventListener('click', (e) => {
        mensajeIdSeleccionado = e.currentTarget.dataset.id;
        inputRespuesta.value = '';
        modal.show();
      });
    });

    // Delete handlers (use modal confirmation)
    document.querySelectorAll('.btn-eliminar').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        pendingDeleteId = id;
        const card = e.currentTarget.closest('.card');
        const remitente = card ? (card.querySelector('strong') ? card.querySelector('strong').textContent : '') : '';
        deleteMessageBody.textContent = remitente ? `¿Eliminar ${remitente} - mensaje? Esta acción no se puede deshacer.` : '¿Eliminar este mensaje? Esta acción no se puede deshacer.';
        try { if (bsDeleteModal) bsDeleteModal.show(); else if (confirm('¿Eliminar este mensaje?')) doDeleteMessage(id); } catch (err) { console.warn(err); }
      });
    });

    btnEnviarRespuesta.addEventListener('click', async () => {
      const texto = inputRespuesta.value.trim();
      if (!texto) {
        mostrarNotificacion('Debes escribir una respuesta antes de enviarla.', 'warning');
        return;
      }

      try {
        const res = await fetch(apiUrl(`/api/mensajes/${mensajeIdSeleccionado}`), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ texto })
        });

        if (res.ok) {
          modal.hide();
          mostrarNotificacion('Respuesta enviada correctamente.', 'success');
        } else {
          mostrarNotificacion('Error al enviar la respuesta.', 'danger');
        }
      } catch (err) {
        console.error('Error al enviar la respuesta:', err);
        mostrarNotificacion('Error de red al enviar la respuesta.', 'danger');
      }
    });

    // perform deletion when modal confirmed
    if (confirmDeleteBtn) {
      confirmDeleteBtn.addEventListener('click', async () => {
        if (!pendingDeleteId) return;
        confirmDeleteBtn.disabled = true;
        try {
          await doDeleteMessage(pendingDeleteId);
        } finally {
          confirmDeleteBtn.disabled = false;
          pendingDeleteId = null;
          try { if (bsDeleteModal) bsDeleteModal.hide(); } catch (e) {}
        }
      });
    }

    async function doDeleteMessage(id) {
      try {
        const res = await fetch(apiUrl(`/api/mensajes/${id}`), {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          mostrarNotificacion('Mensaje eliminado', 'success');
          // remove card
          const btnEl = listaMensajes.querySelector(`.btn-eliminar[data-id="${id}"]`);
          const cardEl = (btnEl && typeof btnEl.closest === 'function') ? btnEl.closest('.card') : null;
          if (cardEl) cardEl.remove();
          if (!listaMensajes.querySelector('.card')) sinMensajes.classList.remove('d-none');
        } else {
          mostrarNotificacion('No se pudo eliminar el mensaje.', 'danger');
        }
      } catch (err) {
        console.error('Error borrando mensaje:', err);
        mostrarNotificacion('Error de red al eliminar mensaje.', 'danger');
      }
    }

  } catch (err) {
    console.error(err);
    sinMensajes.textContent = 'Error al cargar tus mensajes.';
    sinMensajes.classList.remove('d-none');
  }
});
