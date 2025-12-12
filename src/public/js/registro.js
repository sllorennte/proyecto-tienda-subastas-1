document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('form-registro');

  if (!form) {
    console.warn('form-registro no encontrado en la página.');
    return;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const usernameEl = document.getElementById('username');
    const emailEl = document.getElementById('email');
    const passwordEl = document.getElementById('password');
    const rolEl = document.getElementById('rol');

    const username = usernameEl ? usernameEl.value.trim() : '';
    const email = emailEl ? emailEl.value.trim() : '';
    const password = passwordEl ? passwordEl.value : '';
    // el select 'rol' puede no estar presente (comentado en la UI); por defecto usamos 'usuario'
    const rol = rolEl ? rolEl.value : 'usuario';

    if (!username || !email || !password || !rol) {
      mostrarNotificacion('Por favor, completa todos los campos.', 'danger');
      return;
    }

    try {
      const res = await fetch(apiUrl('/api/usuarios'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password, rol })
      });

      const data = await res.json();

      if (!res.ok) {
        mostrarNotificacion(data.error || 'Error al registrar.', 'danger');
        return;
      }

      mostrarNotificacion('Registro exitoso. Redirigiendo al login...', 'success');
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 1500);
    } catch (err) {
      console.error(err);
      mostrarNotificacion('Error al conectar con el servidor.', 'danger');
    }
  });

  function mostrarNotificacion(mensaje, tipo = 'info') {
    const container = document.getElementById('notificacion-container');
    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-bg-${tipo} border-0 show`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');
    toast.innerHTML = `
      <div class="d-flex">
        <div class="toast-body">${mensaje}</div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Cerrar"></button>
      </div>
    `;
    container.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 4000);
  }
});
