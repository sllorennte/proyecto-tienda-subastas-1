const token = localStorage.getItem('token');
const list = document.getElementById('trans-list');
const pagination = document.getElementById('trans-pagination');
let page = 1, limit = 20;
// Modal delete elements
const deleteModalEl = document.getElementById('deleteTransactionModal');
const deleteMessageEl = document.getElementById('delete-transaction-message');
const confirmDeleteBtn = document.getElementById('confirm-delete-transaction');
let bsDeleteModal = null;
try { if (window.bootstrap && deleteModalEl) bsDeleteModal = new bootstrap.Modal(deleteModalEl); } catch (e) { bsDeleteModal = null; }
let pendingDeleteId = null;

async function loadTransacciones() {
  try {
    const res = await fetch(apiUrl(`/api/transacciones?page=${page}&limit=${limit}`), { headers: { Authorization: 'Bearer ' + token } });
    if (!res.ok) throw new Error('Error');
    const data = await res.json();
    render(data.items || []);
    buildPagination(data.total || 0, data.page || 1, data.limit || limit);
  } catch (err) { list.innerHTML = '<p>Error cargando transacciones</p>'; console.error(err); }
}

function render(items) {
  if (!items.length) { list.innerHTML = '<p>No hay transacciones.</p>'; return; }
  list.innerHTML = '';
  const nf = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });
  items.forEach(t => {
    const tipoLabel = (t.tipo === 'recibo') ? 'Subasta ganada' : (typeof t.tipo === 'string' ? (t.tipo.charAt(0).toUpperCase() + t.tipo.slice(1)) : t.tipo);
    const importeNum = t.importe != null ? Number(t.importe) : null;
    const importeText = (importeNum != null && !isNaN(importeNum)) ? nf.format(importeNum) : '—';

    const div = document.createElement('div');
    div.className = 'card mb-2';
    div.style.padding = '0.9rem';
    div.dataset.id = t._id;
    div.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:1rem">
        <div style="flex:1">
          <strong>${tipoLabel}</strong>
          <div style="color:var(--brand-text-muted)">${t.producto ? t.producto.titulo : 'Producto eliminado'}</div>
        </div>
        <div style="text-align:right">
          <strong>${importeText}</strong>
          <div style="color:var(--brand-text-muted)">${new Date(t.fecha).toLocaleString()}</div>
          <div style="margin-top:6px"><button class="btn btn-sm btn-outline-danger btn-delete-trans" data-id="${t._id}">Eliminar</button></div>
        </div>
      </div>
    `;
    list.appendChild(div);
  });

  // attach delete handlers
  list.querySelectorAll('.btn-delete-trans').forEach(btn => btn.addEventListener('click', (e) => {
    const id = e.currentTarget.dataset.id;
    pendingDeleteId = id;
    const card = e.currentTarget.closest('.card');
    const title = card ? card.querySelector('strong').textContent : 'transacción';
    deleteMessageEl.textContent = `¿Eliminar ${title}? Esta acción no se puede deshacer.`;
    try { if (bsDeleteModal) bsDeleteModal.show(); } catch (err) { if (confirm('Eliminar transacción?')) doDelete(); }
  }));
}

function buildPagination(total, currentPage, pageSize) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  let html = '';
  if (currentPage > 1) html += `<button class="btn btn-outline-primary" id="prev">Prev</button>`;
  html += ` <span style="margin:0 0.75rem">Página ${currentPage} de ${totalPages}</span>`;
  if (currentPage < totalPages) html += `<button class="btn btn-outline-primary" id="next">Next</button>`;
  pagination.innerHTML = html;
  const prev = document.getElementById('prev');
  const next = document.getElementById('next');
  if (prev) prev.addEventListener('click', () => { page--; loadTransacciones(); });
  if (next) next.addEventListener('click', () => { page++; loadTransacciones(); });
}

loadTransacciones();

// confirm delete action
if (confirmDeleteBtn) {
  confirmDeleteBtn.addEventListener('click', async () => {
    if (!pendingDeleteId) return;
    confirmDeleteBtn.disabled = true;
    try {
      const res = await fetch(apiUrl(`/api/transacciones/${pendingDeleteId}`), { method: 'DELETE', headers: { Authorization: 'Bearer ' + token } });
      if (!res.ok) throw new Error('Error eliminando');
      // remove from DOM
      const el = list.querySelector(`div.card[data-id="${pendingDeleteId}"]`);
      if (el) el.remove();
      if (typeof mostrarNotificacion === 'function') mostrarNotificacion('Transacción eliminada', 'success');
    } catch (err) {
      console.error(err);
      if (typeof mostrarNotificacion === 'function') mostrarNotificacion('No se pudo eliminar la transacción', 'danger');
    } finally {
      pendingDeleteId = null;
      confirmDeleteBtn.disabled = false;
      try { if (bsDeleteModal) bsDeleteModal.hide(); } catch (e) {}
    }
  });
}
