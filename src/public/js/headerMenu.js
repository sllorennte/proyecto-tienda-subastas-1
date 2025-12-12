document.addEventListener('DOMContentLoaded', () => {
  const header = document.querySelector('.app-header');
  if (!header) return;

  const toggle = header.querySelector('.app-header__toggle');
  const menu = header.querySelector('.app-header__menu');
  if (!toggle || !menu) return;

  const closeMenu = () => {
    header.classList.remove('is-menu-open');
    toggle.setAttribute('aria-expanded', 'false');
  };

  const openMenu = () => {
    header.classList.add('is-menu-open');
    toggle.setAttribute('aria-expanded', 'true');
  };

  toggle.addEventListener('click', () => {
    const isOpen = header.classList.contains('is-menu-open');
    if (isOpen) closeMenu();
    else openMenu();
  });

  // Cerrar al navegar (en móvil)
  menu.addEventListener('click', (e) => {
    const a = e.target && e.target.closest ? e.target.closest('a') : null;
    if (!a) return;
    closeMenu();
  });

  // Cerrar con Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
  });

  // Si se agranda la pantalla, cerramos para evitar estados raros
  window.addEventListener('resize', () => {
    if (window.innerWidth >= 992) closeMenu();
  });
});
