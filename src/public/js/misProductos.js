document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/login.html';
    return;
  }

  // Botón Cerrar sesión
  const btnLogout = document.getElementById('btn-logout');
  if (btnLogout) {
    btnLogout.addEventListener('click', () => {
      localStorage.removeItem('token');
      window.location.href = '/login.html';
    });
  }

  const listaContainer = document.getElementById('lista-mis-productos');

  async function cargarMisProductos() {
    try {
      const res = await fetch(apiUrl('/api/productos/mios'), {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login.html';
        }
        throw new Error('Error al obtener productos');
      }

      const data = await res.json();
      const productos = data.productos || data;

      listaContainer.innerHTML = '';

      if (!productos.length) {
        listaContainer.innerHTML = `
          <div class="text-center text-muted py-5">
            <p>No tienes productos a la venta.</p>
          </div>`;
        return;
      }

      productos.forEach(prod => {
        const col = document.createElement('div');
        col.className = 'producto-card';
        const primeraImagen = (prod.imagenes && prod.imagenes.length)
          ? prod.imagenes[0]
          : '/css/placeholder.png';

        const fechaExp = new Date(prod.fechaExpiracion);
        const ahora = new Date();
        const estado = (prod.estado === 'activo' && fechaExp > ahora)
          ? 'Activo'
          : 'Cerrado';

        col.innerHTML = `
          <div class="card shadow-sm w-100">
            <img src="${primeraImagen}" class="card-img-top" alt="${prod.titulo}" style="object-fit: cover; height: 180px;">
            <div class="card-body d-flex flex-column">
              <h5 class="card-title fw-bold">${prod.titulo}</h5>
              <p class="text-muted small">${prod.descripcion ? prod.descripcion.substring(0, 60) + '…' : ''}</p>
              <p class="mb-1"><strong>Precio:</strong> €${prod.precioInicial.toFixed(2)}</p>
              <p class="mb-2"><strong>Estado:</strong> ${estado}</p>
              <a href="producto.html?id=${prod._id}" class="btn btn-outline-dark mt-auto">Ver detalle</a>
            </div>
          </div>
        `;

        listaContainer.appendChild(col);
      });

    } catch (err) {
      console.error(err);
      listaContainer.innerHTML = `
        <div class="text-center text-danger py-5">
          <p>Error al cargar tus productos.</p>
        </div>`;
    }
  }

  cargarMisProductos();
});