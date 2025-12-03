document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/login.html';
    return;
  }

  const payload = JSON.parse(atob(token.split('.')[1]));
  const userId = payload.id;

  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  if (!id) {
    document.body.innerHTML = '<p class="text-danger text-center mt-5">ID de producto no especificado.</p>';
    return;
  }

const tituloEl = document.getElementById('titulo');
const breadcrumbEl = document.getElementById('titulo-breadcrumb');
const descripcionTextEl = document.getElementById('descripcion-texto');
const estadoEl = document.getElementById('estado-subasta');
const pujaActualEl = document.getElementById('puja-actual');
const precioReservaEl = document.getElementById('precio-reserva');
const listaPujasUl = document.getElementById('lista-pujas');

// Verificar si los elementos existen
if (!tituloEl || !breadcrumbEl || !descripcionTextEl || !estadoEl || !pujaActualEl || !precioReservaEl || !listaPujasUl) {
  console.error("Algunos elementos no se han encontrado.");
  return;  // Detener la ejecución si algún elemento es nulo
}

async function loadProduct() {
  try {
    const res = await fetch(`/api/productos/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error();
    producto = await res.json();

    // Verificar que los elementos existan antes de asignarles valores
    if (tituloEl) tituloEl.textContent = producto.titulo;
    if (breadcrumbEl) breadcrumbEl.textContent = producto.titulo;
    if (descripcionTextEl) descripcionTextEl.textContent = producto.descripcion || 'Sin descripción disponible';
    if (estadoEl) updateTime();
    if (pujaActualEl) pujaActualEl.textContent = `€ ${producto.precioInicial.toFixed(2)}`;

    showGallery(producto.imagenes);
    updateTime();
    setInterval(updateTime, 1000);
  } catch (err) {
    document.body.innerHTML = '<p class="text-danger text-center mt-5">Error al cargar el producto.</p>';
    console.error(err);
  }
}


  const formPuja = document.getElementById('form-puja');
  const inputCantidad = document.getElementById('cantidad');
  const btnMaxPuja = document.getElementById('btn-max-puja');
  const errorPujaEl = document.getElementById('error-puja');

  const imagenPrincipalEl = document.getElementById('imagen-principal');
  const thumbnailsEl = document.getElementById('thumbnails');

  const listaResenasDiv = document.getElementById('lista-reseñas');
  const formResena = document.getElementById('form-reseña');
  const selectCalificacion = document.getElementById('calificacion');
  const textareaComentario = document.getElementById('comentario');
  const errorResenaEl = document.getElementById('error-reseña');

  const tabButtons = document.querySelectorAll('.product-tab');
  const tabPanes = document.querySelectorAll('.product-panel');
  const btnContactar = document.getElementById('btn-contactar-vendedor');
  const btnFavorito = document.getElementById('btn-favorito');

  // Función para mostrar notificaciones
  function mostrarNotificacion(mensaje, tipo = 'success') {
    const contenedor = document.getElementById('notificacion-container');
    const id = 'toast-' + Date.now();
    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-bg-${tipo} border-0 show`;
    toast.id = id;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');
    toast.innerHTML = `
      <div class="d-flex">
        <div class="toast-body">${mensaje}</div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Cerrar"></button>
      </div>
    `;
    contenedor.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
  }

  // Cambia de pestaña entre descripción, reseñas, historial
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.tab;
      tabButtons.forEach(b => b.classList.remove('active'));
      tabPanes.forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      const panel = document.getElementById(targetId);
      if (panel) panel.classList.add('active');
    });
  });

  let producto = null;
  let pujas = [];
  // Conexión Socket.IO para pujas en tiempo real
  let socket = null;
  try {
    if (window.io) {
      socket = io(window.SOCKET_URL || undefined);
      socket.on('connect', () => console.log('Socket conectado desde cliente', socket.id));
      socket.on('nuevaPuja', data => {
        if (data.producto === id) {
          // recargar pujas y actualizar precio actual
          loadPujas();
          mostrarNotificacion(`Nueva puja: €${data.cantidad} realizada`, 'info');
        }
      });
    }
  } catch (e) {
    console.warn('SocketIO cliente no disponible:', e.message || e);
  }

  // Muestra las imágenes del producto
  function showGallery(images) {
    imagenPrincipalEl.innerHTML = '';
    thumbnailsEl.innerHTML = '';

    if (!images || images.length === 0) {
      imagenPrincipalEl.textContent = 'Sin imagen';
      return;
    }

    const mainImg = document.createElement('img');
    mainImg.src = images[0];
    mainImg.alt = producto.titulo;
    mainImg.classList.add('product-main-image');
    imagenPrincipalEl.appendChild(mainImg);

    images.forEach((url, idx) => {
      const thumb = document.createElement('img');
      thumb.src = url;
      thumb.alt = `Miniatura ${idx + 1}`;
      thumb.classList.add('product-thumb');
      if (idx === 0) thumb.classList.add('active');
      thumb.addEventListener('click', () => {
        mainImg.src = url;
        thumbnailsEl.querySelectorAll('img').forEach(i => i.classList.remove('active'));
        thumb.classList.add('active');
      });
      thumbnailsEl.appendChild(thumb);
    });
  }

  // Actualiza el tiempo restante para la subasta
  function updateTime() {
    if (!producto) return;
    const fin = new Date(producto.fechaExpiracion);
    const now = new Date();
    const diff = fin - now;
    if (diff <= 0) {
      estadoEl.textContent = 'Subasta cerrada';
      return;
    }
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    estadoEl.textContent = `Cierra en ${d}d ${h}h ${m}m ${s}s`;
  }

  // Carga el producto desde la API
  async function loadProduct() {
    try {
      const res = await fetch(apiUrl(`/api/productos/${id}`), {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Error al cargar producto');
      producto = await res.json();

      tituloEl.textContent = producto.titulo;
      breadcrumbEl.textContent = producto.titulo;
      descripcionTextEl.textContent = producto.descripcion || 'Sin descripción disponible';
      showGallery(producto.imagenes);
      updateTime();
      setInterval(updateTime, 1000);

      // Unirse a la sala de Socket.IO del producto para recibir eventos en tiempo real
      try {
        if (socket && socket.connected) {
          socket.emit('joinProducto', id);
        } else if (socket) {
          socket.on('connect', () => socket.emit('joinProducto', id));
        }
      } catch (e) {
        console.warn('No se pudo unir a la sala Socket.IO:', e.message || e);
      }

      if (btnContactar && producto.vendedor?._id) {
        btnContactar.addEventListener('click', async () => {
          const contenido = `
            <form id="form-contacto" class="p-2">
              <textarea id="mensaje-contacto" class="form-control mb-3" placeholder="Escribe tu mensaje..." rows="4"></textarea>
              <button type="submit" class="btn btn-primary w-100">Enviar mensaje</button>
            </form>
          `;
          const modal = document.createElement('div');
          modal.className = 'modal fade';
          modal.innerHTML = `
            <div class="modal-dialog">
              <div class="modal-content">
                <div class="modal-header">
                  <h5 class="modal-title">Mensaje al vendedor</h5>
                  <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
                </div>
                <div class="modal-body">${contenido}</div>
              </div>
            </div>
          `;
          document.body.appendChild(modal);
          const bsModal = new bootstrap.Modal(modal);
          bsModal.show();

          modal.querySelector('#form-contacto').addEventListener('submit', async e => {
            e.preventDefault();
            const texto = modal.querySelector('#mensaje-contacto').value.trim();
            if (!texto) return;

            try {
              const res = await fetch(apiUrl('/api/mensajes'), {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                  destinatario: producto.vendedor._id,
                  texto
                })
              });

              const data = await res.json();
              if (!res.ok) {
                mostrarNotificacion(data.error || 'Error al enviar mensaje', 'danger');
                return;
              }

              mostrarNotificacion('Mensaje enviado correctamente');
              bsModal.hide();
              modal.remove();
            } catch (err) {
              console.error(err);
              mostrarNotificacion('Error al contactar al vendedor', 'danger');
            }
          });
        });
      }

      // load favorito status for this product and wire button
      if (btnFavorito) {
        await loadFavoritoStatus();
        btnFavorito.addEventListener('click', onFavToggle);
      }
    } catch (err) {
      document.body.innerHTML = '<p class="text-danger text-center mt-5">Error al cargar el producto.</p>';
      console.error(err);
    }
  }

  let isFavorito = false;
  async function loadFavoritoStatus() {
    try {
      const res = await fetch(apiUrl('/api/favoritos'), { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) return;
      const items = await res.json();
      const ids = (items || []).map(f => (f.producto && f.producto._id) ? String(f.producto._id) : String(f.producto));
      isFavorito = ids.includes(String(id));
      updateFavIcon();
    } catch (e) { console.error('Error cargando favoritos', e); }
  }

  function updateFavIcon() {
    if (!btnFavorito) return;
    const icon = btnFavorito.querySelector('i');
    if (!icon) return;
    icon.classList.toggle('fas', isFavorito);
    icon.classList.toggle('far', !isFavorito);
  }

  async function onFavToggle() {
    try {
      if (!isFavorito) {
        const resp = await fetch(apiUrl('/api/favoritos'), { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ producto: id }) });
        if (!resp.ok) throw new Error('No se pudo agregar a favoritos');
        isFavorito = true;
        mostrarNotificacion('Añadido a favoritos');
      } else {
        const resp = await fetch(apiUrl(`/api/favoritos/${id}`), { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
        if (!resp.ok) throw new Error('No se pudo eliminar de favoritos');
        isFavorito = false;
        mostrarNotificacion('Eliminado de favoritos');
      }
      updateFavIcon();
    } catch (err) {
      console.error(err);
      mostrarNotificacion(err.message || 'Error al actualizar favoritos', 'danger');
    }
  }

  // Carga las pujas del producto
  async function loadPujas() {
    try {
      const res = await fetch(apiUrl(`/api/pujas?producto=${id}`), {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Error al cargar pujas');
      pujas = await res.json();

      listaPujasUl.innerHTML = '';
      pujas.forEach(p => {
        const nombreUsuario = p.pujador?.username || 'Usuario desconocido';
        const li = document.createElement('li');
        li.className = 'bids-timeline__item';
        const fecha = new Date(p.fechaPuja).toLocaleString();
        li.innerHTML = `
          <div class="bid-amount">€${p.cantidad.toFixed(2)}</div>
          <div class="bid-meta">
            <span>${nombreUsuario}</span>
            <small>${fecha}</small>
          </div>
        `;
        listaPujasUl.appendChild(li);
      });

      const max = pujas.length ? Math.max(...pujas.map(p => p.cantidad)) : producto.precioInicial;
      pujaActualEl.textContent = `€ ${max.toFixed(2)}`;
    } catch {
      if (producto) {
        pujaActualEl.textContent = `€ ${producto.precioInicial.toFixed(2)}`;
      }
    }
  }

  // Realiza la puja (si el formulario existe)
  if (formPuja && inputCantidad) {
    formPuja.addEventListener('submit', async e => {
      e.preventDefault();
      if (errorPujaEl) errorPujaEl.textContent = '';

      const val = parseFloat(inputCantidad.value);
      const max = pujas.length ? Math.max(...pujas.map(p => p.cantidad)) : producto.precioInicial;

      if (!val || val <= max) {
        if (errorPujaEl) errorPujaEl.textContent = `La puja debe ser > €${max.toFixed(2)}.`;
        return;
      }

      try {
        const resp = await fetch(apiUrl('/api/pujas'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ producto: id, pujador: userId, cantidad: val })
        });
        if (!resp.ok) throw new Error('Error al enviar puja');
        if (inputCantidad) inputCantidad.value = '';
        mostrarNotificacion('Puja realizada con éxito');
        await loadPujas();
      } catch (err) {
        if (errorPujaEl) errorPujaEl.textContent = err.message;
      }
    });
  } else {
    // Si falta el formulario de puja, mostrar aviso en consola para ayudar a depuración
    console.warn('Formulario de puja o campos relacionados no encontrados en la página. IDs esperados: form-puja, cantidad, error-puja, btn-max-puja');
  }

  // Botón para la puja máxima
  if (btnMaxPuja && inputCantidad) {
    btnMaxPuja.addEventListener('click', () => {
      const max = pujas.length ? Math.max(...pujas.map(p => p.cantidad)) : producto.precioInicial;
      inputCantidad.value = (max + 1).toFixed(2);
      if (errorPujaEl) errorPujaEl.textContent = '';
    });
  }

  // Carga las reseñas del producto
  async function loadResenas() {
    try {
      const res = await fetch(apiUrl(`/api/resenas?producto=${id}`), {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Error al cargar reseñas');
      const arr = await res.json();

      listaResenasDiv.innerHTML = '';
      if (!arr.length) {
        listaResenasDiv.innerHTML = '<p class="reviews-empty">Aún no hay reseñas.</p>';
        return;
      }

      arr.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
      arr.forEach(r => {
        const card = document.createElement('article');
        card.className = 'review-card';
        const fecha = new Date(r.fecha).toLocaleString('es-ES');
        const stars = '★'.repeat(r.calificacion) + '☆'.repeat(5 - r.calificacion);
        card.innerHTML = `
          <div class="review-card__header">
            <strong>${r.usuario?.username || 'Usuario'}</strong>
            <span class="review-card__rating">${stars}</span>
          </div>
          <p>${r.comentario}</p>
          <small>${fecha}</small>
        `;
        listaResenasDiv.appendChild(card);
      });
    } catch {
      listaResenasDiv.innerHTML = '<p class="reviews-error">Error al cargar reseñas.</p>';
    }
  }

  // Manejar cierre de subasta en tiempo real
  if (socket) {
    socket.on('subastaCerrada', data => {
      if (String(data.producto) === String(id)) {
        // Desactivar formulario de puja
        if (formPuja) formPuja.querySelectorAll('button, input').forEach(el => el.disabled = true);
        let ganadorText = 'Sin ganador';
        if (data.ganador) {
          ganadorText = `Ganador: ${data.ganador}`;
        }
        estadoEl.textContent = 'Subasta cerrada';
        mostrarNotificacion(`Subasta cerrada. ${ganadorText}`, 'warning');
      }
    });
  }

  // Enviar reseña
  formResena.addEventListener('submit', async e => {
    e.preventDefault();
    errorResenaEl.textContent = '';

    const cal = parseInt(selectCalificacion.value);
    const com = textareaComentario.value.trim();

    if (!cal || cal < 1 || cal > 5) {
      errorResenaEl.textContent = 'Selecciona una calificación válida.';
      return;
    }
    if (com.length < 5) {
      errorResenaEl.textContent = 'El comentario debe tener al menos 5 caracteres.';
      return;
    }

    try {
      const resp = await fetch(apiUrl('/api/resenas'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ producto: id, calificacion: cal, comentario: com })
      });
      if (!resp.ok) throw new Error('Error al enviar reseña');
      selectCalificacion.value = '';
      textareaComentario.value = '';
      mostrarNotificacion('Reseña enviada correctamente');
      await loadResenas();
    } catch (err) {
      errorResenaEl.textContent = err.message;
    }
  });

  // Cargar los datos del producto, pujas y reseñas
  await loadProduct();
  await loadPujas();
  await loadResenas();
});