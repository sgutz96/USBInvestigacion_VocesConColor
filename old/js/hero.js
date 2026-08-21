 import * as THREE from 'three';
    import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

    // ── Detect mobile ──────────────────────────────────────────────
    const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)
      || (navigator.maxTouchPoints > 1 && /Macintosh/.test(navigator.userAgent))
      || window.innerWidth < 900;

    // ── DOM refs ───────────────────────────────────────────────────
    const canvas = document.getElementById('three-canvas');
    const heroEl = document.querySelector('.hero');
    const exploreBtn = document.getElementById('explore-btn');
    const arBtn = document.getElementById('ar-btn');
    const hintEl = document.getElementById('banner-hint');

    // ── SCENE ──────────────────────────────────────────────────────
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x04071a);
    scene.fog = new THREE.FogExp2(0x04071a, 0.018);

    // ── CAMERA ─────────────────────────────────────────────────────
    const W = heroEl.clientWidth, H = heroEl.clientHeight;
    const camera = new THREE.PerspectiveCamera(52, W / H, 0.1, 300);
    camera.position.set(0, 5, 16);
    camera.lookAt(0, 5, 0);

    // ── RENDERER ───────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.xr.enabled = true;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;

    // ── BRAND PALETTE ──────────────────────────────────────────────
    const C = {
      orange: 0xd7822c, blue: 0x55b0d2,
      pink: 0xcc6699, green: 0xa3c037,
      purple: 0x7b6baa, yellow: 0xf5c842,
    };

    // ── MATERIAL HELPER ────────────────────────────────────────────
    const std = (color, rough = 0.85, metal = 0.05) =>
      new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal });

    // ── LIGHTS ─────────────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0x1a1040, 5));

    const moon = new THREE.DirectionalLight(0xb8ccff, 3.5);
    moon.position.set(-8, 18, 12);
    moon.castShadow = true;
    moon.shadow.mapSize.set(2048, 2048);
    moon.shadow.camera.near = 1; moon.shadow.camera.far = 70;
    moon.shadow.camera.left = moon.shadow.camera.bottom = -18;
    moon.shadow.camera.right = moon.shadow.camera.top = 18;
    moon.shadow.bias = -0.0005;
    scene.add(moon);

    // Warm campfire glow from front-right
    const warmLight = new THREE.PointLight(C.orange, 6, 30);
    warmLight.position.set(7, 2, 9);
    scene.add(warmLight);

    // Cool blue from left
    const coolLight = new THREE.PointLight(C.blue, 4, 28);
    coolLight.position.set(-8, 5, 6);
    scene.add(coolLight);

    // Purple rim behind mountain
    const rimLight = new THREE.PointLight(C.purple, 5, 22);
    rimLight.position.set(0, 12, -10);
    scene.add(rimLight);

    // ── GROUND ─────────────────────────────────────────────────────
    const gnd = new THREE.Mesh(
      new THREE.PlaneGeometry(100, 100),
      std(0x0b1a08, 0.96)
    );
    gnd.rotation.x = -Math.PI / 2;
    gnd.receiveShadow = true;
    scene.add(gnd);

    // Lighter grass strip in front
    const grass = new THREE.Mesh(new THREE.PlaneGeometry(40, 10), std(0x163510, 0.92));
    grass.rotation.x = -Math.PI / 2;
    grass.position.set(0, 0.01, 7);
    grass.receiveShadow = true;
    scene.add(grass);

    // ── SKY SPHERE ─────────────────────────────────────────────────
    const skyGeo = new THREE.SphereGeometry(150, 32, 16);
    const skyCols = new Float32Array(skyGeo.attributes.position.count * 3);
    const cTop = new THREE.Color(0x020510), cHorz = new THREE.Color(0x0a1535);
    for (let i = 0; i < skyGeo.attributes.position.count; i++) {
      const y = skyGeo.attributes.position.getY(i);
      const t = Math.max(0, Math.min(1, (y + 150) / 280));
      const c = cTop.clone().lerp(cHorz, 1 - t);
      skyCols[i * 3] = c.r; skyCols[i * 3 + 1] = c.g; skyCols[i * 3 + 2] = c.b;
    }
    skyGeo.setAttribute('color', new THREE.BufferAttribute(skyCols, 3));
    scene.add(new THREE.Mesh(skyGeo,
      new THREE.MeshBasicMaterial({ side: THREE.BackSide, vertexColors: true })));

    // ── STARS ──────────────────────────────────────────────────────
    const N_STARS = 1400;
    const sPts = new Float32Array(N_STARS * 3);
    const sCols = new Float32Array(N_STARS * 3);
    const starPal = [
      new THREE.Color(0xffffff), new THREE.Color(0xaaccff),
      new THREE.Color(0xffeeaa), new THREE.Color(C.purple),
    ];
    for (let i = 0; i < N_STARS; i++) {
      const th = Math.random() * Math.PI * 2;
      const ph = Math.random() * Math.PI * 0.5; // upper hemisphere only
      const r = 120 + Math.random() * 20;
      sPts[i * 3] = r * Math.sin(ph) * Math.cos(th);
      sPts[i * 3 + 1] = r * Math.cos(ph) + 8;
      sPts[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th);
      const c = starPal[i % starPal.length];
      sCols[i * 3] = c.r; sCols[i * 3 + 1] = c.g; sCols[i * 3 + 2] = c.b;
    }
    const sGeo = new THREE.BufferGeometry();
    sGeo.setAttribute('position', new THREE.BufferAttribute(sPts, 3));
    sGeo.setAttribute('color', new THREE.BufferAttribute(sCols, 3));
    scene.add(new THREE.Points(sGeo,
      new THREE.PointsMaterial({ size: 0.22, vertexColors: true, transparent: true, opacity: 0.95 })));

    // ── MOUNTAINS ──────────────────────────────────────────────────
    function peak(radius, height, px, pz, color, segs = 8) {
      const m = new THREE.Mesh(
        new THREE.ConeGeometry(radius, height, segs),
        std(color, 0.92)
      );
      m.position.set(px, height / 2, pz);
      m.rotation.y = Math.random() * Math.PI;
      m.castShadow = m.receiveShadow = true;
      scene.add(m);
      return m;
    }

    // Distant bg range
    peak(11, 14, -18, -22, 0x0a1808);
    peak(10, 13, 18, -22, 0x091608);
    peak(9, 12, 2, -24, 0x081508);

    // Mid range
    peak(6.5, 10, -10, -14, 0x122210);
    peak(6, 9, 11, -14, 0x112010);
    peak(5.5, 8, 1, -16, 0x142812);

    // ── MAIN MOUNTAIN ──────────────────────────────────────────────
    const MAIN_H = 12;
    const MAIN_CX = 0, MAIN_CZ = -7;
    peak(5.5, MAIN_H, MAIN_CX, MAIN_CZ, 0x1e4a1c, 9);

    // Snow cap — sits exactly on the tip
    const snowCap = new THREE.Mesh(
      new THREE.ConeGeometry(1.6, 2.2, 9),
      std(0xddeedd, 0.88)
    );
    snowCap.position.set(MAIN_CX, MAIN_H - 0.5, MAIN_CZ);
    snowCap.castShadow = true;
    scene.add(snowCap);

    // Side ridges
    peak(3.5, 7, -5, -5.5, 0x183818, 7);
    peak(3.2, 6.5, 5, -5.5, 0x163316, 7);

    // ── CHURCH on mountain peak ────────────────────────────────────
    const CHURCH_Y = MAIN_H + 0.15; // resting right on the snow cap
    const cG = new THREE.Group();

    // Stone plinth
    const plinth = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.3, 1.6), std(0x8a7055, 0.94));
    plinth.position.y = 0.15;
    cG.add(plinth);
    // Main body
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.55, 2.1, 1.15), std(0xa08050, 0.88));
    body.position.y = 1.35;
    body.castShadow = body.receiveShadow = true;
    cG.add(body);
    // Door
    const door = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.65, 0.12), std(0x3d2410, 0.95));
    door.position.set(0, 0.625, 0.59);
    cG.add(door);
    // Glowing window
    const winMat = new THREE.MeshStandardMaterial({
      color: 0xffe090, emissive: 0xffb820, emissiveIntensity: 2.0, roughness: 0.2
    });
    const win = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.34, 0.1), winMat);
    win.position.set(0, 1.7, 0.59);
    cG.add(win);
    // Bell tower
    const tower = new THREE.Mesh(new THREE.BoxGeometry(0.72, 1.2, 0.72), std(0x907040, 0.86));
    tower.position.y = 2.85;
    tower.castShadow = true;
    cG.add(tower);
    // Pyramid roof
    const roofMesh = new THREE.Mesh(new THREE.ConeGeometry(0.6, 1.0, 4), std(0x6b4820, 0.84));
    roofMesh.position.y = 3.9;
    roofMesh.rotation.y = Math.PI / 4;
    roofMesh.castShadow = true;
    cG.add(roofMesh);
    // Cross
    const cMat = std(0xe8d8a0, 0.65);
    const cV = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.52, 0.07), cMat);
    const cH = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.07, 0.07), cMat);
    cV.position.y = 4.45; cH.position.y = 4.58;
    [cV, cH].forEach(m => { m.castShadow = true; cG.add(m); });
    // Window light
    const churchLight = new THREE.PointLight(0xffcc44, 5, 7);
    churchLight.position.set(0, 1.6, 1.5);
    cG.add(churchLight);

    cG.position.set(MAIN_CX, CHURCH_Y, MAIN_CZ);
    scene.add(cG);

    // ── TREES ──────────────────────────────────────────────────────
    function tree(px, pz, h = 1.8, baseY = 0) {
      const g = new THREE.Group();
      // trunk
      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.07, 0.13, h * 0.45, 6),
        std(0x4a2808, 0.95)
      );
      trunk.position.y = h * 0.225;
      trunk.castShadow = true;
      g.add(trunk);
      // 3 foliage tiers
      [[0x237023, 1.0], [0x2e8c2e, 0.72], [0x39a839, 0.48]].forEach(([col, s], i) => {
        const cone = new THREE.Mesh(
          new THREE.ConeGeometry(s * h * 0.44, s * h * 0.58, 7),
          std(col, 0.88)
        );
        cone.position.y = h * (0.42 + i * 0.29 + s * 0.24);
        cone.castShadow = true;
        g.add(cone);
      });
      g.position.set(px, baseY, pz);
      scene.add(g);
    }

    // Foreground trees
    tree(-5.0, 5.5, 2.4); tree(5.2, 5.0, 2.6);
    tree(-2.8, 6.2, 1.7); tree(3.0, 6.0, 1.9);
    tree(-7.5, 3.5, 1.5); tree(7.8, 3.0, 1.6);
    tree(-9.0, 1.0, 1.3); tree(9.2, 0.5, 1.4);
    // Mid-slope trees
    tree(-2.5, -2.0, 1.3, 2.0);
    tree(2.2, -2.5, 1.2, 2.4);
    tree(-4.0, -3.5, 1.0, 3.0);
    tree(3.8, -3.0, 1.0, 2.8);

    // ── ORBITING SPHERES (brand colours orbit the church) ──────────
    const ORBIT_CENTER = new THREE.Vector3(MAIN_CX, CHURCH_Y + 2.5, MAIN_CZ);
    const orbitData = [
      { color: C.orange, r: 3.8, speed: 0.38, phase: 0, size: 0.30, tx: 0.4, tz: 0.2 },
      { color: C.blue, r: 4.5, speed: 0.25, phase: Math.PI * 0.7, size: 0.24, tx: -0.3, tz: 0.5 },
      { color: C.pink, r: 3.2, speed: 0.52, phase: Math.PI, size: 0.22, tx: 0.6, tz: -0.2 },
      { color: C.green, r: 5.0, speed: 0.20, phase: Math.PI * 1.4, size: 0.32, tx: -0.2, tz: 0.4 },
      { color: C.purple, r: 3.5, speed: 0.44, phase: Math.PI * 0.5, size: 0.20, tx: 0.5, tz: -0.4 },
      { color: C.yellow, r: 4.2, speed: 0.31, phase: Math.PI * 1.8, size: 0.26, tx: -0.45, tz: 0.3 },
    ];
    const orbitPivots = orbitData.map(od => {
      const pivot = new THREE.Object3D();
      pivot.position.copy(ORBIT_CENTER);
      pivot.rotation.x = od.tx;
      pivot.rotation.z = od.tz;
      scene.add(pivot);
      const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(od.size, 22, 16),
        new THREE.MeshStandardMaterial({
          color: od.color, roughness: 0.22, metalness: 0.6,
          emissive: od.color, emissiveIntensity: 0.4
        })
      );
      sphere.position.set(od.r, 0, 0);
      sphere.castShadow = true;
      const glow = new THREE.PointLight(od.color, 3, 4);
      glow.position.copy(sphere.position);
      pivot.add(glow, sphere);
      return { pivot, phase: od.phase, speed: od.speed };
    });

    // ── DUST PARTICLES ─────────────────────────────────────────────
    const N_DUST = 400;
    const dPos = new Float32Array(N_DUST * 3);
    const dVel = new Float32Array(N_DUST * 3);
    for (let i = 0; i < N_DUST; i++) {
      dPos[i * 3] = (Math.random() - 0.5) * 20;
      dPos[i * 3 + 1] = Math.random() * 14;
      dPos[i * 3 + 2] = (Math.random() - 0.5) * 16 - 4;
      dVel[i * 3] = (Math.random() - 0.5) * 0.004;
      dVel[i * 3 + 1] = Math.random() * 0.006 + 0.001;
      dVel[i * 3 + 2] = (Math.random() - 0.5) * 0.003;
    }
    const dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dPos, 3));
    const dust = new THREE.Points(dustGeo,
      new THREE.PointsMaterial({ size: 0.065, color: C.yellow, transparent: true, opacity: 0.55 }));
    scene.add(dust);

    // ── ORBIT CONTROLS ─────────────────────────────────────────────
    let controlsActive = false;
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;
    controls.minDistance = 5;
    controls.maxDistance = 25;
    controls.maxPolarAngle = Math.PI / 2.05;
    controls.target.set(MAIN_CX, MAIN_H * 0.5, MAIN_CZ);
    controls.enabled = false;

    // ── AR SETUP ───────────────────────────────────────────────────
    let arSession = null;

    async function initAR() {
      if (!isMobile) return;
      hintEl.querySelector('.hint-icon').textContent = '👆';
      hintEl.querySelector('.hint-text').textContent = 'Toca para ver en AR';
      if (!('xr' in navigator)) return;
      try {
        const ok = await navigator.xr.isSessionSupported('immersive-ar');
        if (!ok) { arBtn.innerHTML = '📱 AR no soportado'; arBtn.style.opacity = '0.6'; }
      } catch (e) { /* may throw before user gesture, keep button active */ }
    }
    initAR();

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
      scene.background = new THREE.Color(0x04071a);
      scene.fog = new THREE.FogExp2(0x04071a, 0.018);
      renderer.setClearColor(0x04071a, 1);
      arBtn.innerHTML = '📱 Ver en AR'; arBtn.style.background = ''; arBtn.disabled = false;
    }

    arBtn.addEventListener('click', startAR);

    // ── EXPLORE BUTTON ─────────────────────────────────────────────
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

    // ── RESIZE ─────────────────────────────────────────────────────
    window.addEventListener('resize', () => {
      const w = heroEl.clientWidth, h = heroEl.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });

    // ── ANIMATION LOOP ─────────────────────────────────────────────
    let autoAngle = 0;
    const clock = new THREE.Clock();

    renderer.setAnimationLoop(() => {
      const t = clock.getElapsedTime();

      // Orbit spheres
      orbitPivots.forEach(({ pivot, phase, speed }) => {
        pivot.rotation.y = t * speed + phase;
      });

      // Dust drift + wrap
      const dp = dustGeo.attributes.position.array;
      for (let i = 0; i < N_DUST; i++) {
        dp[i * 3] += dVel[i * 3];
        dp[i * 3 + 1] += dVel[i * 3 + 1];
        dp[i * 3 + 2] += dVel[i * 3 + 2];
        if (dp[i * 3 + 1] > 16) {
          dp[i * 3] = (Math.random() - 0.5) * 20;
          dp[i * 3 + 1] = 0;
          dp[i * 3 + 2] = (Math.random() - 0.5) * 16 - 4;
        }
      }
      dustGeo.attributes.position.needsUpdate = true;

      // Church window pulse
      win.material.emissiveIntensity = 1.6 + Math.sin(t * 2.1) * 0.6;
      churchLight.intensity = 4.0 + Math.sin(t * 2.1) * 1.2;

      // Lights drift
      warmLight.position.x = 7 + Math.sin(t * 0.33) * 2.5;
      warmLight.position.z = 9 + Math.cos(t * 0.27) * 2.0;
      coolLight.position.x = -8 + Math.cos(t * 0.28) * 2.5;

      // Auto-orbit camera
      if (!controlsActive && !renderer.xr.isPresenting) {
        autoAngle += 0.0011;
        camera.position.x = Math.sin(autoAngle) * 16;
        camera.position.z = Math.cos(autoAngle) * 16;
        camera.position.y = 5 + Math.sin(t * 0.17) * 0.8;
        camera.lookAt(MAIN_CX, MAIN_H * 0.6, MAIN_CZ);
      }

      if (controlsActive) controls.update();
      renderer.render(scene, camera);
    });
