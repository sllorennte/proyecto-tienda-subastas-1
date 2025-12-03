document.addEventListener('DOMContentLoaded', () => {
  const lista = document.getElementById('lista-finalizadas');
  const sin = document.getElementById('sin-finalizadas');
  const pagNav = document.getElementById('paginacion');

  let items = [];
  let page = 1;
  const limit = 12;

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
      sin.classList.remove('d-none');
      if (pagNav) pagNav.innerHTML = '';
      return;
    }
    sin.classList.add('d-none');
    lista.innerHTML = '';

    list.forEach(p => {
      const img = (Array.isArray(p.imagenes) && p.imagenes.length) ? p.imagenes[0] : '/uploads/placeholder.png';
      const ganador = p.ganador ? (p.ganador.username || 'Usuario') : null;
      const precio = p.precioFinal != null ? Number(p.precioFinal) : (p.precioInicial ? Number(p.precioInicial) : null);

  const card = document.createElement('article');
  card.className = 'product-card';
      card.innerHTML = `
        <div class="product-card__media"><img src="${img}" alt="${p.titulo}"></div>
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

    // pagination
    buildPagination(meta.page, meta.totalPages);
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