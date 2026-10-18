import * as THREE from 'three';
import { BG_COLOR, FOG_DENSITY, createEnvironment } from './environment.js';
import { createPlayer } from './player.js';

// ── DOM refs ───────────────────────────────────────────────────
const canvas = document.getElementById('three-canvas');
const heroEl = document.querySelector('.hero');
const ui = {
  exploreBtn: document.getElementById('explore-btn'),
  arBtn: document.getElementById('ar-btn'),
  hintEl: document.getElementById('banner-hint'),
};

// ── SCENE ──────────────────────────────────────────────────────
const scene = new THREE.Scene();
scene.background = new THREE.Color(BG_COLOR);
scene.fog = new THREE.FogExp2(BG_COLOR, FOG_DENSITY);

// ── RENDERER ───────────────────────────────────────────────────
const W = heroEl.clientWidth, H = heroEl.clientHeight;
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(W, H);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.xr.enabled = true;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;

// ── MÓDULOS ────────────────────────────────────────────────────
const environment = createEnvironment(scene);
const player = createPlayer({ scene, renderer, width: W, height: H, ui });

// ── RESIZE ─────────────────────────────────────────────────────
window.addEventListener('resize', () => {
  const w = heroEl.clientWidth, h = heroEl.clientHeight;
  player.resize(w, h);
  renderer.setSize(w, h);
});

// ── LOOP ───────────────────────────────────────────────────────
const clock = new THREE.Clock();
renderer.setAnimationLoop(() => {
  const t = clock.getElapsedTime();
  environment.update(t);
  player.update(t);
  renderer.render(scene, player.camera);
});
