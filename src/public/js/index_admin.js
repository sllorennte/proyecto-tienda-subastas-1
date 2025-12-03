document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('token');
  if (!token) return (window.location.href = 'login.html');

  const totalUsuariosEl = document.getElementById('total-usuarios');
  const totalProductosEl = document.getElementById('total-productos');
  const totalPujasEl = document.getElementById('total-pujas');

  try {
    const resUsuarios = await fetch(apiUrl('/api/usuarios'), {
      headers: { Authorization: `Bearer ${token}` }
    });
    const usuarios = await resUsuarios.json();
    totalUsuariosEl.textContent = usuarios.length;
  } catch (err) {
    console.error('Error al obtener usuarios:', err);
    totalUsuariosEl.textContent = '—';
  }

  try {
    const resProductos = await fetch(apiUrl('/api/productos'), {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await resProductos.json();
    const productos = data.productos || data; 
    totalProductosEl.textContent = productos.length;
  } catch (err) {
    console.error('Error al obtener productos:', err);
    totalProductosEl.textContent = '—';
  }

  try {
    const resPujas = await fetch(apiUrl('/api/pujas'), {
      headers: { Authorization: `Bearer ${token}` }
    });
    const pujas = await resPujas.json();
    totalPujasEl.textContent = pujas.length;
  } catch (err) {
    console.error('Error al obtener pujas:', err);
    totalPujasEl.textContent = '—';
  }
});
