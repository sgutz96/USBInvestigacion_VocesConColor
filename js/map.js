// MAPAS INTERACTIVOS - CAMBIO DE PESTAÑAS
const tabButtons = document.querySelectorAll('.tab-button');
const mapContents = document.querySelectorAll('.map-content');

tabButtons.forEach(button => {
  button.addEventListener('click', () => {
    // Desactivar todos los botones y mapas
    tabButtons.forEach(btn => btn.classList.remove('active'));
    mapContents.forEach(map => map.classList.remove('active'));

    // Activar el botón actual
    button.classList.add('active');

    // Obtener el mapa correspondiente
    const mapId = button.dataset.map;
    const selectedMap = document.getElementById(mapId);

    // Si aún no se ha cargado el iframe, lo inyecta
    if (!selectedMap.querySelector('iframe')) {
      const src = selectedMap.dataset.src;
      const iframe = document.createElement('iframe');
      iframe.src = src;
      iframe.allowFullscreen = true;
      selectedMap.appendChild(iframe);
    }

    // Mostrar el mapa seleccionado
    selectedMap.classList.add('active');
  });
});
