import { mostrarNotificacion } from './notificacion.module.js';

document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('token');
  if (!token) return location.href = 'login.html';

  const tbody = document.querySelector('#usuarios-body');
  let idAEliminar = null;
  const modal = new bootstrap.Modal(document.getElementById('modalConfirmarEliminar'));
  const btnConfirmar = document.getElementById('btn-confirmar-eliminar');

  try {
    const res = await fetch(apiUrl('/api/usuarios'), {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) throw new Error('No se pudo obtener la lista de usuarios');

    const usuarios = await res.json();

    usuarios.forEach(usuario => {
      const fila = document.createElement('tr');
      fila.innerHTML = `
        <td>${usuario.username}</td>
        <td>${usuario.email}</td>
        <td>${usuario.rol || 'usuario'}</td>
        <td>
          <button class="btn btn-sm btn-outline-danger" data-id="${usuario._id}">
            Eliminar
          </button>
        </td>
      `;
      tbody.appendChild(fila);
    });

    tbody.addEventListener('click', e => {
      if (e.target.tagName === 'BUTTON') {
        idAEliminar = e.target.dataset.id;
        btnConfirmar.dataset.rowId = e.target.closest('tr').rowIndex;
        modal.show();
      }
    });

    btnConfirmar.addEventListener('click', async () => {
      if (!idAEliminar) return;

      try {
        const r = await fetch(apiUrl(`/api/usuarios/${idAEliminar}`), {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });

        if (r.ok) {
          const fila = tbody.querySelector(`tr:nth-child(${btnConfirmar.dataset.rowId})`);
          if (fila) fila.remove();
          mostrarNotificacion('Usuario eliminado correctamente', 'success');
        } else {
          mostrarNotificacion('Error al eliminar usuario', 'danger');
        }
      } catch (err) {
        console.error(err);
        mostrarNotificacion('Error al intentar eliminar usuario', 'danger');
      }

      idAEliminar = null;
      modal.hide();
    });

  } catch (err) {
    console.error(err);
    mostrarNotificacion('Error al cargar usuarios', 'danger');
  }
});
