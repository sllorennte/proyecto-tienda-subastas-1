document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = 'login.html';
    return;
  }

  const btnLogout = document.getElementById('btn-logout');
  if (btnLogout) {
    btnLogout.addEventListener('click', () => {
      localStorage.removeItem('token');
      window.location.href = 'login.html';
    });
  }

  const listaProductos   = document.getElementById('lista-productos');
  const sinProductosMsg  = document.getElementById('sin-productos');
  const formFiltros      = document.getElementById('form-filtros');
  const btnLimpiar       = document.getElementById('btn-limpiar');

  const inputPrecioMin   = document.getElementById('precio-min');
  const inputPrecioMax   = document.getElementById('precio-max');
  const inputFechaExp    = document.getElementById('fecha-expiracion');
  const selectCategoria  = document.getElementById('categoria');

  let todosProductos = [];
  let pageSize = 12; // items por página
  let currentPage = 1;
  let favoritosSet = new Set();

  cargarTodosProductos();

  async function cargarTodosProductos() {
    try {
      const res = await fetch(apiUrl('/api/productos'), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Error al obtener productos');

      const data = await res.json();
      todosProductos = Array.isArray(data.productos) ? data.productos : [];
      await cargarFavoritos();
      poblarSelectCategorias(todosProductos);
      renderPage(1, todosProductos);
    } catch (err) {
      console.error(err);
      sinProductosMsg.textContent = 'Error al cargar productos. Intenta recargar la página.';
      sinProductosMsg.classList.remove('d-none');
    }
  }

  async function cargarFavoritos() {
    try {
      const res = await fetch(apiUrl('/api/favoritos'), { headers: { 'Authorization': `Bearer ${token}` } });
      if (!res.ok) { favoritosSet = new Set(); return; }
      const items = await res.json();
      // items may be array of favoritos with populated producto
      favoritosSet = new Set((items || []).map(f => (f.producto && f.producto._id) ? String(f.producto._id) : String(f.producto)));
    } catch (err) { favoritosSet = new Set(); }
  }

  function poblarSelectCategorias(productos) {
    const categoriasSet = new Set();
    productos.forEach(p => {
      if (p.categoria) categoriasSet.add(p.categoria);
    });

    selectCategoria.innerHTML = '<option value="">-- Todas --</option>';
    categoriasSet.forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat;
      opt.textContent = cat.charAt(0).toUpperCase() + cat.slice(1);
      selectCategoria.appendChild(opt);
    });
  }

  function mostrarListado(productos) {
    // wrapper para compatibilidad: renderiza la página actual del conjunto
    renderPage(currentPage, productos);
  }

  function renderPage(page, productos) {
    if (!Array.isArray(productos) || productos.length === 0) {
      listaProductos.innerHTML = '';
      sinProductosMsg.classList.remove('d-none');
      const pagNav = document.getElementById('paginacion'); if (pagNav) pagNav.innerHTML = '';
      return;
    }

    sinProductosMsg.classList.add('d-none');

    const total = productos.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    currentPage = Math.min(Math.max(1, page), totalPages);

    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    const items = productos.slice(start, end);

      listaProductos.innerHTML = '';
      if (!Array.isArray(productos) || productos.length === 0) {
        listaProductos.innerHTML = `
          <div class="text-center text-muted py-5">
            <p>No se encontraron productos.</p>
          </div>`;
        return;
      }

      // Render as boxed product cards matching subastas-finalizadas UI
      items.forEach(p => {
        const primeraImagen = p.imagenes?.[0] || '/uploads/placeholder.svg';
        const fechaExp = p.fechaExpiracion ? new Date(p.fechaExpiracion).toLocaleDateString('es-ES') : '—';

        const card = document.createElement('article');
        card.className = 'product-card';
        card.innerHTML = `
          <button class="product-card__fav fav-toggle ${favoritosSet.has(String(p._id)) ? 'favorited' : ''}" data-id="${p._id}" title="Añadir a favoritos">
            <i class="${favoritosSet.has(String(p._id)) ? 'fas' : 'far'} fa-heart"></i>
          </button>
          <div class="product-card__media"><img src="${primeraImagen}" alt="${p.titulo}" onerror="this.onerror=null;this.src='/uploads/placeholder.svg'"/></div>
          <div class="product-card__body">
            <h3>${p.titulo}</h3>
            <p>${p.descripcion || ''}</p>
            <div class="product-card__meta">
              <span><strong>Inicial:</strong> €${Number(p.precioInicial).toFixed(2)}</span>
              <span><strong>Caduca:</strong> ${fechaExp}</span>
              <span><strong>Vendedor:</strong> ${p.vendedor?.username || '—'}</span>
              <span><strong>Categoría:</strong> ${p.categoria || '—'}</span>
            </div>
            <div class="product-card__actions">
              <a href="producto.html?id=${p._id}" class="btn btn-primary">Ver subasta</a>
            </div>
          </div>
        `;
        listaProductos.appendChild(card);
      });

    // attach favorite handlers
    listaProductos.querySelectorAll('.fav-toggle').forEach(btn => btn.addEventListener('click', onFavToggle));

    buildPagination(totalPages);
  }

  function buildPagination(totalPages) {
    const nav = document.getElementById('paginacion');
    if (!nav) return;
    nav.innerHTML = '';

    const ul = document.createElement('ul');
    ul.className = 'pagination';

    const addPageItem = (label, pageNum, disabled = false, active = false) => {
      const li = document.createElement('li');
      li.className = 'page-item' + (disabled ? ' disabled' : '') + (active ? ' active' : '');
      const a = document.createElement('a');
      a.className = 'page-link';
      a.href = '#';
      a.textContent = label;
      a.addEventListener('click', (e) => { e.preventDefault(); if (!disabled) renderPage(pageNum, todosProductos); });
      li.appendChild(a);
      ul.appendChild(li);
    };

    addPageItem('«', currentPage - 1, currentPage === 1);

    // show up to 7 page numbers centered
    const maxSlots = 7;
    let start = Math.max(1, currentPage - Math.floor(maxSlots/2));
    let end = Math.min(totalPages, start + maxSlots - 1);
    if (end - start < maxSlots - 1) start = Math.max(1, end - maxSlots + 1);

    for (let i = start; i <= end; i++) {
      addPageItem(i, i, false, i === currentPage);
    }

    addPageItem('»', currentPage + 1, currentPage === totalPages);

    nav.appendChild(ul);
  }

  formFiltros.addEventListener('submit', e => {
    e.preventDefault();

    const vMin = parseFloat(inputPrecioMin.value) || 0;
    const vMax = parseFloat(inputPrecioMax.value) || Infinity;
    const fechaExpFiltro = inputFechaExp.value ? new Date(inputFechaExp.value) : null;
    const catFiltro = selectCategoria.value;

    const filtrados = todosProductos.filter(p => {
      const precio = parseFloat(p.precioInicial);
      const fechaExp = new Date(p.fechaExpiracion);
      const cat = p.categoria || '';

      if (precio < vMin || precio > vMax) return false;
      if (fechaExpFiltro && fechaExp > fechaExpFiltro) return false;
      if (catFiltro && cat !== catFiltro) return false;

      return true;
    });

    currentPage = 1;
    mostrarListado(filtrados);
  });

  btnLimpiar.addEventListener('click', () => {
    inputPrecioMin.value = '';
    inputPrecioMax.value = '';
    inputFechaExp.value  = '';
    selectCategoria.value = '';
    currentPage = 1;
    mostrarListado(todosProductos);
  });

  async function onFavToggle(e) {
    const btn = e.currentTarget;
    const id = btn.dataset.id;
    try {
      const isFav = favoritosSet.has(String(id));
      if (isFav) {
        await fetch(apiUrl(`/api/favoritos/${id}`), { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
        favoritosSet.delete(String(id));
      } else {
        await fetch(apiUrl('/api/favoritos'), { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ producto: id }) });
        favoritosSet.add(String(id));
      }
      const icon = btn.querySelector('i');
      if (icon) {
        icon.classList.toggle('fas', favoritosSet.has(String(id)));
        icon.classList.toggle('far', !favoritosSet.has(String(id)));
      }
      // marcar el botón visualmente
      try { btn.classList.toggle('favorited', favoritosSet.has(String(id))); } catch (e) {}
    } catch (err) {
      console.error('Error toggling favorito', err);
      alert('Error al actualizar favoritos');
    }
  }
});