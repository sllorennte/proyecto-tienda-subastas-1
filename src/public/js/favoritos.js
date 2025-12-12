const tokenFav = localStorage.getItem('token');
const favList = document.getElementById('fav-list');
const favEmpty = document.getElementById('fav-empty');
// modal elements
const confirmRemoveModalEl = document.getElementById('confirmRemoveFavModal');
const confirmRemoveMsg = document.getElementById('confirm-remove-message');
const confirmRemoveOk = document.getElementById('confirm-remove-ok');
let bsConfirmRemove = null;
let pendingRemoveId = null;
try { if (window.bootstrap && confirmRemoveModalEl) bsConfirmRemove = new bootstrap.Modal(confirmRemoveModalEl); } catch (e) { bsConfirmRemove = null; }

async function loadFavoritos() {
  try {
    const res = await fetch(apiUrl('/api/favoritos'), { headers: { Authorization: 'Bearer ' + tokenFav } });
    if (!res.ok) { showError('Error cargando favoritos'); return; }
    const items = await res.json();
    renderFavoritos(items || []);
  } catch (err) { showError('Error cargando favoritos'); console.error(err); }
}

function showError(msg) {
  if (favList) favList.innerHTML = `<div class="fav-empty">${msg}</div>`;
}

function renderFavoritos(items) {
  if (!items || items.length === 0) {
    if (favList) favList.innerHTML = '';
    if (favEmpty) favEmpty.classList.remove('d-none');
    return;
  }
  if (favEmpty) favEmpty.classList.add('d-none');
  favList.innerHTML = '';
  // Render as product cards for UI consistency
  items.forEach(f => {
    const p = f.producto || {};
    const primeraImagen = (p.imagenes && p.imagenes[0]) ? p.imagenes[0] : '/uploads/placeholder.svg';
      const card = document.createElement('article');
      card.className = 'product-card';
      card.innerHTML = `
        <div class="product-card__media"><img src="${primeraImagen}" alt="${p.titulo || 'Producto'}" onerror="this.onerror=null;this.src='/uploads/placeholder.svg'"></div>
        <div class="product-card__body">
        <h3>${p.titulo || 'Producto'}</h3>
        <p>${(p.descripcion || '').slice(0,120)}</p>
        <div class="product-card__meta">
          <span><strong>Precio:</strong> ${(() => {
            const precioVal = (p.precioFinal != null) ? p.precioFinal : ((p.precioInicial != null) ? p.precioInicial : p.precio);
            return (precioVal != null && !isNaN(Number(precioVal))) ? '€' + Number(precioVal).toFixed(2) : '—';
          })()}</span>
          <span><strong>Categoría:</strong> ${p.categoria || '—'}</span>
        </div>
        <div class="product-card__actions">
          <a href="/producto.html?id=${p._id}" class="btn btn-primary">Ver</a>
          <button class="btn btn-outline-primary fav-remove" data-remove="${p._id}">Quitar</button>
        </div>
      </div>
    `;
    favList.appendChild(card);
  });
  favList.querySelectorAll('button[data-remove]').forEach(b => b.addEventListener('click', quitar));
}

async function quitar(e) {
  const id = e.currentTarget.dataset.remove;
  // show in-page modal instead of native confirm
  pendingRemoveId = id;
  const card = e.currentTarget.closest('.product-card');
  const title = card ? (card.querySelector('h3') ? card.querySelector('h3').textContent : '') : '';
  confirmRemoveMsg.textContent = title ? `¿Quitar “${title}” de tus favoritos?` : '¿Quitar este producto de tus favoritos?';
  try { if (bsConfirmRemove) bsConfirmRemove.show(); else if (confirm('Quitar de favoritos?')) await doRemove(); } catch (err) { console.warn(err); }
}

async function doRemove() {
  if (!pendingRemoveId) return;
  try {
    const res = await fetch(apiUrl(`/api/favoritos/${pendingRemoveId}`), { method: 'DELETE', headers: { Authorization: 'Bearer ' + tokenFav } });
    if (!res.ok) throw new Error('Error al eliminar');
    // refresh list
    loadFavoritos();
    if (typeof mostrarNotificacion === 'function') mostrarNotificacion('Producto quitado de favoritos', 'success');
  } catch (err) {
    console.error(err);
    showError('Error al eliminar favorito');
  } finally {
    pendingRemoveId = null;
    try { if (bsConfirmRemove) bsConfirmRemove.hide(); } catch (e) {}
  }
}

// handler for modal confirmation button
if (confirmRemoveOk) {
  confirmRemoveOk.addEventListener('click', async () => {
    confirmRemoveOk.disabled = true;
    try { await doRemove(); } finally { confirmRemoveOk.disabled = false; }
  });
}

loadFavoritos();
