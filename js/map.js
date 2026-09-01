/* =========================================================================
   MAPA INTERACTIVO — ENTORNOS PROTECTORES BOGOTÁ
   -------------------------------------------------------------------------
   Mejoras sobre la versión anterior:
   - Iconos propios (SVG) por categoría en vez de marcadores genéricos.
   - Agrupación (clustering) automática en capas con muchos puntos, si el
     plugin Leaflet.markercluster está cargado (opcional, ver nota al final).
   - Transición suave (fade) al cambiar de capa y encuadre animado (flyTo).
   - Popups rediseñados: encabezado con color de categoría + ícono.
   - Leyenda con conteo real de elementos cargados.
   - Buscador que filtra por nombre dentro de la capa activa y centra el mapa.
   - Botones de pestaña deshabilitados mientras carga (evita clics dobles).
   ========================================================================= */

/* ===== DATOS DE CAPAS ===== */
const files = {
  Manzanas:        'data/Manzanas.geojson',
  zomac:           'data/zomac.geojson',
  parques:         'data/parques.geojson',
  proteccion:      'data/proteccion.geojson',
  amazonas:        'data/amazonas.geojson',
  putumayo:        'data/putumayo.geojson',
  Biblioteca:      'data/Biblioteca.geojson',
  huertas_urbanas: 'data/huertas_urbanas.geojson',
  Institucionales: 'data/Institucionales.geojson',
  CAI:             'data/CAI.geojson',
  CAPS:            'data/CAPS.geojson',
  Sin_lucro:       'data/Sin_lucro.geojson',
  Recreacionales:  'data/Recreacionales.geojson',
  Techo_Verde:     'data/Techo_Verde.geojson'
};

/* ===== ESTILOS PARA CAPAS DE POLÍGONO ===== */
const styles = {
  zomac:           { color: '#a3c037', weight: 2, fillColor: '#a3c037', fillOpacity: 0.3 },
  parques:         { color: '#d7822c', weight: 2, fillColor: '#d7822c', fillOpacity: 0.3 },
  proteccion:      { color: '#55b0d2', weight: 2, fillColor: '#55b0d2', fillOpacity: 0.3 },
  amazonas:        { color: '#cc6699', weight: 2, fillColor: '#cc6699', fillOpacity: 0.3 },
  putumayo:        { color: '#7b6baa', weight: 2, fillColor: '#7b6baa', fillOpacity: 0.3 },
  Manzanas:        { color: '#a3c037', weight: 1.5, fillColor: '#a3c037', fillOpacity: 0.25 }
};

/* ===== ICONOGRAFÍA PARA CAPAS DE PUNTO =====
   Cada entrada define un color y un trazo SVG minimalista (24x24, stroke).
   Se dibuja dentro de un círculo de color como marcador propio. */
const pointIcons = {
  Biblioteca: {
    color: '#d7822c',
    path: 'M4 5.5C4 4.7 4.7 4 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5zM20 5.5c0-.8-.7-1.5-1.5-1.5H13v16h5.5c.8 0 1.5-.7 1.5-1.5z'
  },
  huertas_urbanas: {
    color: '#55b0d2',
    path: 'M12 21s-6-4.5-6-10a6 6 0 0 1 12 0c0 5.5-6 10-6 10zM12 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4z'
  },
  Institucionales: {
    color: '#cc6699',
    path: 'M3 21h18M4 21V10l8-6 8 6v11M9 21v-6h6v6'
  },
  CAI: {
    color: '#7b6baa',
    path: 'M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6z'
  },
  CAPS: {
    color: '#a3c037',
    path: 'M12 21s-7-4.35-7-10.5A4.5 4.5 0 0 1 12 6a4.5 4.5 0 0 1 7 4.5C19 16.65 12 21 12 21zM12 9v4M10 11h4'
  },
  Sin_lucro: {
    color: '#d7822c',
    path: 'M12 21s-8-5-8-11a5 5 0 0 1 8-4 5 5 0 0 1 8 4c0 6-8 11-8 11z'
  },
  Recreacionales: {
    color: '#e67e22',
    path: 'M12 2v20M4 8h16M4 16h16'
  },
  Techo_Verde: {
    color: '#2ecc71',
    path: 'M3 20l9-15 9 15zM12 20v-6'
  }
};

const labels = {
  Manzanas: 'Manzanas',
  zomac: 'ZOMAC',
  parques: 'Parques Naturales',
  proteccion: 'Áreas de Protección',
  amazonas: 'Violencia Amazonas',
  putumayo: 'Violencia Putumayo',
  Biblioteca: 'Bibliotecas y Casas de Cultura',
  huertas_urbanas: 'Huertas Urbanas',
  Institucionales: 'Institucionales',
  CAI: 'CAI',
  CAPS: 'CAPS',
  Sin_lucro: 'Sin Ánimo de Lucro',
  Recreacionales: 'Entornos Recreacionales',
  Techo_Verde: 'Techos Verdes'
};

let map, currentLayer;
const cache = {};
let searchIndex = []; // [{ name, latlng, marker }] de la capa activa

/* ===== CSS INYECTADO (autocontenido, no requiere tocar tu global.css) ===== */
function injectStyles() {
  if (document.getElementById('map-enhanced-styles')) return;
  const style = document.createElement('style');
  style.id = 'map-enhanced-styles';
  style.textContent = `
    .map-point-icon {
      display: flex; align-items: center; justify-content: center;
      width: 30px; height: 30px; border-radius: 50%;
      box-shadow: 0 2px 6px rgba(0,0,0,.25);
      border: 2px solid #fff;
      transform: scale(0.6);
      opacity: 0;
      animation: mapPinPop .28s ease-out forwards;
      animation-delay: var(--pin-delay, 0ms);
    }
    @keyframes mapPinPop {
      to { transform: scale(1); opacity: 1; }
    }
    .map-point-icon svg { width: 16px; height: 16px; }

    .leaflet-popup-content-wrapper {
      border-radius: 10px;
      box-shadow: 0 6px 24px rgba(0,0,0,.18);
      padding: 0;
      overflow: hidden;
    }
    .leaflet-popup-content { margin: 0; width: 260px !important; }
    .map-popup { font-family: inherit; animation: mapPopupFade .18s ease-out; }
    @keyframes mapPopupFade { from { opacity: 0; } to { opacity: 1; } }
    .map-popup__header {
      padding: 10px 14px; color: #fff; font-weight: 600; font-size: 14px;
      display: flex; align-items: center; gap: 8px;
    }
    .map-popup__header svg { width: 16px; height: 16px; flex-shrink: 0; }
    .map-popup__body { padding: 10px 14px; font-size: 13px; line-height: 1.5; color: #333; }
    .map-popup__body div + div { margin-top: 4px; }
    .map-popup__body b { color: #555; font-weight: 600; }

    #map-legend .legend-item { transition: opacity .2s ease; }
    #map-legend .legend-dot { transition: transform .25s ease; }
    #map-legend.legend-pulse .legend-dot { animation: legendPulse .5s ease; }
    @keyframes legendPulse { 0% { transform: scale(1); } 50% { transform: scale(1.5); } 100% { transform: scale(1); } }
    .legend-count { color: #888; font-size: 12px; margin-left: 4px; }

    .tab-btn[disabled] { opacity: .5; cursor: wait; pointer-events: none; }

    #map-search {
      position: absolute; top: 12px; left: 50%; transform: translateX(-50%);
      z-index: 1000; width: min(320px, 80%);
    }
    #map-search input {
      width: 100%; padding: 8px 12px; border-radius: 8px; border: 1px solid #ddd;
      box-shadow: 0 2px 10px rgba(0,0,0,.12); font-size: 13px; outline: none;
      transition: border-color .15s ease;
    }
    #map-search input:focus { border-color: #55b0d2; }
    #map-search ul {
      list-style: none; margin: 4px 0 0; padding: 4px; background: #fff;
      border-radius: 8px; box-shadow: 0 4px 16px rgba(0,0,0,.15);
      max-height: 220px; overflow-y: auto;
    }
    #map-search li {
      padding: 7px 10px; font-size: 13px; border-radius: 6px; cursor: pointer;
    }
    #map-search li:hover, #map-search li.active { background: #f2f6f8; }

    .leaflet-fade-layer { transition: opacity .25s ease; }
  `;
  document.head.appendChild(style);
}

/* ===== INICIALIZACIÓN DEL MAPA ===== */
function initMap() {
  map = L.map('map', {
    scrollWheelZoom: true,
    zoomControl: true,
    zoomSnap: 0.5
  }).setView([4.5, -74], 6);

  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '© OpenStreetMap contributors © CARTO',
    maxZoom: 18,
    minZoom: 3
  }).addTo(map);

  window.addEventListener('resize', () => map.invalidateSize());
}

/* ===== UTILIDADES DE INTERFAZ ===== */
function setLoading(isLoading) {
  const el = document.getElementById('map-loading');
  if (el) el.style.display = isLoading ? 'flex' : 'none';
  document.querySelectorAll('.tab-btn').forEach(b => { b.disabled = isLoading; });
}

function setError(hasError) {
  const el = document.getElementById('map-error');
  if (el) el.style.display = hasError ? 'flex' : 'none';
}

function updateLegend(name, count) {
  const legend = document.getElementById('map-legend');
  if (!legend) return;
  const color = (styles[name] || pointIcons[name] || {}).color || '#a3c037';
  legend.innerHTML = `
    <div class="legend-item" style="display:flex;align-items:center;gap:8px;">
      <span class="legend-dot" style="background:${color};width:12px;height:12px;border-radius:50%;display:inline-block;"></span>
      <span style="font-weight:500;">${labels[name] || name}</span>
      ${typeof count === 'number' ? `<span class="legend-count">${count} elementos</span>` : ''}
    </div>`;
  legend.classList.remove('legend-pulse');
  // reflow para poder re-disparar la animación
  void legend.offsetWidth;
  legend.classList.add('legend-pulse');
}

/* ===== ÍCONO DE MARCADOR POR CATEGORÍA ===== */
function makeDivIcon(layerName, delayMs) {
  const cfg = pointIcons[layerName];
  const color = cfg ? cfg.color : '#a3c037';
  const path = cfg ? cfg.path : 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z';
  const html = `
    <div class="map-point-icon" style="background:${color}; --pin-delay:${delayMs}ms;">
      <svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"
           stroke-linecap="round" stroke-linejoin="round">
        <path d="${path}"/>
      </svg>
    </div>`;
  return L.divIcon({ html, className: '', iconSize: [30, 30], iconAnchor: [15, 15], popupAnchor: [0, -15] });
}

/* ===== FORMATEADOR DE POPUPS ===== */
function buildPopupContent(properties, layerName) {
  if (!properties) return '';
  const color = (styles[layerName] || pointIcons[layerName] || {}).color || '#a3c037';
  const iconPath = pointIcons[layerName] ? pointIcons[layerName].path : null;
  const title = properties.nombre || properties.Nombre || properties.NAME || labels[layerName];

  const rows = [];
  for (const [key, val] of Object.entries(properties)) {
    if (['nombre', 'Nombre', 'NAME', 'no', 'N°'].includes(key)) continue;
    if (val === null || val === undefined || val === '') continue;

    const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

    let formattedVal = val;
    if (typeof val === 'string' && val.includes('@')) {
      formattedVal = `<a href="mailto:${val}">${val}</a>`;
    } else if (typeof val === 'string' && val.startsWith('http')) {
      formattedVal = `<a href="${val}" target="_blank" rel="noopener">Ver enlace</a>`;
    }
    rows.push(`<div><b>${formattedKey}:</b> ${formattedVal}</div>`);
  }

  return `
    <div class="map-popup">
      <div class="map-popup__header" style="background:${color};">
        ${iconPath ? `<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${iconPath}"/></svg>` : ''}
        <span>${title}</span>
      </div>
      <div class="map-popup__body">${rows.slice(0, 7).join('')}</div>
    </div>`;
}

/* ===== CAMBIO Y CARGA DE CAPAS ===== */
async function switchMap(name, btnEl) {
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
  closeSearch();

  try {
    if (!cache[name]) {
      const res = await fetch(files[name]);
      if (!res.ok) throw new Error(`HTTP ${res.status} al cargar ${files[name]}`);
      cache[name] = await res.json();
    }

    // Desvanecer capa anterior antes de quitarla
    if (currentLayer) {
      const oldLayer = currentLayer;
      const pane = map.getPane('overlayPane');
      if (pane) pane.classList.add('leaflet-fade-layer');
      if (pane) pane.style.opacity = '0';
      await new Promise(r => setTimeout(r, 180));
      map.removeLayer(oldLayer);
      if (pane) { pane.style.opacity = '1'; pane.classList.remove('leaflet-fade-layer'); }
    }

    const isPointLayer = !!pointIcons[name];
    const layerStyle = styles[name] || { color: '#a3c037', weight: 2, fillColor: '#a3c037', fillOpacity: 0.5 };

    searchIndex = [];
    let pointCounter = 0;

    const geoLayer = L.geoJSON(cache[name], {
      style: layerStyle,

      pointToLayer: (feature, latlng) => {
        const delay = Math.min(pointCounter * 18, 600);
        pointCounter++;
        return L.marker(latlng, { icon: makeDivIcon(name, delay) });
      },

      onEachFeature: (feature, layer) => {
        const popupContent = buildPopupContent(feature.properties, name);
        if (popupContent) layer.bindPopup(popupContent);

        const tooltipName = feature.properties?.nombre || feature.properties?.Nombre || labels[name];
        if (tooltipName) {
          layer.bindTooltip(String(tooltipName), { direction: 'top', sticky: true, opacity: 0.9 });
          if (layer.getLatLng) {
            searchIndex.push({ name: String(tooltipName), latlng: layer.getLatLng(), layer });
          }
        }

        if (!isPointLayer) {
          layer.on({
            mouseover: (e) => e.target.setStyle && e.target.setStyle({ weight: 3, fillOpacity: 0.9 }),
            mouseout: (e) => currentLayer.resetStyle(e.target)
          });
        }
      }
    });

    // Agrupar en clusters si el plugin está disponible y hay muchos puntos
    if (isPointLayer && typeof L.markerClusterGroup === 'function' && searchIndex.length > 30) {
      const clusterGroup = L.markerClusterGroup({ maxClusterRadius: 45, spiderfyOnMaxZoom: true });
      clusterGroup.addLayer(geoLayer);
      currentLayer = clusterGroup;
    } else {
      currentLayer = geoLayer;
    }
    currentLayer.addTo(map);

    updateLegend(name, searchIndex.length || cache[name]?.features?.length);

    const bounds = geoLayer.getBounds ? geoLayer.getBounds() : null;
    if (bounds && bounds.isValid()) {
      map.flyToBounds(bounds, { padding: [30, 30], maxZoom: 16, duration: 0.8 });
    }

  } catch (err) {
    console.error('Error al cargar la capa:', err);
    setError(true);
  } finally {
    setLoading(false);
  }
}

/* ===== BUSCADOR (filtra la capa activa por nombre) ===== */
function setupSearch() {
  const mapEl = document.getElementById('map');
  if (!mapEl || document.getElementById('map-search')) return;

  const wrap = document.createElement('div');
  wrap.id = 'map-search';
  wrap.innerHTML = `<input type="text" placeholder="Buscar por nombre en esta capa..." autocomplete="off" /><ul style="display:none;"></ul>`;
  mapEl.style.position = mapEl.style.position || 'relative';
  mapEl.prepend(wrap);

  const input = wrap.querySelector('input');
  const list = wrap.querySelector('ul');

  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    list.innerHTML = '';
    if (!q) { list.style.display = 'none'; return; }

    const matches = searchIndex.filter(it => it.name.toLowerCase().includes(q)).slice(0, 8);
    if (!matches.length) { list.style.display = 'none'; return; }

    matches.forEach(m => {
      const li = document.createElement('li');
      li.textContent = m.name;
      li.addEventListener('click', () => {
        map.flyTo(m.latlng, Math.max(map.getZoom(), 15), { duration: 0.6 });
        m.layer.openPopup ? m.layer.openPopup() : null;
        closeSearch();
      });
      list.appendChild(li);
    });
    list.style.display = 'block';
  });

  document.addEventListener('click', (e) => {
    if (!wrap.contains(e.target)) list.style.display = 'none';
  });
}

function closeSearch() {
  const wrap = document.getElementById('map-search');
  if (!wrap) return;
  const input = wrap.querySelector('input');
  const list = wrap.querySelector('ul');
  if (input) input.value = '';
  if (list) { list.innerHTML = ''; list.style.display = 'none'; }
}

/* ===== EVENTOS AL CARGAR EL DOM ===== */
document.addEventListener('DOMContentLoaded', () => {
  injectStyles();
  initMap();
  setupSearch();

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add('visible');
    });
  }, { threshold: 0.15 });
  document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

  document.querySelector('.hamburger')?.addEventListener('click', () => {
    document.querySelector('.nav-links')?.classList.toggle('mobile-open');
  });

  switchMap('Biblioteca');
});