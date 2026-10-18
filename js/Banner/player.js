import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { BG_COLOR, FOG_DENSITY, MAIN_H, MAIN_CX, MAIN_CZ } from './environment.js';

const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)
  || (navigator.maxTouchPoints > 1 && /Macintosh/.test(navigator.userAgent))
  || window.innerWidth < 900;

/**
 * Cámara, controles libres, auto-órbita y modo AR.
 * ui = { exploreBtn, arBtn, hintEl }
 */
export function createPlayer({ scene, renderer, width, height, ui }) {
  const { exploreBtn, arBtn, hintEl } = ui;

  // ── CAMERA ───────────────────────────────────────────────────
  const camera = new THREE.PerspectiveCamera(52, width / height, 0.1, 300);
  camera.position.set(0, 5, 16);
  camera.lookAt(0, 5, 0);

  // ── ORBIT CONTROLS ───────────────────────────────────────────
  let controlsActive = false;
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.07;
  controls.minDistance = 5;
  controls.maxDistance = 25;
  controls.maxPolarAngle = Math.PI / 2.05;
  controls.target.set(MAIN_CX, MAIN_H * 0.5, MAIN_CZ);
  controls.enabled = false;

  exploreBtn.addEventListener('click', () => {
    controlsActive = !controlsActive;
    controls.enabled = controlsActive;
    if (controlsActive) {
      exploreBtn.classList.add('active');
      exploreBtn.innerHTML = '✓ Modo Libre';
      renderer.domElement.style.cursor = 'grab';
    } else {
      exploreBtn.classList.remove('active');
      exploreBtn.innerHTML = '<span class="explore-icon">✦</span> Explorar en 3D';
      renderer.domElement.style.cursor = 'default';
    }
  });

  // ── AR ───────────────────────────────────────────────────────
  let arSession = null;

  async function initAR() {
    if (!isMobile) return;
    hintEl.querySelector('.hint-icon').textContent = '👆';
    hintEl.querySelector('.hint-text').textContent = 'Toca para ver en AR';
    if (!('xr' in navigator)) return;
    try {
      const ok = await navigator.xr.isSessionSupported('immersive-ar');
      if (!ok) { arBtn.innerHTML = '📱 AR no soportado'; arBtn.style.opacity = '0.6'; }
    } catch (e) { /* puede fallar antes del gesto del usuario */ }
  }

  async function startAR() {
    if (arSession) { arSession.end(); return; }
    if (!('xr' in navigator)) {
      alert('WebXR no disponible.\nUsa Chrome en Android con HTTPS.'); return;
    }
    arBtn.innerHTML = '⏳ Iniciando AR…'; arBtn.disabled = true;
    try {
      arSession = await navigator.xr.requestSession('immersive-ar', {
        requiredFeatures: ['local'],
        optionalFeatures: ['dom-overlay', 'hit-test'],
        domOverlay: { root: document.getElementById('hero-visual') }
      });
      renderer.xr.setReferenceSpaceType('local');
      await renderer.xr.setSession(arSession);
      scene.background = null; scene.fog = null;
      renderer.setClearColor(0x000000, 0);
      arBtn.innerHTML = '✕ Salir AR'; arBtn.disabled = false;
      arBtn.style.background = 'rgba(204,102,153,0.9)';
      arSession.addEventListener('end', exitAR);
    } catch (e) {
      let msg = '⚠ Error AR';
      if (e.name === 'NotSupportedError') msg = '⚠ AR no soportado aquí';
      if (e.name === 'SecurityError') msg = '⚠ Requiere HTTPS + cámara';
      arBtn.innerHTML = msg; arBtn.disabled = false;
      setTimeout(() => { arBtn.innerHTML = '📱 Ver en AR'; }, 3500);
    }
  }

  function exitAR() {
    arSession = null;
    scene.background = new THREE.Color(BG_COLOR);
    scene.fog = new THREE.FogExp2(BG_COLOR, FOG_DENSITY);
    renderer.setClearColor(BG_COLOR, 1);
    arBtn.innerHTML = '📱 Ver en AR'; arBtn.style.background = ''; arBtn.disabled = false;
  }

  arBtn.addEventListener('click', startAR);
  initAR();

  // ── UPDATE ───────────────────────────────────────────────────
  let autoAngle = 0;

  function update(t) {
    if (!controlsActive && !renderer.xr.isPresenting) {
      autoAngle += 0.0011;
      camera.position.x = Math.sin(autoAngle) * 16;
      camera.position.z = Math.cos(autoAngle) * 16;
      camera.position.y = 5 + Math.sin(t * 0.17) * 0.8;
      camera.lookAt(MAIN_CX, MAIN_H * 0.6, MAIN_CZ);
    }
    if (controlsActive) controls.update();
  }

  function resize(w, h) {
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  return { camera, update, resize };
}
