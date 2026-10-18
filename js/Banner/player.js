import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { BG_COLOR, FOG_DENSITY, MAIN_H, MAIN_CX, MAIN_CZ } from './environment.js';

const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)
  || (navigator.maxTouchPoints > 1 && /Macintosh/.test(navigator.userAgent))
  || window.innerWidth < 900;

// ── AR: cómo se coloca el parque ───────────────────────────────
// El parque mide ~31 unidades de diámetro. En AR se reduce y se pone frente al usuario, sobre el suelo.
const AR_SCALE = 0.04;       // 1 unidad del parque = 4 cm reales  → ~1,2 m de diámetro
const AR_DISTANCE = 2.0;     // metros frente al usuario en la colocación inicial
const AR_EYE_HEIGHT = 1.3;   // altura supuesta de los ojos sobre el suelo (hasta detectar el suelo real)

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
  let arRoot = null;          // grupo que contiene todo el parque mientras dura la sesión AR
  let arAutoPlaced = false;   // ya se hizo la colocación inicial frente al usuario
  let hitTestSource = null;
  let reticle = null;
  let saved = null;           // estado que se restaura al salir de AR
  const tmpDir = new THREE.Vector3();

  // Los toques sobre los botones no deben colocar el parque
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

  function makeReticle() {
    const geo = new THREE.RingGeometry(0.08, 0.11, 32).rotateX(-Math.PI / 2);
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0xffffff, fog: false, toneMapped: false }));
    m.matrixAutoUpdate = false;   // la matriz viene directa del hit-test
    m.visible = false;
    return m;
  }

  // Mete todo el parque en un grupo reducido, quita cielo/sol/nubes/suelo infinito y lo coloca frente al usuario
  function enterARLayout() {
    saved = {
      camPos: camera.position.clone(),
      camQuat: camera.quaternion.clone(),
      near: camera.near,
      far: camera.far,
      hidden: [],
      lights: [],
    };

    arRoot = new THREE.Group();
    arRoot.name = 'ar-root';
    [...scene.children].forEach(o => arRoot.add(o));

    const sunLights = [];
    arRoot.traverse(o => {
      if (o.userData.hideInAR) { saved.hidden.push(o); o.visible = false; }
      if (o.isDirectionalLight && o.castShadow) sunLights.push(o);
    });

    // La luz del sol viaja con el parque: su "target" y el volumen de sombras se reducen igual
    sunLights.forEach(light => {
      const sc = light.shadow.camera;
      saved.lights.push({
        light, left: sc.left, right: sc.right, top: sc.top, bottom: sc.bottom,
        near: sc.near, far: sc.far, normalBias: light.shadow.normalBias,
      });
      sc.left *= AR_SCALE; sc.right *= AR_SCALE; sc.top *= AR_SCALE; sc.bottom *= AR_SCALE;
      sc.near *= AR_SCALE; sc.far *= AR_SCALE;
      sc.updateProjectionMatrix();
      light.shadow.normalBias *= AR_SCALE;
      arRoot.add(light.target);
    });

    arRoot.scale.setScalar(AR_SCALE);
    arRoot.position.set(0, -AR_EYE_HEIGHT, -AR_DISTANCE);   // se corrige en el primer frame con la pose real
    scene.add(arRoot);
    arAutoPlaced = false;

    reticle = reticle || makeReticle();
    reticle.visible = false;
    scene.add(reticle);

    // Objetos pequeños y cercanos: plano cercano más corto
    camera.near = 0.02;
    camera.far = 100;
    camera.updateProjectionMatrix();

    controls.enabled = false;
    scene.background = null;
    scene.fog = null;
    renderer.setClearColor(0x000000, 0);
  }

  function exitARLayout() {
    if (!arRoot) return;
    [...arRoot.children].forEach(o => scene.add(o));   // devuelve el parque (y los targets de luz) a la escena
    scene.remove(arRoot);
    arRoot = null;
    if (reticle) scene.remove(reticle);

    saved.hidden.forEach(o => { o.visible = true; });
    saved.lights.forEach(s => {
      const sc = s.light.shadow.camera;
      sc.left = s.left; sc.right = s.right; sc.top = s.top; sc.bottom = s.bottom;
      sc.near = s.near; sc.far = s.far;
      sc.updateProjectionMatrix();
      s.light.shadow.normalBias = s.normalBias;
    });

    camera.near = saved.near;
    camera.far = saved.far;
    camera.position.copy(saved.camPos);
    camera.quaternion.copy(saved.camQuat);
    camera.updateProjectionMatrix();
    controls.enabled = controlsActive;
    saved = null;
  }

  async function setupHitTest(session) {
    try {
      const viewerSpace = await session.requestReferenceSpace('viewer');
      const src = await session.requestHitTestSource({ space: viewerSpace });
      if (session !== arSession) { src.cancel(); return; }
      hitTestSource = src;
    } catch (e) {
      hitTestSource = null;   // sin hit-test se queda la colocación inicial frente al usuario
    }
  }

  // Un toque coloca el parque donde apunta el aro (suelo detectado)
  function onARSelect() {
    if (!arRoot || !reticle || !reticle.visible) return;
    arRoot.position.setFromMatrixPosition(reticle.matrix);
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
      session.addEventListener('select', onARSelect);
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

  function updateAR() {
    if (!arRoot) return;
    const xrCam = renderer.xr.getCamera();

    // Colocación inicial: frente a donde mira el usuario, a una altura de suelo supuesta
    if (!arAutoPlaced) {
      arAutoPlaced = true;
      tmpDir.set(0, 0, -1).applyQuaternion(xrCam.quaternion);
      tmpDir.y = 0;
      if (tmpDir.lengthSq() < 1e-4) tmpDir.set(0, 0, -1);
      tmpDir.normalize();
      arRoot.position.set(
        xrCam.position.x + tmpDir.x * AR_DISTANCE,
        xrCam.position.y - AR_EYE_HEIGHT,
        xrCam.position.z + tmpDir.z * AR_DISTANCE
      );
    }

    // Aro sobre la superficie que detecta el hit-test
    const frame = renderer.xr.getFrame && renderer.xr.getFrame();
    if (hitTestSource && frame && reticle) {
      const hits = frame.getHitTestResults(hitTestSource);
      const pose = hits.length ? hits[0].getPose(renderer.xr.getReferenceSpace()) : null;
      if (pose) {
        reticle.visible = true;
        reticle.matrix.fromArray(pose.transform.matrix);
      } else {
        reticle.visible = false;
      }
    }
  }

  // ── UPDATE ───────────────────────────────────────────────────
  let autoAngle = 0;

  function update(t) {
    if (renderer.xr.isPresenting) { updateAR(); return; }   // en AR la cámara la mueve el dispositivo
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