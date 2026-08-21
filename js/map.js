  /* ===== DATOS DE CAPAS ===== */
  const files = {
    Manzanas:   'data/Manzanas.geojson',
    zomac:      'data/zomac.geojson',
    parques:    'data/parques.geojson',
    proteccion: 'data/proteccion.geojson',
    amazonas:   'data/amazonas.geojson',
    putumayo:   'data/putumayo.geojson'
  };

  const styles = {
    Manzanas:   { color: '#4b37c0', weight: 2, fillColor: '#4b37c0', fillOpacity: 0.25 }, // purple
    zomac:      { color: '#a3c037', weight: 2, fillColor: '#a3c037', fillOpacity: 0.25 }, // green
    parques:    { color: '#d7822c', weight: 2, fillColor: '#d7822c', fillOpacity: 0.25 }, // orange
    proteccion: { color: '#55b0d2', weight: 2, fillColor: '#55b0d2', fillOpacity: 0.25 }, // blue
    amazonas:   { color: '#cc6699', weight: 2, fillColor: '#cc6699', fillOpacity: 0.25 }, // pink
    putumayo:   { color: '#7b6baa', weight: 2, fillColor: '#7b6baa', fillOpacity: 0.25 }  // purple
  };

  const labels = {
    Manzanas: 'Manzanas',
    zomac: 'ZOMAC',
    parques: 'Parques Naturales',
    proteccion: 'Áreas de Protección',
    amazonas: 'Violencia Amazonas',
    putumayo: 'Violencia Putumayo'
  };

  let map, currentLayer;
  const cache = {};

  function initMap(){
    map = L.map('map', { scrollWheelZoom: true }).setView([4.5, -74], 6);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap contributors © CARTO',
      maxZoom: 18
    }).addTo(map);
  }

  function setLoading(isLoading){
    document.getElementById('map-loading').style.display = isLoading ? 'flex' : 'none';
  }

  function setError(hasError){
    document.getElementById('map-error').style.display = hasError ? 'flex' : 'none';
  }

  function updateLegend(name){
    const legend = document.getElementById('map-legend');
    const color = styles[name]?.color || '#a3c037';
    legend.innerHTML = `
      <div class="legend-item">
        <span class="legend-dot" style="background:${color}"></span>
        <span>${labels[name]}</span>
      </div>`;
  }

  async function switchMap(name, btnEl){
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    if (btnEl) {
      btnEl.classList.add('active');
    } else {
      document.querySelectorAll('.tab-btn').forEach(b => {
        if (b.getAttribute('onclick')?.includes(`'${name}'`)) b.classList.add('active');
      });
    }

    setError(false);
    setLoading(true);
    updateLegend(name);

    try {
      if (!cache[name]) {
        const res = await fetch(files[name]);
        if (!res.ok) throw new Error(`HTTP ${res.status} al cargar ${files[name]}`);
        cache[name] = await res.json();
      }

      if (currentLayer) map.removeLayer(currentLayer);

      currentLayer = L.geoJSON(cache[name], {
        style: styles[name] || {},
        onEachFeature: (feature, layer) => {
          if (feature.properties) {
            const rows = Object.entries(feature.properties)
              .slice(0, 8)
              .map(([k, v]) => `<strong>${k}:</strong> ${v}`)
              .join('<br/>');
            if (rows) layer.bindPopup(rows);
          }
        }
      }).addTo(map);

      const bounds = currentLayer.getBounds();
      if (bounds.isValid()) map.fitBounds(bounds, { padding: [20, 20] });

    } catch (err) {
      console.error(err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  /* ===== SCROLL FADE-IN (coherente con global.css) ===== */
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add('visible');
    });
  }, { threshold: 0.15 });
  document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

  /* ===== HAMBURGUESA (mobile) ===== */
  document.querySelector('.hamburger')?.addEventListener('click', () => {
    document.querySelector('.nav-links')?.classList.toggle('mobile-open');
  });

  initMap();
  switchMap('Manzanas');