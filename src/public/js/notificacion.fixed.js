// notificacion.fixed.js — versión no-modular para <script> clásico
function mostrarNotificacion(mensaje, tipo = 'info') {
  const container = document.getElementById('notificacion-container');
  if (!container) return;

  const div = document.createElement('div');
  div.className = `toast align-items-center text-bg-${tipo} border-0 show mb-2`;
  div.setAttribute('role', 'alert');
  div.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">${mensaje}</div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
    </div>
  `;
  container.appendChild(div);

  setTimeout(() => div.remove(), 4000);
}

window.mostrarNotificacion = mostrarNotificacion;
