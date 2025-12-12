document.addEventListener('DOMContentLoaded', () => {
  const lista = document.getElementById('lista-finalizadas');
  const sin = document.getElementById('sin-finalizadas');
  const emptyCard = sin; // alias más claro en el código
  const pagNav = document.getElementById('paginacion');

  let items = [];
  let page = 1;
  const limit = 12;
  const token = localStorage.getItem('token');
  let isAdmin = false;
  try {
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      isAdmin = payload && (payload.role === 'admin' || payload.isAdmin === true || payload.admin === true);
    }
  } catch (e) { isAdmin = false; }

  // modal elements for admin deletion
  const deleteModalEl = document.getElementById('modal-eliminar-producto');
  const deleteProductBody = document.getElementById('delete-product-body');
  const confirmDeleteProductBtn = document.getElementById('confirm-delete-product');
  let bsDeleteModal = null;
  let pendingDeleteId = null;
  try { if (window.bootstrap && deleteModalEl) bsDeleteModal = new bootstrap.Modal(deleteModalEl); } catch (e) { bsDeleteModal = null; }

  loadPage(page);

  async function loadPage(p) {
    try {
      const res = await fetch(apiUrl(`/api/productos/finalizadas?page=${p}&limit=${limit}`));
      if (!res.ok) throw new Error('Error al obtener finalizadas');
      const data = await res.json();
      items = Array.isArray(data.productos) ? data.productos : [];
      render(items, data.metadata || { page: p, limit, totalPages: 1 });
    } catch (err) {
      console.error(err);
      sin.textContent = 'No se pudieron cargar las subastas finalizadas.';
      sin.classList.remove('d-none');
    }
  }

  function render(list, meta) {
    if (!Array.isArray(list) || list.length === 0) {
      lista.innerHTML = '';
      // mostrar empty state mejorado
      if (emptyCard) emptyCard.classList.remove('d-none');
      if (pagNav) pagNav.innerHTML = '';
      return;
    }
    if (emptyCard) emptyCard.classList.add('d-none');
    lista.innerHTML = '';

    list.forEach(p => {
      const img = (Array.isArray(p.imagenes) && p.imagenes.length) ? p.imagenes[0] : '/uploads/placeholder.svg';
      const ganador = p.ganador ? (p.ganador.username || 'Usuario') : null;
      const precio = p.precioFinal != null ? Number(p.precioFinal) : (p.precioInicial ? Number(p.precioInicial) : null);

  const card = document.createElement('article');
  card.className = 'product-card';
      card.innerHTML = `
        <div class="product-card__media"><img src="${img}" alt="${p.titulo}" onerror="this.onerror=null;this.src='/uploads/placeholder.svg'"></div>
        <div class="product-card__body">
          <h3>${p.titulo}</h3>
          <p>${p.descripcion || 'Sin descripción.'}</p>
          <div class="product-card__meta">
            <span><strong>Categoria:</strong> ${p.categoria || '—'}</span>
            <span><strong>Ganador:</strong> ${ganador ? ganador : '—'}</span>
          </div>
          <div class="mt-3 d-flex justify-content-between align-items-center">
            <div class="h4 mb-0 text-primary fw-bold">${precio != null ? `€${precio.toFixed(2)}` : '—'}</div>
            <div>
              <a href="producto.html?id=${p._id}" class="btn btn-outline-secondary">Ver ficha</a>
              ${isAdmin ? `<button data-delete="${p._id}" class="btn btn-danger ms-2 btn-delete-final btn-sm">Eliminar</button>` : ''}
            </div>
          </div>
        </div>
      `;
      // wrap in a Bootstrap column so the row displays boxed cards in a grid
      const col = document.createElement('div');
      col.className = 'col-12 col-md-6 col-lg-4';
      col.appendChild(card);
      lista.appendChild(col);
    });

    // attach delete handlers if admin
    if (isAdmin) {
      lista.querySelectorAll('.btn-delete-final').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = e.currentTarget.dataset.delete;
          pendingDeleteId = id;
          const card = e.currentTarget.closest('.product-card');
          const title = card ? (card.querySelector('h3') ? card.querySelector('h3').textContent : '') : '';
          deleteProductBody.textContent = title ? `¿Eliminar "${title}"? Esta acción no se puede deshacer.` : '¿Eliminar este producto? Esta acción no se puede deshacer.';
          try { if (bsDeleteModal) bsDeleteModal.show(); else if (confirm('Eliminar producto?')) doDeleteProduct(pendingDeleteId); } catch (err) { console.warn(err); }
        });
      });
    }

    // pagination
    buildPagination(meta.page, meta.totalPages);
  }

  if (confirmDeleteProductBtn) {
    confirmDeleteProductBtn.addEventListener('click', async () => {
      if (!pendingDeleteId) return;
      confirmDeleteProductBtn.disabled = true;
      try {
        await doDeleteProduct(pendingDeleteId);
      } finally {
        confirmDeleteProductBtn.disabled = false;
        pendingDeleteId = null;
        try { if (bsDeleteModal) bsDeleteModal.hide(); } catch (e) {}
      }
    });
  }

  async function doDeleteProduct(id) {
    try {
      const res = await fetch(apiUrl(`/api/productos/${id}`), {
        method: 'DELETE',
        headers: token ? { 'Authorization': 'Bearer ' + token } : {}
      });
      if (res.ok) {
        try { if (window.mostrarNotificacion) window.mostrarNotificacion('Producto eliminado', 'success'); } catch(e){}
        // remove element
        const btn = lista.querySelector(`.btn-delete-final[data-delete="${id}"]`);
        const col = btn ? btn.closest('.col-12') || btn.closest('.col-12.col-md-6') : null;
        if (col) col.remove();
        if (!lista.querySelector('.col-12, .col-md-6, .col-lg-4')) {
          sin.classList.remove('d-none');
        }
        return true;
      } else {
        try { if (window.mostrarNotificacion) window.mostrarNotificacion('No se pudo eliminar el producto.', 'danger'); } catch(e){}
        return false;
      }
    } catch (err) {
      console.error('Error borrando producto:', err);
      try { if (window.mostrarNotificacion) window.mostrarNotificacion('Error de red al eliminar producto.', 'danger'); } catch(e){}
      return false;
    }
  }

  function buildPagination(current, totalPages) {
    if (!pagNav) return;
    pagNav.innerHTML = '';
    const ul = document.createElement('ul');
    ul.className = 'pagination';

    const add = (label, pg, disabled = false, active = false) => {
      const li = document.createElement('li');
      li.className = 'page-item' + (disabled ? ' disabled' : '') + (active ? ' active' : '');
      const a = document.createElement('a');
      a.href = '#'; a.className = 'page-link'; a.textContent = label;
      a.addEventListener('click', e => { e.preventDefault(); if (!disabled) { page = pg; loadPage(pg); } });
      li.appendChild(a); ul.appendChild(li);
    };

    add('«', Math.max(1, current - 1), current === 1);
    const maxSlots = 7;
    let start = Math.max(1, current - Math.floor(maxSlots/2));
    let end = Math.min(totalPages, start + maxSlots - 1);
    if (end - start < maxSlots - 1) start = Math.max(1, end - maxSlots + 1);
    for (let i = start; i <= end; i++) add(i, i, false, i === current);
    add('»', Math.min(totalPages, current + 1), current === totalPages);

    pagNav.appendChild(ul);
  }
});