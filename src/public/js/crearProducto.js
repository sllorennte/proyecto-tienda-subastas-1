import { mostrarNotificacion } from './notificacion.module.js';

document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/login.html';
    return;
  }

  const payload = JSON.parse(atob(token.split('.')[1]));
  const userId = payload.id;

  const form = document.getElementById('form-crear-producto');
  const inputImagenes = document.getElementById('imagenesFiles');
  const previewCont = document.getElementById('preview-imagenes');
  const selectCategoria = document.getElementById('categoria');
  // Preview selected files from local filesystem
  inputImagenes.addEventListener('change', () => {
    const files = Array.from(inputImagenes.files || [] ).slice(0,6);
    previewCont.innerHTML = '';
    files.forEach(file => {
      const reader = new FileReader();
      const img = document.createElement('img');
      img.alt = file.name;
      img.style.width = '90px'; img.style.height = '90px'; img.style.objectFit = 'cover';
      reader.onload = e => { img.src = e.target.result; };
      reader.readAsDataURL(file);
      previewCont.appendChild(img);
    });
  });

  form.addEventListener('submit', async e => {
    e.preventDefault();

    const titulo = document.getElementById('titulo').value.trim();
    const descripcion = document.getElementById('descripcion').value.trim();
    const precioInicialRaw = document.getElementById('precioInicial').value;
    const imagenesRaw = document.getElementById('imagenes').value.trim();
    const fechaExpiracionRaw = document.getElementById('fechaExpiracion').value;

    if (!titulo) {
      mostrarNotificacion('El campo "Título" es obligatorio.', 'warning');
      return;
    }

    if (!precioInicialRaw) {
      mostrarNotificacion('Debes indicar un "Precio inicial".', 'warning');
      return;
    }

    const precioInicial = parseFloat(precioInicialRaw);
    if (isNaN(precioInicial) || precioInicial < 0) {
      mostrarNotificacion('El "Precio inicial" debe ser un número positivo.', 'warning');
      return;
    }

    if (!fechaExpiracionRaw) {
      mostrarNotificacion('La "Fecha de expiración" es obligatoria.', 'warning');
      return;
    }

    const fechaExpiracion = new Date(fechaExpiracionRaw);
    if (isNaN(fechaExpiracion.getTime()) || fechaExpiracion <= new Date()) {
      mostrarNotificacion('La "Fecha de expiración" debe ser una fecha válida y futura.', 'warning');
      return;
    }

    // If files are selected, upload them first to /api/uploads
    let imagenes = [];
    const files = Array.from(inputImagenes.files || []).slice(0,6);
    if (files.length) {
      try {
        const fd = new FormData();
        files.forEach(f => fd.append('files', f));
        const up = await fetch(apiUrl('/api/uploads'), {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: fd
        });
        const upData = await up.json();
        if (!up.ok) {
          mostrarNotificacion(upData.error || 'Error subiendo imágenes', 'danger');
          return;
        }
        // uploadController returns { archivos: [filenames...] }
        imagenes = (upData.archivos || []).slice(0,6);
      } catch (err) {
        console.error('Error subiendo archivos:', err);
        mostrarNotificacion('Error subiendo imágenes', 'danger');
        return;
      }
    }

    const payloadBody = {
      titulo,
      descripcion,
      precioInicial,
      imagenes: imagenes,
      categoria: selectCategoria ? selectCategoria.value : '',
      vendedor: userId,
      fechaExpiracion: fechaExpiracion.toISOString()
    };

    try {
      const res = await fetch(apiUrl('/api/productos'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payloadBody)
      });

      const data = await res.json();

      if (!res.ok) {
        mostrarNotificacion(data.error || 'Error desconocido al crear el producto.', 'danger');
        return;
      }

      mostrarNotificacion('Producto creado con éxito', 'success');
      window.location.href = '/';
    } catch (err) {
      console.error(err);
      mostrarNotificacion('Error de red o servidor, inténtalo de nuevo.', 'danger');
    }
  });
});