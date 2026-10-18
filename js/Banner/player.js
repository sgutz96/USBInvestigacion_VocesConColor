import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { BG_COLOR, FOG_DENSITY, MAIN_H, MAIN_CX, MAIN_CZ } from './environment.js';

const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)
  || (navigator.maxTouchPoints > 1 && /Macintosh/.test(navigator.userAgent))
  || window.innerWidth < 900;

// ── AR: el usuario es un personaje dentro del parque (escala 1:1) ──
const AR_SPAWN = new THREE.Vector3(0, 0, 8);   // dónde aparece (coordenadas del parque); mira hacia el carrusel
const AR_EYE_HEIGHT = 1.4;    // altura supuesta de los ojos hasta detectar el suelo real
const AR_WALK_SPEED = 1.6;    // m/s al mantener el dedo pulsado
const AR_WALK_LIMIT = 15;     // radio máximo al que se puede caminar (la cerca está en 15.5)
const AR_FULL_WORLD = false;  // false: se ve la cámara real con el parque encima · true: también cielo y horizonte virtuales
const Y_AXIS = new THREE.Vector3(0, 1, 0);

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
  let arRoot = null;          // grupo con todo el parque mientras dura la sesión AR
  let arAutoPlaced = false;   // ya se colocó al usuario en el punto de aparición
  let floorLocked = false;    // ya se ajustó la altura al suelo real
  let walking = false;        // dedo pulsado → caminar hacia donde se mira
  let hitTestSource = null;
  let saved = null;           // estado que se restaura al salir de AR
  const tmpDir = new THREE.Vector3();
  const tmpPos = new THREE.Vector3();
  const tmpUser = new THREE.Vector3();

  // Los toques sobre los botones no deben hacer caminar al personaje
  [arBtn, exploreBtn].forEach(el => el.addEventListener('beforexrselect', e => e.preventDefault()));

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

  // Mete el parque en un grupo que se mueve/rota (así se "camina" desplazando el mundo, no la cámara)
  function enterARLayout() {
    saved = {
      camPos: camera.position.clone(),
      camQuat: camera.quaternion.clone(),
      hint: hintEl.querySelector('.hint-text')?.textContent,
      hidden: [],
    };

    arRoot = new THREE.Group();
    arRoot.name = 'ar-root';
    [...scene.children].forEach(o => arRoot.add(o));

    const suns = [];
    arRoot.traverse(o => {
      if (!AR_FULL_WORLD && o.userData.hideInAR) { saved.hidden.push(o); o.visible = false; }
      if (o.isDirectionalLight) suns.push(o);
    });
    suns.forEach(l => arRoot.add(l.target));   // el sol y su objetivo se mueven con el parque

    scene.add(arRoot);
    arAutoPlaced = false;
    floorLocked = false;
    walking = false;
    controls.enabled = false;

    if (!AR_FULL_WORLD) {
      scene.background = null;
      scene.fog = null;
      renderer.setClearColor(0x000000, 0);
    }

    const hintText = hintEl.querySelector('.hint-text');
    if (hintText) hintText.textContent = 'Mantén el dedo pulsado para caminar';
  }

  function exitARLayout() {
    if (!arRoot) return;
    [...arRoot.children].forEach(o => scene.add(o));   // devuelve el parque (y el target del sol) a la escena
    scene.remove(arRoot);
    arRoot = null;

    saved.hidden.forEach(o => { o.visible = true; });
    camera.position.copy(saved.camPos);
    camera.quaternion.copy(saved.camQuat);
    camera.updateProjectionMatrix();
    controls.enabled = controlsActive;
    const hintText = hintEl.querySelector('.hint-text');
    if (hintText && saved.hint !== undefined) hintText.textContent = saved.hint;
    saved = null;
    walking = false;
  }

  async function setupHitTest(session) {
    try {
      const viewerSpace = await session.requestReferenceSpace('viewer');
      const src = await session.requestHitTestSource({ space: viewerSpace });
      if (session !== arSession) { src.cancel(); return; }
      hitTestSource = src;
    } catch (e) {
      hitTestSource = null;   // sin hit-test se usa AR_EYE_HEIGHT como altura de los ojos
    }
  }

  async function startAR() {
    if (arSession) { arSession.end(); return; }
    if (!('xr' in navigator)) {
      alert('WebXR no disponible.\nUsa Chrome en Android con HTTPS.'); return;
    }
    arBtn.innerHTML = '⏳ Iniciando AR…'; arBtn.disabled = true;
    let session = null;
    try {
      session = await navigator.xr.requestSession('immersive-ar', {
        requiredFeatures: ['local'],
        optionalFeatures: ['dom-overlay', 'hit-test'],
        domOverlay: { root: document.getElementById('hero-visual') }
      });
      renderer.xr.setReferenceSpaceType('local');
      await renderer.xr.setSession(session);
      arSession = session;
      session.addEventListener('end', exitAR);
      session.addEventListener('selectstart', () => { walking = true; });
      session.addEventListener('selectend', () => { walking = false; });
      enterARLayout();
      setupHitTest(session);
      arBtn.innerHTML = '✕ Salir AR'; arBtn.disabled = false;
      arBtn.style.background = 'rgba(204,102,153,0.9)';
    } catch (e) {
      if (session) { try { session.end(); } catch (_) { /* ya cerrada */ } }
      arSession = null;
      let msg = '⚠ Error AR';
      if (e.name === 'NotSupportedError') msg = '⚠ AR no soportado aquí';
      if (e.name === 'SecurityError') msg = '⚠ Requiere HTTPS + cámara';
      arBtn.innerHTML = msg; arBtn.disabled = false;
      setTimeout(() => { arBtn.innerHTML = '📱 Ver en AR'; }, 3500);
    }
  }

  function exitAR() {
    exitARLayout();
    if (hitTestSource) { try { hitTestSource.cancel(); } catch (_) { /* sesión ya cerrada */ } }
    hitTestSource = null;
    arSession = null;
    scene.background = new THREE.Color(BG_COLOR);
    scene.fog = new THREE.FogExp2(BG_COLOR, FOG_DENSITY);
    renderer.setClearColor(BG_COLOR, 1);
    arBtn.innerHTML = '📱 Ver en AR'; arBtn.style.background = ''; arBtn.disabled = false;
  }

  arBtn.addEventListener('click', startAR);
  initAR();

  function updateAR(dt) {
    if (!arRoot) return;
    const xrCam = renderer.xr.getCamera();

    // Aparición: el usuario queda en AR_SPAWN y su mirada actual apunta hacia el centro del parque
    if (!arAutoPlaced) {
      arAutoPlaced = true;
      tmpDir.set(0, 0, -1).applyQuaternion(xrCam.quaternion);
      tmpDir.y = 0;
      if (tmpDir.lengthSq() < 1e-4) tmpDir.set(0, 0, -1);
      tmpDir.normalize();
      arRoot.rotation.y = Math.atan2(-tmpDir.x, -tmpDir.z);   // el -z del parque pasa a ser hacia donde mira
      tmpPos.copy(AR_SPAWN).applyAxisAngle(Y_AXIS, arRoot.rotation.y);
      arRoot.position.set(
        xrCam.position.x - tmpPos.x,
        xrCam.position.y - AR_EYE_HEIGHT,
        xrCam.position.z - tmpPos.z
      );
    }

    // Suelo real: la primera superficie horizontal razonable bajo la vista fija la altura del césped
    const frame = renderer.xr.getFrame && renderer.xr.getFrame();
    if (!floorLocked && hitTestSource && frame) {
      const hits = frame.getHitTestResults(hitTestSource);
      const pose = hits.length ? hits[0].getPose(renderer.xr.getReferenceSpace()) : null;
      if (pose) {
        const drop = xrCam.position.y - pose.transform.position.y;
        const horizontal = pose.transform.matrix[5] > 0.9;   // eje Y del hit = normal de la superficie
        if (horizontal && drop > 0.9 && drop < 2.1) {
          arRoot.position.y = pose.transform.position.y;
          floorLocked = true;
        }
      }
    }

    // Caminar: se desplaza el mundo en sentido contrario a la mirada, sin salir de la cerca
    if (walking) {
      tmpDir.set(0, 0, -1).applyQuaternion(xrCam.quaternion);
      tmpDir.y = 0;
      tmpDir.normalize();
      tmpPos.copy(arRoot.position).addScaledVector(tmpDir, -AR_WALK_SPEED * dt);
      tmpUser.set(xrCam.position.x - tmpPos.x, 0, xrCam.position.z - tmpPos.z)
        .applyAxisAngle(Y_AXIS, -arRoot.rotation.y);        // posición del usuario en coordenadas del parque
      if (tmpUser.length() <= AR_WALK_LIMIT) {
        arRoot.position.x = tmpPos.x;
        arRoot.position.z = tmpPos.z;
      }
    }
  }

  // ── UPDATE ───────────────────────────────────────────────────
  let autoAngle = 0;
  let lastT = 0;

  function update(t) {
    const dt = Math.min(0.1, Math.max(0, t - lastT));
    lastT = t;

    if (renderer.xr.isPresenting) { updateAR(dt); return; }   // en AR la cámara la mueve el dispositivo
    if (!controlsActive) {
      autoAngle += 0.0011;
      camera.position.x = Math.sin(autoAngle) * 16;
      camera.position.z = Math.cos(autoAngle) * 16;
      camera.position.y = 5 + Math.sin(t * 0.17) * 0.8;
      camera.lookAt(MAIN_CX, MAIN_H * 0.6, MAIN_CZ);
    } else {
      controls.update();
    }
  }

  function resize(w, h) {
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  return { camera, update, resize };
}