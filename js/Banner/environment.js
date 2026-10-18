import * as THREE from 'three';
 
// ── Constantes compartidas ─────────────────────────────────────
export const BG_COLOR = 0xcfeeff;      // color del horizonte (y de la niebla)
export const FOG_DENSITY = 0.009;
export const LOOK_TARGET = { x: 0, y: 1.5, z: 0 };   // hacia donde mira la cámara
 
// Punto focal del juego principal (el carrusel): player.js los usa para la cámara y los controles
export const MAIN_CX = 0;
export const MAIN_CZ = 0;
export const MAIN_H = 4.2;   // altura aproximada del carrusel
 
export const C = {
  orange: 0xd7822c, blue: 0x55b0d2,
  pink: 0xcc6699, green: 0xa3c037,
  purple: 0x7b6baa, yellow: 0xf5c842,
};
 
const PAL = Object.values(C);
const SKINS = [0xf2c9a0, 0xd9a066, 0xa86b3c, 0x7a4a2a];
const HAIRS = [0x2b1a10, 0x5a3820, 0xc08a3e, 0x111111];
 
// ── Utilidades ─────────────────────────────────────────────────
const rand = (a, b) => a + Math.random() * (b - a);
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const at = (o, x, y, z) => (o.position.set(x, y, z), o);
const faceCenter = g => { g.rotation.y = Math.atan2(-g.position.x, -g.position.z); return g; };
 
// Los materiales se comparten por (color, rugosidad, metal): menos memoria y menos cambios de estado en la GPU
const matCache = new Map();
const std = (color, rough = 0.85, metal = 0.05) => {
  const key = `${color}|${rough}|${metal}`;
  let m = matCache.get(key);
  if (!m) {
    m = new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal });
    matCache.set(key, m);
  }
  return m;
};
 
const mesh = (geo, color, rough, metal) => {
  const m = new THREE.Mesh(geo, std(color, rough, metal));
  m.castShadow = true; m.receiveShadow = true;
  return m;
};
const box = (w, h, d, color) => mesh(new THREE.BoxGeometry(w, h, d), color);
const cyl = (rt, rb, h, color, seg = 12) => mesh(new THREE.CylinderGeometry(rt, rb, h, seg), color);
const ball = (r, color, seg = 16) => mesh(new THREE.SphereGeometry(r, seg, Math.max(6, seg >> 1)), color);
const cone = (r, h, color, seg = 12) => mesh(new THREE.ConeGeometry(r, h, seg), color);
 
// Niño sencillo sentado (el origen está a la altura del asiento, mira hacia +z)
function kid(shirt = pick(PAL)) {
  const g = new THREE.Group();
  g.add(at(cyl(0.17, 0.2, 0.5, shirt, 10), 0, 0.28, 0));
  g.add(at(ball(0.17, pick(SKINS), 14), 0, 0.7, 0));
  const hairGeo = new THREE.SphereGeometry(0.18, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2);
  g.add(at(mesh(hairGeo, pick(HAIRS)), 0, 0.72, -0.01));
  [-0.08, 0.08].forEach(x => {
    const leg = cyl(0.055, 0.055, 0.32, 0x3a4a8a, 8);
    leg.rotation.x = Math.PI / 2;
    g.add(at(leg, x, 0.06, 0.17));
  });
  return g;
}
 
export function createEnvironment(scene) {
  const animated = [];   // funciones (t) => void que se llaman cada frame
 
  // ── LUCES ────────────────────────────────────────────────────
  scene.add(new THREE.HemisphereLight(0xcfeeff, 0x6aa84f, 2.2));
 
  const sun = new THREE.DirectionalLight(0xfff0cc, 3.2);
  sun.position.set(12, 22, 10);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.near = 1; sun.shadow.camera.far = 80;
  sun.shadow.camera.left = sun.shadow.camera.bottom = -20;
  sun.shadow.camera.right = sun.shadow.camera.top = 20;
  sun.shadow.bias = -0.0005;
  sun.shadow.normalBias = 0.02;
  scene.add(sun);
 
  // ── CIELO ────────────────────────────────────────────────────
  const skyGeo = new THREE.SphereGeometry(150, 32, 16);
  const skyPos = skyGeo.attributes.position;
  const skyCols = new Float32Array(skyPos.count * 3);
  const cTop = new THREE.Color(0x3d9bff), cHorz = new THREE.Color(BG_COLOR);
  for (let i = 0; i < skyPos.count; i++) {
    const h = Math.max(0, skyPos.getY(i) / 150);
    const c = cHorz.clone().lerp(cTop, Math.pow(h, 0.55));
    skyCols[i * 3] = c.r; skyCols[i * 3 + 1] = c.g; skyCols[i * 3 + 2] = c.b;
  }
  skyGeo.setAttribute('color', new THREE.BufferAttribute(skyCols, 3));
  scene.add(new THREE.Mesh(skyGeo,
    new THREE.MeshBasicMaterial({ side: THREE.BackSide, vertexColors: true, fog: false })));
 
  // Sol (en la misma dirección que la luz)
  const sunDir = sun.position.clone().normalize();
  const sunMesh = new THREE.Mesh(new THREE.SphereGeometry(7, 24, 16),
    new THREE.MeshBasicMaterial({ color: 0xfff3b0, fog: false }));
  sunMesh.position.copy(sunDir).multiplyScalar(120);
  scene.add(sunMesh);
  const halo = new THREE.Mesh(new THREE.SphereGeometry(11, 24, 16),
    new THREE.MeshBasicMaterial({ color: 0xffe27a, transparent: true, opacity: 0.25, fog: false }));
  halo.position.copy(sunMesh.position);
  scene.add(halo);
 
  // Nubes que se desplazan despacio
  const cloudMat = new THREE.MeshStandardMaterial({
    color: 0xffffff, roughness: 1, emissive: 0xffffff, emissiveIntensity: 0.35, fog: false
  });
  for (let i = 0; i < 8; i++) {
    const g = new THREE.Group();
    const n = 4 + Math.floor(Math.random() * 3);
    for (let k = 0; k < n; k++) {
      const b = new THREE.Mesh(new THREE.SphereGeometry(rand(1.6, 3), 12, 8), cloudMat);
      b.position.set(k * 2.2 - n, rand(-0.4, 0.6), rand(-1, 1));
      b.scale.y = 0.7;
      g.add(b);
    }
    const baseX = rand(-90, 90), speed = rand(0.6, 1.4);
    g.position.set(baseX, rand(28, 42), rand(-70, 30));
    scene.add(g);
    animated.push(t => { g.position.x = ((baseX + t * speed + 90) % 180) - 90; });
  }
 
  // ── SUELO Y CAMINOS ──────────────────────────────────────────
  const flat = (geo, color, y) => {
    const m = new THREE.Mesh(geo, std(color, 0.95));
    m.rotation.x = -Math.PI / 2;
    m.position.y = y;
    m.receiveShadow = true;
    scene.add(m);
    return m;
  };
  flat(new THREE.PlaneGeometry(400, 400), 0x5fae3f, 0);
  flat(new THREE.CircleGeometry(16.5, 64), 0x78c850, 0.01);
  flat(new THREE.RingGeometry(6.4, 7.8, 64), 0xe9d6a4, 0.02);
  flat(new THREE.PlaneGeometry(1.8, 31), 0xe9d6a4, 0.02);
  flat(new THREE.PlaneGeometry(31, 1.8), 0xe9d6a4, 0.02);
  flat(new THREE.CircleGeometry(3.2, 40), 0xf0e0b0, 0.03);
 
  // ── CARRUSEL (centro) ────────────────────────────────────────
  const carousel = new THREE.Group();
  scene.add(carousel);
  carousel.add(at(cyl(2.4, 2.4, 0.25, C.purple, 32), 0, 0.12, 0));
  const spin = new THREE.Group();
  carousel.add(spin);
  spin.add(at(cyl(2.2, 2.2, 0.12, C.yellow, 32), 0, 0.45, 0));
  spin.add(at(cyl(0.12, 0.12, 2.8, 0xeeeeee, 10), 0, 1.8, 0));
  spin.add(at(cone(2.7, 1.1, C.orange, 18), 0, 3.45, 0));
  spin.add(at(ball(0.18, C.pink, 12), 0, 4.1, 0));
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const x = Math.cos(a) * 1.6, z = Math.sin(a) * 1.6;
    spin.add(at(cyl(0.04, 0.04, 2.4, PAL[i], 8), x, 1.7, z));
    const seat = at(box(0.45, 0.12, 0.6, PAL[i]), x, 0.95, z);
    seat.rotation.y = -a;
    spin.add(seat);
    if (i === 0 || i === 3) {
      const k = at(kid(), x, 1.01, z);
      k.rotation.y = -a;
      spin.add(k);
    }
  }
  animated.push(t => { spin.rotation.y = t * 0.8; });
 
  // ── TOBOGÁN ──────────────────────────────────────────────────
  const slide = new THREE.Group();
  at(slide, -8, 0, -3);
  slide.rotation.y = Math.atan2(-3, 8);   // el tobogán baja hacia el centro
  scene.add(slide);
  [[-0.55, -0.55], [-0.55, 0.55], [0.55, -0.55], [0.55, 0.55]].forEach(([x, z]) =>
    slide.add(at(cyl(0.06, 0.06, 2.2, C.blue, 8), x, 1.1, z)));
  slide.add(at(box(1.3, 0.12, 1.3, C.green), 0, 2.2, 0));
  slide.add(at(box(0.06, 0.5, 1.3, C.green), -0.62, 2.5, 0));
  slide.add(at(box(1.3, 0.5, 0.06, C.green), 0, 2.5, -0.62));
  slide.add(at(box(1.3, 0.5, 0.06, C.green), 0, 2.5, 0.62));
  // escalera inclinada
  [-0.25, 0.25].forEach(z => {
    const rail = at(box(0.06, 2.31, 0.06, C.orange), -0.975, 1.075, z);
    rail.rotation.z = -0.376;
    slide.add(rail);
  });
  for (let i = 1; i <= 6; i++) {
    const t = i / 7;
    slide.add(at(box(0.06, 0.06, 0.55, C.yellow), -1.4 + 0.85 * t, 2.15 * t, 0));
  }
  const ramp = at(box(3.25, 0.08, 0.7, C.yellow), 1.9, 1.225, 0);
  ramp.rotation.z = -0.644;
  slide.add(ramp);
  [-0.38, 0.38].forEach(z => {
    const wall = at(box(3.25, 0.2, 0.06, C.orange), 1.9, 1.3, z);
    wall.rotation.z = -0.644;
    slide.add(wall);
  });
  const slideKid = kid(C.pink);
  slideKid.rotation.y = Math.PI / 2;
  slide.add(slideKid);
  animated.push(t => {
    const u = (t * 0.18) % 1;
    if (u > 0.85) { slideKid.visible = false; return; }
    slideKid.visible = true;
    const s = u < 0.3 ? 0 : Math.min(1, (u - 0.3) / 0.55);
    const x = 0.1 + s * s * 3.0;
    const y = (x < 0.6 ? 2.2 : 2.2 - (x - 0.6) * 0.75) + 0.06;
    slideKid.position.set(x, y, 0);
  });
 
  // ── COLUMPIOS ────────────────────────────────────────────────
  const swings = new THREE.Group();
  at(swings, 8, 0, -3);
  faceCenter(swings);
  scene.add(swings);
  const topBar = at(cyl(0.08, 0.08, 4.6, C.orange, 10), 0, 3.2, 0);
  topBar.rotation.z = Math.PI / 2;
  swings.add(topBar);
  [-2.1, 2.1].forEach(x => [-1, 1].forEach(s => {
    const leg = at(cyl(0.07, 0.07, 3.384, C.blue, 8), x, 1.6, 0.55 * s);
    leg.rotation.x = -0.331 * s;
    swings.add(leg);
  }));
  [-0.9, 0.9].forEach((x, i) => {
    const pivot = at(new THREE.Group(), x, 3.2, 0);
    [-0.2, 0.2].forEach(z => pivot.add(at(cyl(0.015, 0.015, 2.3, 0x777777, 6), 0, -1.15, z)));
    pivot.add(at(box(0.55, 0.08, 0.3, PAL[i + 2]), 0, -2.3, 0));
    pivot.add(at(kid(PAL[i + 4]), 0, -2.25, 0));
    swings.add(pivot);
    animated.push(t => { pivot.rotation.x = Math.sin(t * 1.7 + i * 1.3) * 0.55; });
  });
 
  // ── SUBE Y BAJA ──────────────────────────────────────────────
  const seesaw = new THREE.Group();
  at(seesaw, -7, 0, 6);
  faceCenter(seesaw);
  scene.add(seesaw);
  seesaw.add(at(cone(0.45, 0.75, C.blue, 4), 0, 0.37, 0));
  const plank = at(new THREE.Group(), 0, 0.75, 0);
  plank.add(box(4, 0.12, 0.4, C.orange));
  [-1.7, 1.7].forEach((x, i) => {
    plank.add(at(box(0.08, 0.3, 0.3, C.purple), x * 1.05, 0.2, 0));
    const k = at(kid(PAL[i + 1]), x, 0.06, 0);
    k.rotation.y = i === 0 ? Math.PI / 2 : -Math.PI / 2;
    plank.add(k);
  });
  seesaw.add(plank);
  animated.push(t => { plank.rotation.z = Math.sin(t * 1.2) * 0.22; });
 
  // ── ARENERO ──────────────────────────────────────────────────
  const sandbox = new THREE.Group();
  at(sandbox, 7, 0, 6);
  scene.add(sandbox);
  [-1.4, 1.4].forEach(v => {
    sandbox.add(at(box(3, 0.3, 0.2, 0xc79a5b), 0, 0.15, v));
    sandbox.add(at(box(0.2, 0.3, 3, 0xc79a5b), v, 0.15, 0));
  });
  sandbox.add(at(box(2.8, 0.2, 2.8, 0xf1d58a), 0, 0.1, 0));
  sandbox.add(at(cyl(0.35, 0.5, 0.4, 0xe6c677, 12), -0.6, 0.3, -0.5));
  sandbox.add(at(cone(0.3, 0.4, C.pink, 12), -0.6, 0.7, -0.5));
  sandbox.add(at(cyl(0.18, 0.14, 0.25, C.orange, 10), 0.8, 0.32, -0.6));
  const sbKid = at(kid(C.green), 0.3, 0.2, 0.4);
  sbKid.rotation.y = -0.6;
  sandbox.add(sbKid);
 
  // ── BANCAS ───────────────────────────────────────────────────
  [[0, -10.5], [10.5, 1.5], [-10.5, 1.5], [0, 11]].forEach(([x, z]) => {
    const b = at(new THREE.Group(), x, 0, z);
    b.add(at(box(1.8, 0.1, 0.5, 0xb5793f), 0, 0.5, 0));
    b.add(at(box(1.8, 0.45, 0.08, 0xb5793f), 0, 0.85, -0.25));
    [-0.75, 0.75].forEach(lx => b.add(at(box(0.1, 0.5, 0.45, C.green), lx, 0.25, 0)));
    faceCenter(b);
    scene.add(b);
  });
 
  // ── ÁRBOLES ──────────────────────────────────────────────────
  function tree(px, pz, h, leaf, leaf2) {
    const g = new THREE.Group();
    g.add(at(cyl(0.15, 0.22, h * 0.45, 0x8a5a2b, 8), 0, h * 0.225, 0));
    g.add(at(ball(h * 0.3, leaf, 14), 0, h * 0.62, 0));
    g.add(at(ball(h * 0.2, leaf2, 12), h * 0.22, h * 0.52, 0.05));
    g.add(at(ball(h * 0.2, leaf2, 12), -h * 0.22, h * 0.55, -0.05));
    g.add(at(ball(h * 0.2, leaf, 12), 0, h * 0.88, 0));
    at(g, px, 0, pz);
    scene.add(g);
  }
  const N_TREES = 16;
  for (let i = 0; i < N_TREES; i++) {
    const a = (i / N_TREES) * Math.PI * 2 + rand(-0.12, 0.12);
    const r = rand(12.2, 13.8), h = rand(3, 4.6);
    const blossom = i % 5 === 2;
    tree(Math.cos(a) * r, Math.sin(a) * r, h,
      blossom ? 0xf4a6c0 : pick([0x3f9e3f, 0x4caf50, 0x2e8b3e]),
      blossom ? 0xf8bfd2 : pick([0x56b856, 0x3c9a4a]));
  }
 
  // ── FLORES ───────────────────────────────────────────────────
  const N_FLOWERS = 160;
  const heads = new THREE.InstancedMesh(new THREE.SphereGeometry(0.13, 8, 6), std(0xffffff, 0.6), N_FLOWERS);
  const stems = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.015, 0.015, 0.2, 5), std(0x3f8a2a), N_FLOWERS);
  const dummy = new THREE.Object3D();
  for (let i = 0; i < N_FLOWERS; i++) {
    const a = Math.random() * Math.PI * 2, r = rand(9.8, 15);
    const x = Math.cos(a) * r, z = Math.sin(a) * r;
    dummy.position.set(x, 0.24, z); dummy.updateMatrix();
    heads.setMatrixAt(i, dummy.matrix);
    heads.setColorAt(i, new THREE.Color(pick([...PAL, 0xffffff])));
    dummy.position.set(x, 0.1, z); dummy.updateMatrix();
    stems.setMatrixAt(i, dummy.matrix);
  }
  heads.frustumCulled = stems.frustumCulled = false;   // las instancias están repartidas lejos del origen
  scene.add(heads, stems);
 
  // ── CERCA ────────────────────────────────────────────────────
  const FENCE_R = 15.5, N_POSTS = 60;
  const posts = new THREE.InstancedMesh(new THREE.BoxGeometry(0.14, 0.9, 0.14), std(0xffffff), N_POSTS);
  posts.castShadow = true;
  for (let i = 0; i < N_POSTS; i++) {
    const a = (i / N_POSTS) * Math.PI * 2;
    dummy.position.set(Math.cos(a) * FENCE_R, 0.45, Math.sin(a) * FENCE_R);
    dummy.rotation.set(0, -a, 0);
    dummy.updateMatrix();
    posts.setMatrixAt(i, dummy.matrix);
    posts.setColorAt(i, new THREE.Color(PAL[i % PAL.length]));
  }
  posts.frustumCulled = false;
  scene.add(posts);
  [0.35, 0.7].forEach(y => {
    const rail = new THREE.Mesh(new THREE.TorusGeometry(FENCE_R, 0.04, 6, 120), std(0xf4ead2));
    rail.rotation.x = Math.PI / 2;
    rail.position.y = y;
    scene.add(rail);
  });
 
  // ── GLOBOS ───────────────────────────────────────────────────
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + 0.5;
    const pivot = at(new THREE.Group(), Math.cos(a) * 4.8, 0.1, Math.sin(a) * 4.8);
    const col = PAL[i];
    pivot.add(at(cyl(0.01, 0.01, 2.6, 0xffffff, 4), 0, 1.3, 0));
    const bal = new THREE.Mesh(new THREE.SphereGeometry(0.38, 18, 14),
      new THREE.MeshStandardMaterial({ color: col, roughness: 0.25, metalness: 0.1, emissive: col, emissiveIntensity: 0.15 }));
    bal.scale.y = 1.15;
    bal.castShadow = true;
    pivot.add(at(bal, 0, 3.0, 0));
    scene.add(pivot);
    animated.push(t => {
      pivot.rotation.z = Math.sin(t * 0.9 + i) * 0.12;
      pivot.rotation.x = Math.cos(t * 0.7 + i * 2) * 0.1;
      bal.position.y = 3.0 + Math.sin(t * 1.3 + i) * 0.06;
    });
  }
 
  // ── MARIPOSAS ────────────────────────────────────────────────
  for (let i = 0; i < 6; i++) {
    const g = new THREE.Group();
    const col = PAL[i];
    const wingMat = new THREE.MeshStandardMaterial({ color: col, side: THREE.DoubleSide, roughness: 0.6, emissive: col, emissiveIntensity: 0.15 });
    const mk = side => {
      const geo = new THREE.PlaneGeometry(0.3, 0.24);
      geo.rotateX(-Math.PI / 2);
      geo.translate(0.15 * side, 0, 0);
      const pivot = new THREE.Group();
      pivot.add(new THREE.Mesh(geo, wingMat));
      g.add(pivot);
      return pivot;
    };
    const wl = mk(-1), wr = mk(1);
    const bodyM = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.22, 6), std(0x333333));
    bodyM.rotation.x = Math.PI / 2;
    g.add(bodyM);
    scene.add(g);
    const R = rand(4, 11), w = rand(0.25, 0.5) * (i % 2 ? 1 : -1), ph = rand(0, 6.28), cy = rand(1.2, 2.6);
    animated.push(t => {
      const a = w * t + ph;
      g.position.set(Math.cos(a) * R, cy + Math.sin(t * 1.5 + ph) * 0.4, Math.sin(a) * R);
      g.rotation.y = Math.atan2(-Math.sin(a) * w, Math.cos(a) * w);
      const f = Math.sin(t * 18 + ph) * 0.9;
      wl.rotation.z = f; wr.rotation.z = -f;
    });
  }
 
  // ── POLEN / PARTÍCULAS BRILLANTES ────────────────────────────
  const N_DUST = 300;
  const dPos = new Float32Array(N_DUST * 3);
  const dVel = new Float32Array(N_DUST * 3);
  const resetDust = (i, y) => {
    const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * 14;
    dPos[i * 3] = Math.cos(a) * r;
    dPos[i * 3 + 1] = y;
    dPos[i * 3 + 2] = Math.sin(a) * r;
  };
  for (let i = 0; i < N_DUST; i++) {
    resetDust(i, Math.random() * 10);
    dVel[i * 3] = (Math.random() - 0.5) * 0.004;
    dVel[i * 3 + 1] = Math.random() * 0.004 + 0.001;
    dVel[i * 3 + 2] = (Math.random() - 0.5) * 0.003;
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dPos, 3));
  scene.add(new THREE.Points(dustGeo,
    new THREE.PointsMaterial({ size: 0.09, color: 0xfffbe0, transparent: true, opacity: 0.8 })));
  animated.push(() => {
    const dp = dustGeo.attributes.position.array;
    for (let i = 0; i < N_DUST; i++) {
      dp[i * 3] += dVel[i * 3];
      dp[i * 3 + 1] += dVel[i * 3 + 1];
      dp[i * 3 + 2] += dVel[i * 3 + 2];
      if (dp[i * 3 + 1] > 10) resetDust(i, 0);
    }
    dustGeo.attributes.position.needsUpdate = true;
  });
 
  // ── UPDATE (llamar cada frame con el tiempo en segundos) ─────
  function update(t) {
    for (const fn of animated) fn(t);
  }
 
  return { update };
}
 