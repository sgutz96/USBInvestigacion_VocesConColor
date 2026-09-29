/* =============================================================
   EQUIPO.JS
   Lee data/equipo.json y construye con el DOM las tarjetas de
   investigadores, jóvenes investigadores y semilleros.
   Para agregar o cambiar personas edita solo el JSON.
   ============================================================= */

(() => {
  const RUTA_JSON = 'data/Investigadores/equipo.json';

  const $ = (id) => document.getElementById(id);

  // Crea un elemento con clase y texto (textContent: seguro, no interpreta HTML)
  function el(tag, clase, texto) {
    const nodo = document.createElement(tag);
    if (clase) nodo.className = clase;
    if (texto !== undefined && texto !== '') nodo.textContent = texto;
    return nodo;
  }

  // "green" -> var(--green). Si no viene color, usa verde.
  function acento(color) {
    return `var(--${color || 'green'})`;
  }

  // ----- Tarjeta de persona (investigadores y jóvenes) -----
  function crearPersona(p) {
    const card = el('article', 'persona fade-in');
    card.style.setProperty('--accent', acento(p.color));

    card.append(
      el('div', 'persona-rol', p.rol),
      el('h4', '', p.nombre),
      el('p', 'persona-fac', p.facultad),
      el('p', 'persona-grupo', p.detalle)
    );
    return card;
  }

  // ----- Tarjeta de semillero con su lista de semilleristas -----
  function crearSemillero(s) {
    const card = el('article', 'semillero fade-in');
    card.style.setProperty('--accent', acento(s.color));

    const titulo = el('h4', '', s.nombre);
    if (s.descripcion) {
      titulo.append(' ', el('span', '', s.descripcion));
    }

    const meta = el('p', 'semillero-meta');
    meta.append(s.facultad);
    if (s.tutor) {
      // El tutor es opcional: si no está en el JSON, no se muestra la línea
      meta.append(document.createElement('br'), `${s.tutorRol || 'Tutor'}: ${s.tutor}`);
    }

    const lista = el('ul');
    (s.semilleristas || []).forEach((nombre) => lista.append(el('li', '', nombre)));

    card.append(titulo, meta, lista);
    return card;
  }

  // ----- Pinta una lista de datos dentro de un contenedor -----
  function pintar(idContenedor, datos, crear) {
    const contenedor = $(idContenedor);
    if (!contenedor) return [];
    contenedor.replaceChildren(); // limpia el "Cargando…"
    const tarjetas = (datos || []).map(crear);
    contenedor.append(...tarjetas);
    return tarjetas;
  }

  function mostrarError() {
    const contenedor = $('equipo-investigadores');
    if (!contenedor) return;
    const msg = el(
      'p',
      'equipo-estado equipo-error',
      'No se pudo cargar el equipo. Revisa que data/equipo.json exista y que la página se abra desde un servidor (Live Server, GitHub Pages, etc.).'
    );
    contenedor.replaceChildren(msg);
  }

  async function iniciar() {
    try {
      const resp = await fetch(RUTA_JSON);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const datos = await resp.json();

      const tarjetas = [
        ...pintar('equipo-investigadores', datos.investigadores, crearPersona),
        ...pintar('equipo-jovenes', datos.jovenes, crearPersona),
        ...pintar('equipo-semilleros', datos.semilleros, crearSemillero)
      ];

      // Activa la animación de aparición en las tarjetas nuevas
      if (typeof window.observarFade === 'function') {
        window.observarFade(tarjetas);
      } else {
        tarjetas.forEach((t) => t.classList.add('visible'));
      }
    } catch (err) {
      console.error('Equipo:', err);
      mostrarError();
    }
  }

  document.addEventListener('DOMContentLoaded', iniciar);
})();
