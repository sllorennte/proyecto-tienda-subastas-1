const token = localStorage.getItem('token');
const list = document.getElementById('trans-list');
const pagination = document.getElementById('trans-pagination');
let page = 1, limit = 20;

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
  items.forEach(t => {
    const div = document.createElement('div');
    div.className = 'card mb-2';
    div.style.padding = '0.9rem';
    div.innerHTML = `<div style="display:flex;justify-content:space-between"><div><strong>${t.tipo}</strong><div style="color:var(--brand-text-muted)">${t.producto ? t.producto.titulo : 'Producto eliminado'}</div></div><div><strong>${t.importe} USD</strong><div style="color:var(--brand-text-muted)">${new Date(t.fecha).toLocaleString()}</div></div></div>`;
    list.appendChild(div);
  });
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
