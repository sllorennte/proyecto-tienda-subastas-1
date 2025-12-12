document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('form-reset-password');
  const emailEl = document.getElementById('email');
  const passwordEl = document.getElementById('password');
  const password2El = document.getElementById('password2');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = emailEl ? emailEl.value.trim() : '';
    const password = passwordEl ? passwordEl.value : '';
    const password2 = password2El ? password2El.value : '';

    if (!email || !password || !password2) {
      if (window.mostrarNotificacion) mostrarNotificacion('Completa todos los campos.', 'warning');
      return;
    }

    if (password !== password2) {
      if (window.mostrarNotificacion) mostrarNotificacion('Las contraseñas no coinciden.', 'warning');
      return;
    }

    try {
      const res = await fetch(apiUrl('/api/usuarios/reset-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg = data.error || data.message || 'No se pudo actualizar la contraseña.';
        if (window.mostrarNotificacion) mostrarNotificacion(msg, 'danger');
        return;
      }

      if (passwordEl) passwordEl.value = '';
      if (password2El) password2El.value = '';

      if (window.mostrarNotificacion) mostrarNotificacion(data.mensaje || 'Contraseña actualizada. Redirigiendo al login...', 'success');
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 1500);
    } catch (err) {
      console.error(err);
      if (window.mostrarNotificacion) mostrarNotificacion('Error de red al actualizar la contraseña.', 'danger');
    }
  });
});
