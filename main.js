import * as THREE from 'https://unpkg.com/three@0.164.1/build/three.module.js';

const canvas = document.getElementById('gameCanvas');
const intro = document.getElementById('intro');
const startBtn = document.getElementById('startBtn');
const hud = document.getElementById('hud');
const settings = document.getElementById('settings');
const settingsToggle = document.getElementById('settingsToggle');
const speedEl = document.getElementById('speed');
const fpsEl = document.getElementById('fps');

const translations = {
  it: {
    start: 'Avvia esperienza', settings: 'Impostazioni', lang: 'Lingua', fps: 'Limite FPS',
    quality: 'Qualità luci', shadow: 'Ombre', traffic: 'Densità traffico',
    controls: 'WASD / Frecce per guidare, mouse per visuale.', subtitle: 'Neon City Protocol',
    speed: 'Velocità'
  },
  en: {
    start: 'Start experience', settings: 'Settings', lang: 'Language', fps: 'FPS Limit',
    quality: 'Lighting quality', shadow: 'Shadows', traffic: 'Traffic density',
    controls: 'WASD / Arrows to drive, mouse for camera.', subtitle: 'Neon City Protocol',
    speed: 'Speed'
  }
};

const ui = {
  language: document.getElementById('language'),
  fpsLimit: document.getElementById('fpsLimit'),
  fpsLimitValue: document.getElementById('fpsLimitValue'),
  quality: document.getElementById('quality'),
  shadows: document.getElementById('shadows'),
  traffic: document.getElementById('traffic'),
  trafficValue: document.getElementById('trafficValue')
};

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x081522, 0.013);

const camera = new THREE.PerspectiveCamera(68, window.innerWidth / window.innerHeight, 0.1, 900);
camera.position.set(0, 5, 16);

const hemi = new THREE.HemisphereLight(0x77aaff, 0x040609, 1.2);
scene.add(hemi);

const sun = new THREE.DirectionalLight(0xffffff, 1.1);
sun.position.set(45, 60, -10);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
scene.add(sun);

function makeAsphaltTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#14171c';
  ctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 3200; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const r = Math.random() * 2;
    const shade = Math.floor(35 + Math.random() * 40);
    ctx.fillStyle = `rgb(${shade},${shade},${shade})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(28, 28);
  return t;
}

const road = new THREE.Mesh(
  new THREE.PlaneGeometry(240, 240),
  new THREE.MeshStandardMaterial({ map: makeAsphaltTexture(), roughness: 1, metalness: 0.05 })
);
road.rotation.x = -Math.PI / 2;
road.receiveShadow = true;
scene.add(road);

const grid = new THREE.GridHelper(240, 60, 0x2f68aa, 0x1b2c40);
grid.position.y = 0.02;
scene.add(grid);

const buildings = new THREE.Group();
scene.add(buildings);
const rnd = (a, b) => Math.random() * (b - a) + a;

for (let i = 0; i < 360; i++) {
  const w = rnd(2.4, 8);
  const h = rnd(4, 40);
  const d = rnd(2.4, 8);
  const tower = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshStandardMaterial({
      color: new THREE.Color().setHSL(0.58 + Math.random() * 0.08, 0.35, 0.22 + Math.random() * 0.22),
      roughness: 0.65,
      metalness: 0.28,
      emissive: new THREE.Color(0x0f2238),
      emissiveIntensity: rnd(0.2, 0.65)
    })
  );
  const laneSafe = Math.abs(Math.random() * 2 - 1) > 0.15;
  tower.position.set(rnd(-110, 110), h / 2, rnd(-110, 110));
  if (Math.abs(tower.position.x) < 18 && !laneSafe) tower.position.x += 24;
  if (Math.abs(tower.position.z) < 18 && !laneSafe) tower.position.z += 24;
  tower.castShadow = true;
  tower.receiveShadow = true;
  buildings.add(tower);
}

const player = new THREE.Mesh(
  new THREE.BoxGeometry(1.8, 1, 3.2),
  new THREE.MeshStandardMaterial({ color: 0xff3b4e, metalness: 0.85, roughness: 0.22, emissive: 0x33040d })
);
player.position.y = 0.6;
player.castShadow = true;
scene.add(player);

const cars = [];
function rebuildTraffic(n) {
  cars.forEach((car) => scene.remove(car.mesh));
  cars.length = 0;
  for (let i = 0; i < n; i++) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(1.7, 0.9, 3),
      new THREE.MeshStandardMaterial({ color: new THREE.Color().setHSL(Math.random(), 0.75, 0.55), metalness: 0.6, roughness: 0.35 })
    );
    mesh.position.set(rnd(-80, 80), 0.55, rnd(-80, 80));
    mesh.castShadow = true;
    scene.add(mesh);
    cars.push({ mesh, angle: Math.random() * Math.PI * 2, radius: rnd(20, 92), speed: rnd(0.2, 0.9) * (Math.random() > 0.5 ? 1 : -1) });
  }
}
rebuildTraffic(Number(ui.traffic.value));

const keys = {};
window.addEventListener('keydown', (e) => (keys[e.key.toLowerCase()] = true));
window.addEventListener('keyup', (e) => (keys[e.key.toLowerCase()] = false));

settingsToggle.addEventListener('click', () => settings.classList.toggle('hidden'));
ui.traffic.addEventListener('input', () => {
  ui.trafficValue.textContent = ui.traffic.value;
  rebuildTraffic(Number(ui.traffic.value));
});
ui.fpsLimit.addEventListener('input', () => (ui.fpsLimitValue.textContent = ui.fpsLimit.value));
ui.shadows.addEventListener('change', () => (renderer.shadowMap.enabled = ui.shadows.checked));
ui.quality.addEventListener('change', () => {
  const levels = { low: 0.6, medium: 1, ultra: 1.5 };
  sun.intensity = levels[ui.quality.value] ?? 1;
  hemi.intensity = 0.9 + sun.intensity * 0.2;
});
ui.language.addEventListener('change', () => updateLang(ui.language.value));

function updateLang(lang) {
  const t = translations[lang] ?? translations.it;
  startBtn.textContent = t.start;
  document.getElementById('settingsTitle').textContent = t.settings;
  document.getElementById('langLabel').textContent = t.lang;
  document.getElementById('fpsLabel').textContent = t.fps;
  document.getElementById('qualityLabel').textContent = t.quality;
  document.getElementById('shadowLabel').textContent = t.shadow;
  document.getElementById('trafficLabel').textContent = t.traffic;
  document.getElementById('controlsText').textContent = t.controls;
  document.getElementById('introSubtitle').textContent = t.subtitle;
}
updateLang('it');

let active = false;
startBtn.addEventListener('click', () => {
  intro.classList.add('hidden');
  hud.classList.remove('hidden');
  active = true;
});

let yaw = 0;
window.addEventListener('mousemove', (e) => {
  if (!active) return;
  yaw -= e.movementX * 0.0018;
});

const clock = new THREE.Clock();
let fpsAccumulator = 0;
let fpsFrames = 0;
let fpsLimit = Number(ui.fpsLimit.value);
let frameBudget = 1 / fpsLimit;
let frameCarry = 0;

function animate() {
  requestAnimationFrame(animate);

  fpsLimit = Number(ui.fpsLimit.value);
  frameBudget = 1 / fpsLimit;

  const dt = clock.getDelta();
  frameCarry += dt;
  if (frameCarry < frameBudget) return;
  const step = frameCarry;
  frameCarry = 0;

  if (active) {
    const rotSpeed = 1.8;
    if (keys['a'] || keys['arrowleft']) yaw += rotSpeed * step;
    if (keys['d'] || keys['arrowright']) yaw -= rotSpeed * step;

    const dir = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw));
    let velocity = 0;
    if (keys['w'] || keys['arrowup']) velocity = 18;
    if (keys['s'] || keys['arrowdown']) velocity = -8;
    player.position.addScaledVector(dir, velocity * step);
    player.position.x = THREE.MathUtils.clamp(player.position.x, -108, 108);
    player.position.z = THREE.MathUtils.clamp(player.position.z, -108, 108);

    player.rotation.y = yaw;

    camera.position.lerp(new THREE.Vector3(
      player.position.x - Math.sin(yaw) * 12,
      7,
      player.position.z - Math.cos(yaw) * 12
    ), 0.09);
    camera.lookAt(player.position.x, 1.2, player.position.z);

    speedEl.textContent = `${translations[ui.language.value].speed}: ${Math.round(Math.abs(velocity) * 3.6)} km/h`;
  }

  const t = clock.elapsedTime;
  sun.position.x = Math.sin(t * 0.08) * 45;
  sun.position.z = Math.cos(t * 0.08) * 45;

  cars.forEach((car, i) => {
    car.angle += car.speed * step;
    car.mesh.position.x = Math.cos(car.angle + i) * car.radius;
    car.mesh.position.z = Math.sin(car.angle + i) * car.radius;
    car.mesh.rotation.y = -car.angle + Math.PI / 2;
  });

  renderer.render(scene, camera);

  fpsAccumulator += step;
  fpsFrames++;
  if (fpsAccumulator >= 0.4) {
    fpsEl.textContent = `FPS: ${Math.round(fpsFrames / fpsAccumulator)}`;
    fpsAccumulator = 0;
    fpsFrames = 0;
  }
}
animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
