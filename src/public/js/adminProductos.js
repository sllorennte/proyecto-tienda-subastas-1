import { mostrarNotificacion } from './notificacion.module.js';

document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('token');
  if (!token) return location.href = 'login.html';

  const tbody = document.getElementById('productos-body');
  let idProductoAEliminar = null;
  const modal = new bootstrap.Modal(document.getElementById('modalConfirmarEliminar'));
  const btnConfirmar = document.getElementById('btn-confirmar-eliminar');
  // Modal y formulario crear producto
  const crearModalEl = document.getElementById('modalCrearProducto');
  const btnNuevoProducto = document.getElementById('btn-nuevo-producto');
  const btnCrearProducto = document.getElementById('btn-crear-producto');
  const formCrear = document.getElementById('form-crear-producto');
  let bsCrearModal = null;
  try { if (crearModalEl) bsCrearModal = new bootstrap.Modal(crearModalEl); } catch (e) { bsCrearModal = null; }
  // Cargar categorías para el select
  const selectCategoria = document.getElementById('cp-categoria');
  async function cargarCategorias() {
    try {
      // Lista fija de categorías típicas
      const cats = [
        'Arte y antigüedades',
        'Relojes y joyería',
        'Moda y accesorios',
        'Tecnología y electrónica',
        'Hogar y decoración',
        'Deportes y ocio',
        'Automóviles y motocicletas',
        'Coleccionables',
        'Libros y música',
        'Instrumentos y audio'
      ];
      if (selectCategoria) {
        selectCategoria.innerHTML = '<option value="">Selecciona una categoría</option>' + cats.map(c => `<option value="${c}">${c}</option>`).join('');
      }
    } catch (e) { console.warn('Error preparando categorías', e); }
  }
  cargarCategorias();
  
  function agregarFilaProducto(p) {
    const fila = document.createElement('tr');
    fila.innerHTML = `
      <td>${p.titulo}</td>
      <td>${p.vendedor?.username || 'Admin'}</td>
      <td>${p.precioInicial.toFixed(2)} €</td>
      <td>${p.estado || 'activo'}</td>
      <td>
        <button class="btn btn-sm btn-outline-danger" data-id="${p._id}">Eliminar</button>
      </td>
    `;
    tbody.appendChild(fila);
  }

  try {
    const res = await fetch(apiUrl('/api/productos'), {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) throw new Error('Error al cargar productos');

    const data = await res.json();
    const productos = data.productos;

    productos.forEach((p, index) => {
      const fila = document.createElement('tr');
      fila.innerHTML = `
        <td>${p.titulo}</td>
        <td>${p.vendedor?.username || 'Desconocido'}</td>
        <td>${p.precioInicial.toFixed(2)} €</td>
        <td>${p.estado || 'activo'}</td>
        <td>
          <button class="btn btn-sm btn-outline-danger" data-id="${p._id}" data-row-index="${index + 1}">Eliminar</button>
        </td>
      `;
      tbody.appendChild(fila);
    });

    // Además, cargar subastas finalizadas y mostrarlas también en la tabla para que el admin pueda gestionarlas
    try {
      const rf = await fetch(apiUrl('/api/productos/finalizadas?page=1&limit=100'), { headers: { Authorization: `Bearer ${token}` } });
      if (rf.ok) {
        const df = await rf.json();
        const finalizadas = Array.isArray(df.productos) ? df.productos : (df || []);
        finalizadas.forEach(p => {
          const fila = document.createElement('tr');
          fila.innerHTML = `
            <td>${p.titulo} <small class="text-muted">(finalizada)</small></td>
            <td>${p.vendedor?.username || 'Desconocido'}</td>
            <td>${(p.precioFinal || p.precioInicial || 0).toFixed ? (p.precioFinal || p.precioInicial).toFixed(2) + ' €' : '—'}</td>
            <td>vendido</td>
            <td>
              <button class="btn btn-sm btn-outline-danger" data-id="${p._id}">Eliminar</button>
            </td>
          `;
          tbody.appendChild(fila);
        });
      }
    } catch (e) { console.warn('No se pudieron cargar finalizadas en gestión', e); }

    tbody.addEventListener('click', e => {
      if (e.target.tagName === 'BUTTON') {
        idProductoAEliminar = e.target.dataset.id;
        btnConfirmar.dataset.rowId = e.target.closest('tr').rowIndex;
        modal.show();
      }
    });

    btnConfirmar.addEventListener('click', async () => {
      if (!idProductoAEliminar) return;

      try {
        const r = await fetch(apiUrl(`/api/productos/${idProductoAEliminar}`), {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });

        if (r.ok) {
          const fila = tbody.querySelector(`tr:nth-child(${btnConfirmar.dataset.rowId})`);
          if (fila) fila.remove();
          mostrarNotificacion('Producto eliminado correctamente', 'success');
        } else {
          mostrarNotificacion('Error al eliminar el producto', 'danger');
        }
      } catch (err) {
        console.error(err);
        mostrarNotificacion('Error de red al intentar eliminar el producto', 'danger');
      }

      idProductoAEliminar = null;
      modal.hide();
    });
  
    // Nuevo producto: abrir modal
    if (btnNuevoProducto && bsCrearModal) {
      btnNuevoProducto.addEventListener('click', () => {
        try { formCrear.reset(); bsCrearModal.show(); } catch (e) { }
      });
    }

    // Crear producto: enviar al backend
    if (btnCrearProducto && formCrear) {
      btnCrearProducto.addEventListener('click', async () => {
        const titulo = document.getElementById('cp-titulo').value.trim();
        const descripcion = document.getElementById('cp-descripcion').value.trim();
        const precioInicial = parseFloat(document.getElementById('cp-precio').value);
        const fechaExpiracion = document.getElementById('cp-fecha').value;
        const categoria = document.getElementById('cp-categoria').value || '';
        const imagenesInput = document.getElementById('cp-imagenes');
        const files = imagenesInput && imagenesInput.files ? Array.from(imagenesInput.files) : [];

        if (!titulo || isNaN(precioInicial) || !fechaExpiracion) {
          mostrarNotificacion('Rellena los campos obligatorios', 'warning');
          return;
        }

        btnCrearProducto.disabled = true;
        try {
          // Si hay archivos, subir primero a /api/uploads
          let nombresArchivos = [];
          if (files.length) {
            const fd = new FormData();
            files.slice(0, 6).forEach(f => fd.append('files', f));
            const up = await fetch(apiUrl('/api/uploads'), {
              method: 'POST',
              headers: { Authorization: `Bearer ${token}` },
              body: fd
            });
            if (!up.ok) {
              const err = await up.json().catch(()=>null);
              throw new Error((err && err.error) ? err.error : 'Error subiendo imágenes');
            }
            const upData = await up.json();
            nombresArchivos = upData.archivos || [];
          }

          const payload = { titulo, descripcion, precioInicial, fechaExpiracion, categoria };
          // enviar como array de nombres para que el backend los normalice a rutas (/uploads/...)
          if (nombresArchivos.length) payload.imagenes = nombresArchivos;
          const r = await fetch(apiUrl('/api/productos'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify(payload)
          });
          if (!r.ok) {
            const err = await r.json().catch(()=>null);
            throw new Error((err && err.error) ? err.error : 'Error al crear producto');
          }
          const data = await r.json();
          agregarFilaProducto(data.producto || data);
          mostrarNotificacion('Producto creado correctamente', 'success');
          try { bsCrearModal.hide(); } catch (e) {}
        } catch (err) {
          console.error(err);
          mostrarNotificacion(err.message || 'No se pudo crear el producto', 'danger');
        } finally {
          btnCrearProducto.disabled = false;
        }
      });
    }
  } catch (err) {
    console.error(err);
    mostrarNotificacion('Error al cargar productos', 'danger');
  }
});
