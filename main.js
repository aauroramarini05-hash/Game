import * as THREE from 'https://unpkg.com/three@0.164.1/build/three.module.js';

const $ = (id) => document.getElementById(id);
const ui = {
  intro: $('intro'), startBtn: $('startBtn'), hud: $('hud'), settings: $('settings'), settingsToggle: $('settingsToggle'),
  camBtn: $('camBtn'), speed: $('speed'), fps: $('fps'), score: $('score'),
  language: $('language'), fpsLimit: $('fpsLimit'), fpsLimitValue: $('fpsLimitValue'), quality: $('quality'),
  shadows: $('shadows'), traffic: $('traffic'), trafficValue: $('trafficValue'), pedestrians: $('pedestrians'), pedValue: $('pedValue'),
  mobileHud: $('mobileHud'), mobileControls: $('mobileControls')
};

const texts = {
  it: { start: 'Avvia esperienza', subtitle: 'HyperCity: Urban Pulse', speed: 'Velocità', score: 'Punti guida', settings: 'Impostazioni avanzate', controls: 'WASD/Frecce guida, Shift nitro, mouse visuale.', traffic: 'Traffico auto', peds: 'Pedoni', mobile: 'Comandi touch' },
  en: { start: 'Start experience', subtitle: 'HyperCity: Urban Pulse', speed: 'Speed', score: 'Driving score', settings: 'Advanced settings', controls: 'WASD/Arrows drive, Shift nitro, mouse camera.', traffic: 'Car traffic', peds: 'Pedestrians', mobile: 'Touch controls' }
};

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050912);
scene.fog = new THREE.FogExp2(0x091525, 0.01);

const renderer = new THREE.WebGLRenderer({ canvas: $('gameCanvas'), antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
renderer.shadowMap.enabled = true;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 5, 12);

const hemi = new THREE.HemisphereLight(0x82b9ff, 0x0a0c12, 1.1);
const sun = new THREE.DirectionalLight(0xfff3dd, 1.25);
sun.position.set(50, 55, 10);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
scene.add(hemi, sun);

function asphalt() {
  const c = document.createElement('canvas');
  c.width = c.height = 1024;
  const g = c.getContext('2d');
  g.fillStyle = '#161a22';
  g.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 12000; i++) {
    const s = 30 + Math.random() * 50;
    g.fillStyle = `rgb(${s},${s},${s})`;
    g.fillRect(Math.random() * 1024, Math.random() * 1024, 1, 1);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(30, 30);
  return t;
}

function laneMarks() {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 1024;
  const g = c.getContext('2d');
  g.fillStyle = '#00000000';
  g.fillRect(0, 0, c.width, c.height);
  g.strokeStyle = '#c9d7ec';
  g.lineWidth = 8;
  for (let y = 0; y < c.height; y += 90) {
    g.beginPath();
    g.moveTo(64, y);
    g.lineTo(64, y + 44);
    g.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(1, 10);
  return t;
}

const ground = new THREE.Mesh(new THREE.PlaneGeometry(360, 360), new THREE.MeshStandardMaterial({ map: asphalt(), roughness: 0.95, metalness: 0.08 }));
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

const roads = new THREE.Group();
const roadMat = new THREE.MeshStandardMaterial({ color: 0x1f2633, roughness: 0.9, metalness: 0.06 });
for (let i = -2; i <= 2; i++) {
  const v = new THREE.Mesh(new THREE.PlaneGeometry(24, 320), roadMat);
  v.rotation.x = -Math.PI / 2; v.position.set(i * 52, 0.03, 0); v.receiveShadow = true; roads.add(v);
  const h = new THREE.Mesh(new THREE.PlaneGeometry(320, 24), roadMat);
  h.rotation.x = -Math.PI / 2; h.position.set(0, 0.03, i * 52); h.receiveShadow = true; roads.add(h);

  const marksV = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 320), new THREE.MeshBasicMaterial({ map: laneMarks(), transparent: true }));
  marksV.rotation.x = -Math.PI / 2; marksV.position.set(i * 52, 0.04, 0); roads.add(marksV);
  const marksH = new THREE.Mesh(new THREE.PlaneGeometry(320, 1.4), new THREE.MeshBasicMaterial({ map: laneMarks(), transparent: true }));
  marksH.rotation.x = -Math.PI / 2; marksH.rotation.z = Math.PI / 2; marksH.position.set(0, 0.04, i * 52); roads.add(marksH);
}
scene.add(roads);

const buildings = new THREE.Group();
scene.add(buildings);
const rnd = (a, b) => Math.random() * (b - a) + a;
const buildingMat = () => new THREE.MeshStandardMaterial({
  color: new THREE.Color().setHSL(0.56 + Math.random() * 0.07, 0.33, 0.2 + Math.random() * 0.24),
  emissive: new THREE.Color().setHSL(0.57, 0.6, 0.08 + Math.random() * 0.2), roughness: 0.62, metalness: 0.28
});

for (let i = 0; i < 520; i++) {
  const w = rnd(2.5, 10), d = rnd(2.5, 10), h = rnd(5, 65);
  const tower = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), buildingMat());
  tower.position.set(rnd(-170, 170), h / 2, rnd(-170, 170));
  const nearRoad = Math.abs((tower.position.x + 26) % 52 - 26) < 15 || Math.abs((tower.position.z + 26) % 52 - 26) < 15;
  if (nearRoad) continue;
  tower.castShadow = true; tower.receiveShadow = true;
  buildings.add(tower);
}

const player = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.1, 3.4), new THREE.MeshStandardMaterial({ color: 0xff3848, metalness: 0.84, roughness: 0.25 }));
player.position.set(0, 0.65, 0);
player.castShadow = true;
scene.add(player);

const state = { active: false, score: 0, cameraMode: 0, yaw: 0, speed: 0, touch: {} };
const keys = {};
window.addEventListener('keydown', (e) => keys[e.key.toLowerCase()] = true);
window.addEventListener('keyup', (e) => keys[e.key.toLowerCase()] = false);

const cars = [];
function spawnCars(n) {
  cars.forEach(c => scene.remove(c.mesh));
  cars.length = 0;
  for (let i = 0; i < n; i++) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1, 3.2), new THREE.MeshStandardMaterial({ color: new THREE.Color().setHSL(Math.random(), 0.7, 0.53), metalness: 0.62, roughness: 0.36 }));
    m.position.y = 0.62;
    m.castShadow = true;
    scene.add(m);
    const axis = Math.random() > 0.5 ? 'x' : 'z';
    const lane = (Math.floor(rnd(-2, 3)) * 52) + (Math.random() > 0.5 ? 6 : -6);
    cars.push({ mesh: m, axis, lane, progress: rnd(-160, 160), dir: Math.random() > 0.5 ? 1 : -1, v: rnd(8, 24) });
  }
}

const pedestrians = [];
function spawnPedestrians(n) {
  pedestrians.forEach(p => scene.remove(p.group));
  pedestrians.length = 0;
  for (let i = 0; i < n; i++) {
    const group = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.25, 0.8, 4, 8), new THREE.MeshStandardMaterial({ color: new THREE.Color().setHSL(Math.random(), 0.45, 0.55) }));
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 10), new THREE.MeshStandardMaterial({ color: 0xffd5bf }));
    body.position.y = 0.7; head.position.y = 1.42;
    group.add(body, head);
    group.position.set(rnd(-150, 150), 0.08, rnd(-150, 150));
    if (Math.abs((group.position.x + 26) % 52 - 26) < 12 || Math.abs((group.position.z + 26) % 52 - 26) < 12) group.position.x += 18;
    scene.add(group);
    pedestrians.push({ group, body, phase: Math.random() * Math.PI * 2, dir: new THREE.Vector3(rnd(-1, 1), 0, rnd(-1, 1)).normalize(), speed: rnd(1.2, 3.2) });
  }
}

spawnCars(Number(ui.traffic.value));
spawnPedestrians(Number(ui.pedestrians.value));

ui.settingsToggle.addEventListener('click', () => ui.settings.classList.toggle('hidden'));
ui.camBtn.addEventListener('click', () => state.cameraMode = (state.cameraMode + 1) % 3);
ui.traffic.addEventListener('input', () => { ui.trafficValue.textContent = ui.traffic.value; spawnCars(Number(ui.traffic.value)); });
ui.pedestrians.addEventListener('input', () => { ui.pedValue.textContent = ui.pedestrians.value; spawnPedestrians(Number(ui.pedestrians.value)); });
ui.fpsLimit.addEventListener('input', () => ui.fpsLimitValue.textContent = ui.fpsLimit.value);
ui.shadows.addEventListener('change', () => renderer.shadowMap.enabled = ui.shadows.checked);
ui.quality.addEventListener('change', () => {
  const settings = { low: [0.6, 0.8], medium: [1, 1.1], ultra: [1.4, 1.35] };
  const [h, s] = settings[ui.quality.value] ?? settings.medium;
  hemi.intensity = h; sun.intensity = s;
});
ui.mobileHud.addEventListener('change', () => ui.mobileControls.classList.toggle('hidden', !ui.mobileHud.checked || !isMobile()));
ui.language.addEventListener('change', () => applyLanguage(ui.language.value));

function applyLanguage(lang) {
  const t = texts[lang] ?? texts.it;
  $('startBtn').textContent = t.start;
  $('introSubtitle').textContent = t.subtitle;
  $('settingsTitle').textContent = t.settings;
  $('trafficLabel').textContent = t.traffic;
  $('pedLabel').textContent = t.peds;
  $('mobileLabel').textContent = t.mobile;
  $('controlsText').textContent = t.controls;
}
applyLanguage('it');

function isMobile() {
  return window.matchMedia('(max-width: 900px)').matches || 'ontouchstart' in window;
}

if (isMobile()) ui.mobileControls.classList.remove('hidden');

for (const btn of ui.mobileControls.querySelectorAll('button')) {
  const k = btn.dataset.key;
  const down = () => state.touch[k] = true;
  const up = () => state.touch[k] = false;
  btn.addEventListener('touchstart', (e) => { e.preventDefault(); down(); }, { passive: false });
  btn.addEventListener('touchend', up);
  btn.addEventListener('mousedown', down);
  btn.addEventListener('mouseup', up);
  btn.addEventListener('mouseleave', up);
}

ui.startBtn.addEventListener('click', async () => {
  ui.intro.classList.add('hidden');
  ui.hud.classList.remove('hidden');
  state.active = true;
  try { await document.body.requestPointerLock?.(); } catch { /* noop */ }
});

window.addEventListener('mousemove', (e) => {
  if (!state.active) return;
  state.yaw -= e.movementX * 0.0017;
});

const clock = new THREE.Clock();
let frameCarry = 0, fpsAcc = 0, fpsFrames = 0;

function update(step, elapsed) {
  const steerL = keys.a || keys.arrowleft || state.touch.left;
  const steerR = keys.d || keys.arrowright || state.touch.right;
  const gas = keys.w || keys.arrowup || state.touch.up;
  const brake = keys.s || keys.arrowdown || state.touch.down || state.touch.brake;
  const nitro = keys.shift || state.touch.nitro;

  if (steerL) state.yaw += step * 1.8;
  if (steerR) state.yaw -= step * 1.8;

  const targetSpeed = gas ? (nitro ? 34 : 22) : brake ? -10 : 0;
  state.speed = THREE.MathUtils.damp(state.speed, targetSpeed, gas || brake ? 4 : 2.6, step);

  const dir = new THREE.Vector3(Math.sin(state.yaw), 0, Math.cos(state.yaw));
  player.position.addScaledVector(dir, state.speed * step);
  player.position.x = THREE.MathUtils.clamp(player.position.x, -165, 165);
  player.position.z = THREE.MathUtils.clamp(player.position.z, -165, 165);
  player.rotation.y = state.yaw;

  state.score += Math.abs(state.speed) * step * 0.15;
  ui.score.textContent = `${(texts[ui.language.value] ?? texts.it).score}: ${Math.floor(state.score)}`;

  const camPos = [
    new THREE.Vector3(player.position.x - Math.sin(state.yaw) * 12, 6.5, player.position.z - Math.cos(state.yaw) * 12),
    new THREE.Vector3(player.position.x + Math.sin(state.yaw) * 1.4, 2.2, player.position.z + Math.cos(state.yaw) * 1.4),
    new THREE.Vector3(player.position.x, 33, player.position.z + 0.1)
  ][state.cameraMode];
  camera.position.lerp(camPos, 0.1);
  camera.lookAt(player.position.x, state.cameraMode === 2 ? 0 : 1.4, player.position.z);

  cars.forEach((c) => {
    c.progress += c.v * c.dir * step;
    if (c.progress > 170) c.progress = -170;
    if (c.progress < -170) c.progress = 170;
    if (c.axis === 'x') {
      c.mesh.position.set(c.progress, 0.62, c.lane);
      c.mesh.rotation.y = c.dir > 0 ? -Math.PI / 2 : Math.PI / 2;
    } else {
      c.mesh.position.set(c.lane, 0.62, c.progress);
      c.mesh.rotation.y = c.dir > 0 ? Math.PI : 0;
    }
  });

  pedestrians.forEach((p) => {
    p.phase += step * 8;
    p.body.position.y = 0.7 + Math.sin(p.phase) * 0.07;
    p.group.position.addScaledVector(p.dir, p.speed * step);
    if (Math.abs(p.group.position.x) > 168 || Math.abs(p.group.position.z) > 168) p.dir.multiplyScalar(-1);
    if (Math.random() < 0.01) p.dir.applyAxisAngle(new THREE.Vector3(0, 1, 0), rnd(-0.6, 0.6));
    p.group.rotation.y = Math.atan2(p.dir.x, p.dir.z);
  });

  sun.position.x = Math.sin(elapsed * 0.08) * 65;
  sun.position.z = Math.cos(elapsed * 0.08) * 65;

  ui.speed.textContent = `${(texts[ui.language.value] ?? texts.it).speed}: ${Math.round(Math.abs(state.speed) * 3.6)} km/h`;
}

function loop() {
  requestAnimationFrame(loop);
  const dt = clock.getDelta();
  frameCarry += dt;
  const budget = 1 / Number(ui.fpsLimit.value);
  if (frameCarry < budget) return;
  const step = frameCarry;
  frameCarry = 0;

  if (state.active) update(step, clock.elapsedTime);
  renderer.render(scene, camera);

  fpsAcc += step;
  fpsFrames++;
  if (fpsAcc >= 0.4) {
    ui.fps.textContent = `FPS: ${Math.round(fpsFrames / fpsAcc)}`;
    fpsAcc = 0;
    fpsFrames = 0;
  }
}
loop();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  if (isMobile()) ui.mobileControls.classList.remove('hidden');
});
