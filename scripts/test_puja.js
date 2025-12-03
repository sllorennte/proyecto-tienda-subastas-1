(async () => {
  const base = 'http://127.0.0.1:3000';
  const email = `testuser_${Date.now()}@example.com`;
  const username = `testuser_${Date.now()}`;
  const password = 'Password123!';

  try {
    // Esperar a que el servidor esté disponible (reintentos)
    const waitForServer = async (retries = 10, delay = 500) => {
      for (let i = 0; i < retries; i++) {
        try {
          const r = await fetch(base + '/');
          if (r.ok || r.status === 200) return true;
        } catch (e) {
          // ignore
        }
        await new Promise(r => setTimeout(r, delay));
      }
      throw new Error('Servidor no disponible en ' + base);
    };

    await waitForServer(20, 500);
    // Register
    let res = await fetch(base + '/api/usuarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });
    console.log('Registro usuario status', res.status);
    const reg = await res.json();
    console.log('Registro body', reg);

    // Login
    res = await fetch(base + '/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    console.log('Login status', res.status);
    const login = await res.json();
    console.log('Login body', login);
    const token = login.token;

    // Crear producto
    const fechaExp = new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString();
    res = await fetch(base + '/api/productos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ titulo: 'Producto de prueba', precioInicial: 10, vendedor: login.id || login.userId || null, fechaExpiracion: fechaExp })
    });
    console.log('Crear producto status', res.status);
    const prod = await res.json();
    console.log('Crear producto body', prod);

    const productoId = prod.producto?._id || (prod.producto && prod.producto._id) || prod._id;

    // Hacer puja
    res = await fetch(base + '/api/pujas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ producto: productoId, cantidad: 20 })
    });
    console.log('Crear puja status', res.status);
    const puja = await res.json();
    console.log('Crear puja body', puja);

  } catch (err) {
    console.error('Test error', err);
  }
})();