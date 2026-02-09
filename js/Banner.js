import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.158.0/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.158.0/examples/jsm/controls/OrbitControls.js';
import { ARButton } from 'https://cdn.jsdelivr.net/npm/three@0.158.0/examples/jsm/webxr/ARButton.js';

const canvas = document.getElementById('three-canvas');
const banner = document.querySelector('.banner');
const fullscreenBtn = document.getElementById('fullscreenBtn');

// --- 1. ESCENA Y CONFIGURACIÓN BÁSICA ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111);

const camera = new THREE.PerspectiveCamera(
  75,
  canvas.clientWidth / canvas.clientHeight,
  0.1,
  1000
);
camera.position.set(0, 1, 3);

// Renderizador con soporte para Transparencia (Alpha) y XR
const renderer = new THREE.WebGLRenderer({ 
  canvas, 
  antialias: true, 
  alpha: true 
});
renderer.setSize(canvas.clientWidth, canvas.clientHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.xr.enabled = true; // Habilitar capacidades de Realidad Aumentada

// --- 2. BOTÓN DE REALIDAD AUMENTADA (XR) ---
// El ARButton aparece automáticamente si el dispositivo es compatible
const arButton = ARButton.createButton(renderer, {
  requiredFeatures: ['hit-test'], // Para futura detección de superficies
  optionalFeatures: ['dom-overlay'],
  domOverlay: { root: document.body }
});

// Mejorar accesibilidad del botón AR
arButton.setAttribute('aria-label', 'Activar modo de Realidad Aumentada');
arButton.setAttribute('title', 'Ver en Realidad Aumentada');

document.body.appendChild(arButton);

// --- 3. CONTROLES DE ÓRBITA ---
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enabled = false; // Desactivado por defecto (solo activo en fullscreen)

// --- 4. OBJETO 3D ---
const geometry = new THREE.TorusKnotGeometry(0.5, 0.15, 100, 16);
const material = new THREE.MeshStandardMaterial({ 
  color: 0x00ffcc,
  metalness: 0.7,
  roughness: 0.2
});
const mesh = new THREE.Mesh(geometry, material);
mesh.position.set(0, 0, -1); // Un poco alejado para que se vea bien al entrar en AR
scene.add(mesh);

// --- 5. ILUMINACIÓN ---
scene.add(new THREE.AmbientLight(0xffffff, 1));
const light = new THREE.DirectionalLight(0xffffff, 2);
light.position.set(2, 5, 5);
scene.add(light);

// --- 6. LÓGICA DE PANTALLA COMPLETA (TOGGLE) ---
fullscreenBtn.addEventListener('click', () => {
  if (!document.fullscreenElement) {
    if (banner.requestFullscreen) {
      banner.requestFullscreen();
    }
    fullscreenBtn.innerHTML = '<span class="icon" aria-hidden="true">⛶</span> <span class="text">Contraer</span>';
    fullscreenBtn.setAttribute('aria-label', 'Contraer visualización 3D desde pantalla completa');
    controls.enabled = true;
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    }
    fullscreenBtn.innerHTML = '<span class="icon" aria-hidden="true">⛶</span> <span class="text">Expandir</span>';
    fullscreenBtn.setAttribute('aria-label', 'Expandir visualización 3D a pantalla completa');
    controls.enabled = false;
  }
});

// Soporte de teclado para el botón fullscreen
fullscreenBtn.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    fullscreenBtn.click();
  }
});

// Ajuste si el usuario sale con la tecla ESC
document.addEventListener('fullscreenchange', () => {
  if (!document.fullscreenElement) {
    fullscreenBtn.innerHTML = '<span class="icon" aria-hidden="true">⛶</span> <span class="text">Expandir</span>';
    fullscreenBtn.setAttribute('aria-label', 'Expandir visualización 3D a pantalla completa');
    controls.enabled = false;
    scene.background = new THREE.Color(0x111111);
    
    // SOLUCIÓN: Esperar al siguiente frame de renderizado
    requestAnimationFrame(() => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
  } else {
    scene.background = null;
  }
});

// --- 7. RESIZE RESPONSIVO ---
window.addEventListener('resize', () => {
  const w = banner.clientWidth;
  const h = banner.clientHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
});

// --- 8. BUCLE DE ANIMACIÓN (COMPATIBLE CON XR) ---
// Nota: En XR no usamos requestAnimationFrame, usamos setAnimationLoop
renderer.setAnimationLoop(() => {
  // Rotación automática solo si NO estamos interactuando manualmente
  if (!controls.enabled && !renderer.xr.isPresenting) {
    mesh.rotation.y += 0.01;
    mesh.rotation.x += 0.005;
  }

  controls.update();
  renderer.render(scene, camera);
});

// Anunciar estado de carga para lectores de pantalla
canvas.setAttribute('aria-busy', 'false');
canvas.setAttribute('aria-live', 'polite');
