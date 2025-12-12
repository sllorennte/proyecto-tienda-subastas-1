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
  const editModalEl = document.getElementById('editProductModal');
  const editTitleInput = document.getElementById('edit-product-title');
  const editDescInput = document.getElementById('edit-product-desc');
  const saveEditBtn = document.getElementById('save-edit-product');
  let currentEditId = null;
  let bsEditModal = null;
  try { if (window.bootstrap && editModalEl) bsEditModal = new bootstrap.Modal(editModalEl); } catch (e) { bsEditModal = null; }
  // Delete modal elements
  const deleteModalEl = document.getElementById('deleteProductModal');
  const confirmDeleteBtn = document.getElementById('confirm-delete-product');
  let currentDeleteId = null;
  let bsDeleteModal = null;
  try { if (window.bootstrap && deleteModalEl) bsDeleteModal = new bootstrap.Modal(deleteModalEl); } catch (e) { bsDeleteModal = null; }

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
        col.id = `producto-${prod._id}`;
        const primeraImagen = (prod.imagenes && prod.imagenes.length)
          ? prod.imagenes[0]
          : '/uploads/placeholder.svg';

        const fechaExp = new Date(prod.fechaExpiracion);
        const ahora = new Date();
        const estado = (prod.estado === 'activo' && fechaExp > ahora)
          ? 'Activo'
          : 'Cerrado';

        col.innerHTML = `
          <div class="card shadow-sm w-100">
            <img src="${primeraImagen}" class="card-img-top" alt="${prod.titulo}" style="object-fit: cover; height: 180px;" onerror="this.onerror=null;this.src='/uploads/placeholder.svg'">
            <div class="card-body d-flex flex-column">
              <h5 class="card-title fw-bold">${prod.titulo}</h5>
              <p class="text-muted small">${prod.descripcion ? prod.descripcion.substring(0, 60) + '…' : ''}</p>
              <p class="mb-1"><strong>Precio:</strong> €${prod.precioInicial.toFixed(2)}</p>
              <p class="mb-2"><strong>Estado:</strong> ${estado}</p>
              <div class="acciones mt-auto d-flex gap-2">
                <a href="producto.html?id=${prod._id}" class="btn btn-outline-dark">Ver detalle</a>
                <button class="btn btn-outline-secondary btn-edit" data-id="${prod._id}">Editar</button>
                <button class="btn btn-danger btn-delete" data-id="${prod._id}">Eliminar</button>
              </div>
            </div>
          </div>
        `;
        
        listaContainer.appendChild(col);

        // Attach handlers
        const btnDel = col.querySelector('.btn-delete');
        if (btnDel) {
          btnDel.addEventListener('click', (ev) => {
            ev.preventDefault();
            const id = btnDel.getAttribute('data-id');
            currentDeleteId = id;
            try { if (bsDeleteModal) bsDeleteModal.show(); }
            catch (e) { console.warn('No modal available', e); }
          });
        }

        const btnEdit = col.querySelector('.btn-edit');
        if (btnEdit) {
          btnEdit.addEventListener('click', (ev) => {
            ev.preventDefault();
            const id = btnEdit.getAttribute('data-id');
            currentEditId = id;
            // fill modal with current values from DOM
            const titleEl = col.querySelector('.card-title');
            const descEl = col.querySelector('.text-muted.small');
            editTitleInput.value = titleEl ? titleEl.textContent.trim() : '';
            editDescInput.value = descEl ? descEl.textContent.replace('…','').trim() : '';
            try { if (bsEditModal) bsEditModal.show(); }
            catch (e) { console.warn('No modal available', e); }
          });
        }
      });

    } catch (err) {
      console.error(err);
      listaContainer.innerHTML = `
        <div class="text-center text-danger py-5">
          <p>Error al cargar tus productos.</p>
        </div>`;
    }
  }
  
  // Guardar edición desde modal
  if (saveEditBtn) {
    saveEditBtn.addEventListener('click', async () => {
      if (!currentEditId) return;
      const titulo = editTitleInput.value && editTitleInput.value.trim();
      const descripcion = editDescInput.value && editDescInput.value.trim();
      if (!titulo) { if (typeof mostrarNotificacion === 'function') mostrarNotificacion('El título es obligatorio', 'warning'); return; }
      try {
        saveEditBtn.disabled = true;
        const res = await fetch(apiUrl(`/api/productos/${currentEditId}`), {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ titulo, descripcion })
        });
        if (!res.ok) {
          if (res.status === 401) { localStorage.removeItem('token'); window.location.href = '/login.html'; }
          const err = await res.json().catch(()=>null);
          throw new Error((err && err.error) ? err.error : 'Error al actualizar');
        }
        const data = await res.json();
        const el = document.getElementById(`producto-${currentEditId}`);
        if (el) {
          const titleEl = el.querySelector('.card-title');
          const descEl = el.querySelector('.text-muted.small');
          if (titleEl) titleEl.textContent = data.producto.titulo || titulo;
          if (descEl) descEl.textContent = data.producto.descripcion ? (data.producto.descripcion.substring(0,60)+'…') : '';
        }
        if (typeof mostrarNotificacion === 'function') mostrarNotificacion('Producto actualizado', 'success');
        try { if (bsEditModal) bsEditModal.hide(); } catch (e) {}
      } catch (err) {
        console.error(err);
        if (typeof mostrarNotificacion === 'function') mostrarNotificacion('No se pudo actualizar el producto', 'danger');
      } finally { saveEditBtn.disabled = false; }
    });
  }

  // Confirmar eliminación desde modal
  if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener('click', async () => {
      if (!currentDeleteId) return;
      confirmDeleteBtn.disabled = true;
      try {
        const res = await fetch(apiUrl(`/api/productos/${currentDeleteId}`), {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) {
          if (res.status === 401) { localStorage.removeItem('token'); window.location.href = '/login.html'; }
          const err = await res.json().catch(()=>null);
          throw new Error((err && err.error) ? err.error : 'Error al eliminar');
        }
        const el = document.getElementById(`producto-${currentDeleteId}`);
        if (el) el.remove();
        if (typeof mostrarNotificacion === 'function') mostrarNotificacion('Producto eliminado', 'success');
        try { if (bsDeleteModal) bsDeleteModal.hide(); } catch (e) {}
      } catch (err) {
        console.error(err);
        if (typeof mostrarNotificacion === 'function') mostrarNotificacion('No se pudo eliminar el producto', 'danger');
      } finally {
        confirmDeleteBtn.disabled = false;
        currentDeleteId = null;
      }
    });
  }

  cargarMisProductos();
});