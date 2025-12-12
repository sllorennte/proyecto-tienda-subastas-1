document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = 'login.html';
    return;
  }
  const listaContenedor = document.getElementById('lista-pujas');
  const sinPujasMsg = document.getElementById('sin-pujas');
  // Confirm modal elements
  const confirmModalEl = document.getElementById('confirmActionModal');
  const confirmMessageEl = document.getElementById('confirm-action-message');
  const confirmOkBtn = document.getElementById('confirm-action-ok');
  let bsConfirmModal = null;
  try { if (window.bootstrap && confirmModalEl) bsConfirmModal = new bootstrap.Modal(confirmModalEl); } catch (e) { bsConfirmModal = null; }
  let pendingAction = null; // { type: 'delete'|'replace', card, nuevoValor }

  // Confirm OK button: single handler for both delete and replace actions
  if (confirmOkBtn) {
    confirmOkBtn.addEventListener('click', async () => {
      if (!pendingAction) return;
      const action = pendingAction;
      pendingAction = null;
      try { if (bsConfirmModal) bsConfirmModal.hide(); } catch (e) {}
      if (action.type === 'delete') {
        await eliminarPuja(action.card);
        return;
      }
      if (action.type === 'replace') {
        const { card, nuevoValor, montoTextoElem, fechaElem, contenedorEdicion, acciones } = action;
        try {
          await reemplazarPuja(card, nuevoValor);
          if (montoTextoElem) montoTextoElem.textContent = nuevoValor.toFixed(2);
          if (fechaElem) fechaElem.textContent = new Date().toLocaleString();
          if (card) card.classList.remove('editando');
          if (contenedorEdicion) contenedorEdicion.remove();
          if (acciones) acciones.style.display = 'flex';
          if (typeof mostrarNotificacion === 'function') mostrarNotificacion('Puja actualizada', 'success');
        } catch (err) {
          console.error('Error al confirmar reemplazo de puja', err);
          if (typeof mostrarNotificacion === 'function') mostrarNotificacion('No se pudo actualizar la puja', 'danger');
        }
        return;
      }
    });
  }

  cargarPujas();

  async function cargarPujas() {
    try {
      const res = await fetch(apiUrl('/api/pujas/mias'), {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) throw new Error('No se pudo obtener las pujas');
      const pujas = await res.json();

      listaContenedor.innerHTML = '';

      if (!Array.isArray(pujas) || pujas.length === 0) {
        sinPujasMsg.style.display = 'block';
        return;
      }

      sinPujasMsg.style.display = 'none';
      pujas.forEach(puja => {
        const card = crearTarjetaPuja(puja);
        listaContenedor.appendChild(card);
      });
      } catch (err) {
      console.error(err);
      sinPujasMsg.textContent = 'Error al cargar tus pujas.';
      sinPujasMsg.style.display = 'block';
    }
  }
  function crearTarjetaPuja(puja) {
    const fechaStr = new Date(puja.fechaPuja).toLocaleString();
    const precioInicial = puja.producto?.precioInicial?.toFixed(2) || '0.00';

    const card = document.createElement('article');
    card.className = 'bid-card';
    card.dataset.id = puja._id;
    card.dataset.producto = puja.producto?._id || '';
    card.dataset.precioInicial = precioInicial;

    card.innerHTML = `
      <div class="bid-card__header">
        <div>
          <h3>${puja.producto?.titulo || 'Sin título'}</h3>
          <span class="small text-muted">#${puja.producto?._id?.slice(-6) || '000000'}</span>
        </div>
        <span class="bid-card__status"><i class="fas fa-clock"></i> ${puja.producto?.estado || 'En revisión'}</span>
      </div>
      <div class="bid-card__meta">
        <span><strong>Tu puja:</strong> € <span class="monto-texto">${puja.cantidad.toFixed(2)}</span></span>
        <span><strong>Precio inicial:</strong> € ${precioInicial}</span>
        <span><strong>Fecha:</strong> <span class="puja-fecha">${fechaStr}</span></span>
        <span><strong>Categoría:</strong> ${puja.producto?.categoria || '—'}</span>
      </div>
      <div class="bid-card__actions">
        <button class="btn btn-outline-primary btn-editar">Editar puja</button>
        <button class="btn btn-outline-danger btn-eliminar">Eliminar</button>
      </div>
    `;

    card.querySelector('.btn-eliminar').addEventListener('click', () => confirmarEliminarPuja(card));
    card.querySelector('.btn-editar').addEventListener('click', () => iniciarEdicion(card));

    return card;
  }

  async function eliminarPuja(card) {
    const pujaId = card.dataset.id;
    if (!pujaId) {
      card.remove();
      return;
    }
    try {
      const res = await fetch(apiUrl(`/api/pujas/${pujaId}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('No se pudo eliminar la puja');
      card.remove();
      if (!listaContenedor.children.length) {
        sinPujasMsg.style.display = 'block';
      }
      if (typeof mostrarNotificacion === 'function') mostrarNotificacion('Puja eliminada', 'success');
    } catch (err) {
      console.error('Error al eliminar la puja', err);
      if (typeof mostrarNotificacion === 'function') mostrarNotificacion('No se pudo eliminar la puja', 'danger');
    }
  }

  function confirmarEliminarPuja(card) {
    pendingAction = { type: 'delete', card };
    const titulo = card.querySelector('h3') ? card.querySelector('h3').textContent.trim() : '';
    confirmMessageEl.textContent = `¿Eliminar tu puja para “${titulo}”? Esta acción no se puede deshacer.`;
    try { if (bsConfirmModal) bsConfirmModal.show(); } catch (e) { if (confirm('Eliminar puja?')) eliminarPuja(card); }
  }

  function iniciarEdicion(card) {
    if (card.classList.contains('editando')) return;

    card.classList.add('editando');
    const acciones = card.querySelector('.bid-card__actions');
    acciones.style.display = 'none';

    const precioInicial = parseFloat(card.dataset.precioInicial);
    const montoTextoElem = card.querySelector('.monto-texto');
    const montoOriginal = parseFloat(montoTextoElem.textContent);
    const fechaElem = card.querySelector('.puja-fecha');
    const contenedorEdicion = document.createElement('div');
    contenedorEdicion.className = 'bid-edit';

    const input = document.createElement('input');
    input.type = 'number';
    input.min = (precioInicial + 0.01).toFixed(2);
    input.step = '0.01';
    input.value = montoOriginal.toFixed(2);
    input.className = 'form-control';

    const accionesEdicion = document.createElement('div');
    accionesEdicion.className = 'bid-edit__actions';

    const btnGuardar = document.createElement('button');
    btnGuardar.className = 'btn btn-primary';
    btnGuardar.textContent = 'Guardar cambios';

    const btnCancelar = document.createElement('button');
    btnCancelar.className = 'btn btn-outline-secondary';
    btnCancelar.textContent = 'Cancelar';
    accionesEdicion.append(btnGuardar, btnCancelar);
    contenedorEdicion.append(input, accionesEdicion);
    card.appendChild(contenedorEdicion);

    btnCancelar.addEventListener('click', () => {
      card.classList.remove('editando');
      contenedorEdicion.remove();
      acciones.style.display = 'flex';
    });

    btnGuardar.addEventListener('click', async () => {
      const nuevoValor = parseFloat(input.value);
      if (isNaN(nuevoValor) || nuevoValor <= precioInicial) {
        input.classList.add('is-invalid');
        return;
      }
      // En lugar de ejecutar directamente, pedimos confirmación
      pendingAction = { type: 'replace', card, nuevoValor, montoTextoElem, fechaElem, contenedorEdicion, acciones };
      confirmMessageEl.textContent = `Confirmar nueva puja de €${nuevoValor.toFixed(2)} para este lote?`;
      try { if (bsConfirmModal) bsConfirmModal.show(); } catch (e) { if (confirm('Confirmar nueva puja?')) {
        try { await reemplazarPuja(card, nuevoValor); montoTextoElem.textContent = nuevoValor.toFixed(2); fechaElem.textContent = new Date().toLocaleString(); card.classList.remove('editando'); contenedorEdicion.remove(); acciones.style.display = 'flex'; } catch (err) { console.error(err); input.classList.add('is-invalid'); }
      } }
    });
  }

  async function reemplazarPuja(card, nuevoValor) {
    const pujaId = card.dataset.id;
    const productoId = card.dataset.producto;

    if (pujaId) {
      await fetch(`/api/pujas/${pujaId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
    }

      

    const resNew = await fetch(apiUrl('/api/pujas'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        producto: productoId,
        cantidad: nuevoValor
      })
    });

    if (!resNew.ok) throw new Error('No se pudo guardar la nueva puja');
    const nueva = await resNew.json();
    card.dataset.id = nueva.puja._id;
  }
});