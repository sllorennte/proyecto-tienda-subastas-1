document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/login.html';
    return;
  }
  // Cerrar sesión
  const btnLogout = document.getElementById('btn-logout');
  if (btnLogout) {
    btnLogout.addEventListener('click', () => {
      localStorage.removeItem('token');
      window.location.href = '/login.html';
    });
  }

  // (Página simplificada) No hay navegación entre secciones — solo configuración
  let usuarioOriginal = {};

  // Cargar datos del usuario
  async function cargarDatosUsuario() {
    try {
      const res = await fetch(apiUrl('/api/usuarios/me'), {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error();
      const usuario = await res.json();
      usuarioOriginal = usuario || {};
      const usernameInput = document.getElementById('username-config');
      const emailInput = document.getElementById('email-config');
      if (usernameInput) usernameInput.value = usuario.username || '';
      if (emailInput) emailInput.value = usuario.email || '';
      // populate profile panel and aside
      const perfilUser = document.getElementById('perfil-username');
      const perfilEmail = document.getElementById('perfil-email');
      const asideUser = document.getElementById('aside-username');
      const asideEmail = document.getElementById('aside-email');
      if (perfilUser) perfilUser.textContent = usuario.username || '';
      if (perfilEmail) perfilEmail.textContent = usuario.email || '';
      if (asideUser) asideUser.textContent = usuario.username || '';
      if (asideEmail) asideEmail.textContent = usuario.email || '';
      const last = document.getElementById('last-updated');
      if (last) last.textContent = new Date().toLocaleString();
    } catch (err) {
      console.error('No se pudo cargar los datos del usuario.');
    }
  }

  // Guardar cambios de configuración
  const formConfig = document.getElementById('form-configuracion');
  formConfig.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = formConfig.username.value.trim();
    const email = formConfig.email.value.trim();
    const password = formConfig.password ? formConfig.password.value : '';

    if (!username || !email) {
      if (window.mostrarNotificacion) mostrarNotificacion('Nombre y correo son obligatorios', 'warning');
      return;
    }

    // Build minimal payload: only changed fields
    const payload = {};
    if (username !== (usuarioOriginal.username || '')) payload.username = username;
    if (email !== (usuarioOriginal.email || '')) payload.email = email;
    if (password && password.length > 0) payload.password = password;

    if (Object.keys(payload).length === 0) {
      if (window.mostrarNotificacion) mostrarNotificacion('No hay cambios para guardar', 'info');
      return;
    }

    try {
      const res = await fetch(apiUrl('/api/usuarios/me'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        if (window.mostrarNotificacion) mostrarNotificacion('Datos actualizados', 'success');
        if (formConfig.password) formConfig.password.value = '';
        await cargarDatosUsuario();
      } else {
        let msg = 'Error al actualizar';
        try {
          const errData = await res.json();
          msg = errData.error || errData.message || JSON.stringify(errData);
        } catch (e) {
          try { msg = await res.text(); } catch (_) {}
        }
        console.error('Error al actualizar:', msg);
        if (window.mostrarNotificacion) mostrarNotificacion(msg, 'danger');
      }
    } catch (err) {
      console.error('Error al actualizar datos.', err && err.message ? err.message : err);
      if (window.mostrarNotificacion) mostrarNotificacion('Error de red al actualizar', 'danger');
    }
  });

  // Iniciar carga (solo configuración)
  cargarDatosUsuario();
});