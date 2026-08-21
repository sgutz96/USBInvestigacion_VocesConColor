   // Map switching
    const mapUrls = {
      zomac: "//usb-ing-multi.maps.arcgis.com/apps/Embed/index.html?webmap=37dacfbbe7ee4d6b84119d50acfedf3f&extent=-85.8306,-5.5846,-62.8472,5.8878",
      parques: "//usb-ing-multi.maps.arcgis.com/apps/Embed/index.html?webmap=29f4c6d2b6da444f878a91d7cd2dc99b&extent=-79.1677,-2.3881,-67.676,3.3552",
      proteccion: "//usb-ing-multi.maps.arcgis.com/apps/Embed/index.html?webmap=75ee39ee619245408f2a9930b82f06e9&extent=-85.6935,-10.914,-39.7267,11.916",
      amazonas: "//usb-ing-multi.maps.arcgis.com/apps/Embed/index.html?webmap=9a8e1fe5afdb4e7cb0729cdf871e8a5c&extent=-80.4749,-7.7664,-57.4915,2.4701",
      putumayo: "//usb-ing-multi.maps.arcgis.com/apps/Embed/index.html?webmap=354a809af55648cbbe35527fbaccaf16&extent=-81.3153,-1.8378,-69.8236,3.2907"
    };

    function switchMap(key, btn) {
      document.getElementById('map-iframe').src = mapUrls[key];
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    }

    // Hamburger
    function toggleMenu() {
      const links = document.querySelector('.nav-links');
      if (links.style.display === 'flex') {
        links.style.display = '';
      } else {
        links.style.cssText = 'display:flex;flex-direction:column;position:absolute;top:72px;left:0;right:0;background:var(--white);padding:1rem 8%;border-bottom:3px solid var(--green);gap:1rem;z-index:999;';
      }
    }

    // Scroll animations
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

    // Nav scroll effect
    window.addEventListener('scroll', () => {
      const nav = document.querySelector('nav');
      if (window.scrollY > 50) {
        nav.style.boxShadow = '0 4px 30px rgba(0,0,0,0.12)';
      } else {
        nav.style.boxShadow = '0 4px 20px rgba(163,192,55,0.15)';
      }
    });


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
