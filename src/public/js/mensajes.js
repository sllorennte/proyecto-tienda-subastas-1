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

    // Delete handlers
    document.querySelectorAll('.btn-eliminar').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.currentTarget.dataset.id;
        if (!confirm('¿Eliminar este mensaje? Esta acción no se puede deshacer.')) return;
        try {
          const res = await fetch(apiUrl(`/api/mensajes/${id}`), {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            mostrarNotificacion('Mensaje eliminado', 'success');
            // quitar tarjeta del DOM (proteger si closest no existe)
            const btnEl = e.currentTarget || e.target;
            const cardEl = (btnEl && typeof btnEl.closest === 'function') ? btnEl.closest('.card') : null;
            if (cardEl) {
              cardEl.remove();
            } else {
              // fallback: buscar el botón por id y eliminar su tarjeta
              const fallbackBtn = listaMensajes.querySelector(`.btn-eliminar[data-id="${id}"]`);
              const fallbackCard = (fallbackBtn && typeof fallbackBtn.closest === 'function') ? fallbackBtn.closest('.card') : null;
              if (fallbackCard) fallbackCard.remove();
              else console.warn('No se encontró tarjeta DOM para el mensaje eliminado, id=', id);
            }
            // si ya no quedan mensajes, mostrar sinMensajes
            if (!listaMensajes.querySelector('.card')) sinMensajes.classList.remove('d-none');
          } else {
            mostrarNotificacion('No se pudo eliminar el mensaje.', 'danger');
          }
        } catch (err) {
          console.error('Error borrando mensaje:', err);
          mostrarNotificacion('Error de red al eliminar mensaje.', 'danger');
        }
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

  } catch (err) {
    console.error(err);
    sinMensajes.textContent = 'Error al cargar tus mensajes.';
    sinMensajes.classList.remove('d-none');
  }
});
