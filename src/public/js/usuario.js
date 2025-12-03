document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  if (!id) {
    document.body.innerHTML = '<p class="text-danger text-center mt-5">ID de usuario no especificado.</p>';
    return;
  }

  const nombreEl = document.getElementById('usuario-nombre');
  const bioEl = document.getElementById('usuario-bio');
  const contactoEl = document.getElementById('usuario-contacto');
  const listaSubastas = document.getElementById('lista-subastas');
  const sinSubastas = document.getElementById('sin-subastas');
  const btnMensajear = document.getElementById('btn-mensajear');

  function mostrarNotificacion(mensaje, tipo = 'success') {
    const cont = document.getElementById('notificacion-container');
    const div = document.createElement('div');
    div.className = `toast align-items-center text-bg-${tipo} border-0 show`;
    div.style.marginBottom = '0.5rem';
    div.innerHTML = `<div class="d-flex"><div class="toast-body">${mensaje}</div><button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Cerrar"></button></div>`;
    cont.appendChild(div);
    setTimeout(() => div.remove(), 3500);
  }

  async function loadUsuario() {
    try {
      const res = await fetch(`/api/usuarios/${id}`);
      if (!res.ok) throw new Error('Usuario no encontrado');
      const u = await res.json();
      nombreEl.textContent = u.username || 'Usuario';
      bioEl.textContent = u.bio || 'El usuario no ha añadido biografía.';
      contactoEl.textContent = u.contacto ? `Contacto: ${u.contacto}` : 'Contacto: —';
    } catch (err) {
      console.error(err);
      document.body.innerHTML = '<p class="text-danger text-center mt-5">No se pudo cargar el usuario.</p>';
    }
  }

  async function loadSubastas() {
    try {
      const res = await fetch(`/api/productos?vendedor=${id}&limit=100`);
      if (!res.ok) throw new Error('Error al cargar subastas');
      const data = await res.json();
      const items = Array.isArray(data.productos) ? data.productos : data;
      listaSubastas.innerHTML = '';
      if (!items || items.length === 0) {
        sinSubastas.classList.remove('d-none');
        return;
      }
      sinSubastas.classList.add('d-none');
      items.forEach(p => {
        const primeraImagen = p.imagenes?.[0] || 'uploads/placeholder.png';
        const div = document.createElement('div');
        div.className = 'product-card';
        div.innerHTML = `
          <div class="product-card__media"><img src="${primeraImagen}" alt="${p.titulo}"></div>
          <div class="product-card__body">
            <h3>${p.titulo}</h3>
            <p>${p.descripcion || ''}</p>
            <div class="product-card__meta">
              <span><strong>Inicial:</strong> €${Number(p.precioInicial).toFixed(2)}</span>
              <span><strong>Caduca:</strong> ${p.fechaExpiracion ? new Date(p.fechaExpiracion).toLocaleDateString('es-ES') : '—'}</span>
            </div>
            <div class="product-card__actions">
              <a href="producto.html?id=${p._id}" class="btn btn-primary">Ver subasta</a>
            </div>
          </div>
        `;
        listaSubastas.appendChild(div);
      });
    } catch (err) {
      console.error(err);
      listaSubastas.innerHTML = '<p class="text-danger">Error al cargar subastas del vendedor.</p>';
    }
  }

  // Mensajear al vendedor (abre modal)
  btnMensajear.addEventListener('click', () => {
    const modalEl = document.getElementById('modalMensaje');
    const bsModal = new bootstrap.Modal(modalEl);
    modalEl.querySelector('#mensaje-texto').value = '';
    modalEl.querySelector('#mensaje-error').textContent = '';
    bsModal.show();

    const btnEnviar = modalEl.querySelector('#btn-enviar-mensaje');
    btnEnviar.onclick = async () => {
      const texto = modalEl.querySelector('#mensaje-texto').value.trim();
      if (!texto) { modalEl.querySelector('#mensaje-error').textContent = 'Escribe un mensaje.'; return; }
      try {
        const token = localStorage.getItem('token');
        if (!token) { window.location.href = 'login.html'; return; }
        const resp = await fetch('/api/mensajes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ destinatario: id, texto })
        });
        const data = await resp.json();
        if (!resp.ok) { modalEl.querySelector('#mensaje-error').textContent = data.error || 'Error al enviar mensaje'; return; }
        mostrarNotificacion('Mensaje enviado correctamente');
        bootstrap.Modal.getInstance(modalEl).hide();
      } catch (err) {
        console.error(err);
        modalEl.querySelector('#mensaje-error').textContent = 'Error al enviar mensaje';
      }
    };
  });

  await loadUsuario();
  await loadSubastas();
});
