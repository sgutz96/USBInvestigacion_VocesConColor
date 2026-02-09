// MAPAS INTERACTIVOS - CAMBIO DE PESTAÑAS
const tabButtons = document.querySelectorAll('.tab-button');
const mapContents = document.querySelectorAll('.map-content');

tabButtons.forEach(button => {
  button.addEventListener('click', () => {
    // Desactivar todos los botones y mapas
    tabButtons.forEach(btn => {
      btn.classList.remove('active');
      btn.setAttribute('aria-selected', 'false');
    });
    
    mapContents.forEach(map => {
      map.classList.remove('active');
      map.setAttribute('hidden', '');
    });

    // Activar el botón actual
    button.classList.add('active');
    button.setAttribute('aria-selected', 'true');

    // Obtener el mapa correspondiente
    const mapId = button.dataset.map;
    const selectedMap = document.getElementById(mapId);

    // Si aún no se ha cargado el iframe, lo inyecta con atributos de accesibilidad
    if (!selectedMap.querySelector('iframe')) {
      const src = selectedMap.dataset.src;
      const iframe = document.createElement('iframe');
      iframe.src = src;
      iframe.allowFullscreen = true;
      
      // Añadir título descriptivo según el mapa
      const mapTitles = {
        'zomac': 'Mapa interactivo de Zonas Más Afectadas por el Conflicto (ZOMAC) en Colombia',
        'parques': 'Mapa interactivo de Parques Naturales de Colombia',
        'proteccion': 'Mapa interactivo de Áreas de Protección en Colombia',
        'amazonas': 'Mapa interactivo de violencia en la región del Amazonas',
        'putumayo': 'Mapa interactivo de violencia en la región de Putumayo'
      };
      
      iframe.title = mapTitles[mapId] || 'Mapa interactivo de Colombia';
      iframe.setAttribute('aria-label', mapTitles[mapId] || 'Mapa interactivo de Colombia');
      
      selectedMap.appendChild(iframe);
    }

    // Mostrar el mapa seleccionado
    selectedMap.classList.add('active');
    selectedMap.removeAttribute('hidden');
    selectedMap.focus(); // Mejorar accesibilidad al cambiar de tab
  });
  
  // Añadir soporte de teclado para las pestañas
  button.addEventListener('keydown', (e) => {
    let targetButton = null;
    
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      const nextButton = button.nextElementSibling || tabButtons[0];
      targetButton = nextButton;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      const prevButton = button.previousElementSibling || tabButtons[tabButtons.length - 1];
      targetButton = prevButton;
    } else if (e.key === 'Home') {
      e.preventDefault();
      targetButton = tabButtons[0];
    } else if (e.key === 'End') {
      e.preventDefault();
      targetButton = tabButtons[tabButtons.length - 1];
    }
    
    if (targetButton) {
      targetButton.focus();
      targetButton.click();
    }
  });
});
