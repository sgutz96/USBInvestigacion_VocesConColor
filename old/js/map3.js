 // Rutas a los archivos GeoJSON. Ajusta según dónde guardes tus datos.
  const files = {
    zomac:      '../data/zomac.geojson',
    parques:    '../data/parques.geojson',
    proteccion: '../data/proteccion.geojson',
    amazonas:   '../data/amazonas.geojson',
    putumayo:   '../data/putumayo.geojson'
  };

  // Estilo opcional por capa (color de borde/relleno)
  const styles = {
    zomac:      { color: '#22c55e', weight: 1.5, fillOpacity: 0.25 },
    parques:    { color: '#14b8a6', weight: 1.5, fillOpacity: 0.25 },
    proteccion: { color: '#8b5cf6', weight: 1.5, fillOpacity: 0.25 },
    amazonas:   { color: '#f87171', weight: 1.5, fillOpacity: 0.25 },
    putumayo:   { color: '#f59e0b', weight: 1.5, fillOpacity: 0.25 }
  };

  let map, currentLayer;
  const cache = {}; // evita volver a pedir un geojson ya cargado

  function initMap(){
    map = L.map('map', { scrollWheelZoom: true }).setView([4.5, -74], 6);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 18
    }).addTo(map);
  }

  function setLoading(isLoading){
    document.getElementById('map-loading').style.display = isLoading ? 'flex' : 'none';
  }

  function setError(hasError){
    document.getElementById('map-error').style.display = hasError ? 'flex' : 'none';
  }

  async function switchMap(name, btnEl){
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    if (btnEl) btnEl.classList.add('active');
    else {
      // si se llama sin botón (carga inicial), marca el tab correspondiente
      document.querySelectorAll('.tab-btn').forEach(b => {
        if (b.getAttribute('onclick')?.includes(`'${name}'`)) b.classList.add('active');
      });
    }

    setError(false);
    setLoading(true);

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

  initMap();
  switchMap('zomac');