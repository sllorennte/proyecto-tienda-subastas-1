const tokenFav = localStorage.getItem('token');
const favList = document.getElementById('fav-list');
const favEmpty = document.getElementById('fav-empty');

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
    const primeraImagen = (p.imagenes && p.imagenes[0]) ? p.imagenes[0] : '/uploads/placeholder.png';
    const card = document.createElement('article');
    card.className = 'product-card';
    card.innerHTML = `
      <div class="product-card__media"><img src="${primeraImagen}" alt="${p.titulo || 'Producto'}"></div>
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
  if (!confirm('Quitar de favoritos?')) return;
  try {
    const res = await fetch(apiUrl(`/api/favoritos/${id}`), { method: 'DELETE', headers: { Authorization: 'Bearer ' + tokenFav } });
    if (!res.ok) throw new Error('Error al eliminar');
    loadFavoritos();
  } catch (err) { showError('Error al eliminar favorito'); }
}

loadFavoritos();
