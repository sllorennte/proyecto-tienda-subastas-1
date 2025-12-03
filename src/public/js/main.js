document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/login.html';
    return;
  }

  const btnLogout = document.getElementById('btn-logout');
  if (btnLogout) {
    btnLogout.addEventListener('click', () => {
      localStorage.removeItem('token');
      window.location.href = '/login.html';
    });
  }

  let currentPage = 1;
  const limit = 5;
  let currentSearch = '';
  let mostrarSoloMios = false;

  const listaProductos = document.getElementById('lista-productos');
  const paginacionNav = document.getElementById('paginacion');
  const searchInput = document.getElementById('search-input');
  const searchBtn = document.getElementById('search-btn');
  const btnMisProductos = document.getElementById('btn-mis-productos');

  async function cargarProductos() {
    try {
      const params = new URLSearchParams({ page: currentPage, limit: limit });
      if (currentSearch) params.set('search', currentSearch);

      const url = mostrarSoloMios
        ? apiUrl('/api/productos/mios')
        : apiUrl(`/api/productos?${params.toString()}`);

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) throw new Error('Error al obtener productos');

      const data = await res.json();
      const { metadata, productos } = data;

      mostrarProductos(productos);
      generarPaginacion(metadata);
    } catch (err) {
      console.error(err);
      listaProductos.innerHTML = `
        <div class="text-center text-danger py-5">
          <p>No se pudieron cargar los productos.</p>
        </div>`;
    }
  }

  function mostrarProductos(productos) {
    listaProductos.innerHTML = '';
    if (productos.length === 0) {
      listaProductos.innerHTML = `
        <div class="text-center text-muted py-5">
          <p>No se encontraron productos.</p>
        </div>`;
      return;
    }

    productos.forEach(p => {
      const primeraImagen = p.imagenes?.[0] || 'uploads/mesa.jpg';

      const card = document.createElement('div');
      card.className = 'col-md-4';
      card.innerHTML = `
        <div class="card shadow-sm h-100">
          <img src="${primeraImagen}" class="card-img-top" alt="${p.titulo}" />
          <div class="card-body d-flex flex-column">
            <h5 class="card-title fw-bold">${p.titulo}</h5>
            <p class="text-muted">${p.descripcion || ''}</p>
            <p class="fw-semibold mb-1">Precio inicial: €${p.precioInicial}</p>
            <p class="text-muted mb-2">Vendedor: ${p.vendedor.username}</p>
            <a href="producto.html?id=${p._id}" class="btn btn-outline-dark mt-auto w-100">Ver subasta</a>
          </div>
        </div>`;
      listaProductos.appendChild(card);
    });
  }

  function generarPaginacion({ page, totalPages }) {
    paginacionNav.innerHTML = '';

    const crearBoton = (texto, pagina, deshabilitado = false, activo = false) => {
      const btn = document.createElement('button');
      btn.textContent = texto;
      btn.className = 'btn btn-sm btn-outline-dark mx-1';
      if (deshabilitado) btn.disabled = true;
      if (activo) btn.classList.add('btn-primary', 'text-white');
      btn.addEventListener('click', () => {
        currentPage = pagina;
        cargarProductos();
      });
      return btn;
    };

    paginacionNav.appendChild(crearBoton('Anterior', page - 1, page <= 1));

    for (let i = 1; i <= totalPages; i++) {
      paginacionNav.appendChild(crearBoton(i, i, false, i === page));
    }

    paginacionNav.appendChild(crearBoton('Siguiente', page + 1, page >= totalPages));
  }

  searchBtn.addEventListener('click', () => {
    currentSearch = searchInput.value.trim();
    currentPage = 1;
    cargarProductos();
  });

  searchInput.addEventListener('keypress', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      searchBtn.click();
    }
  });

  btnMisProductos.addEventListener('click', () => {
    mostrarSoloMios = !mostrarSoloMios;
    btnMisProductos.textContent = mostrarSoloMios ? 'Ver todos' : 'Mis productos';
    currentPage = 1;
    cargarProductos();
  });

  cargarProductos();
});