import { mostrarNotificacion } from './notificacion.module.js';

document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('token');
  if (!token) return location.href = 'login.html';

  const tbody = document.getElementById('pujas-body');
  let idAEliminar = null;
  const modal = new bootstrap.Modal(document.getElementById('modalConfirmarEliminar'));
  const btnConfirmar = document.getElementById('btn-confirmar-eliminar');

  try {
    const res = await fetch('/api/pujas', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('No se pudieron obtener pujas');
    const pujas = await res.json();

    if (!pujas || pujas.length === 0) {
      const tr = document.createElement('tr');
      tr.innerHTML = '<td colspan="5" class="text-center">No hay pujas registradas.</td>';
      tbody.appendChild(tr);
    } else {
      pujas.forEach(p => {
      const fila = document.createElement('tr');
      fila.innerHTML = `
        <td>${p.producto?.titulo || 'Desconocido'}</td>
        <td>${p.pujador?.username || 'Desconocido'}</td>
        <td>${Number(p.cantidad).toFixed(2)} €</td>
        <td>${new Date(p.fechaPuja).toLocaleString()}</td>
        <td><button class="btn btn-sm btn-outline-danger" data-id="${p._id}">Eliminar</button></td>
      `;
      tbody.appendChild(fila);
      });
    }

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
        const r = await fetch(`/api/pujas/${idAEliminar}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
        if (r.ok) {
          const fila = tbody.querySelector(`tr:nth-child(${btnConfirmar.dataset.rowId})`);
          if (fila) fila.remove();
          mostrarNotificacion('Puja eliminada correctamente', 'success');
        } else {
          mostrarNotificacion('Error al eliminar puja', 'danger');
        }
      } catch (err) {
        console.error(err);
        mostrarNotificacion('Error de red al eliminar puja', 'danger');
      }
      idAEliminar = null;
      modal.hide();
    });

  } catch (err) {
    console.error(err);
    mostrarNotificacion('Error al cargar pujas', 'danger');
  }
});