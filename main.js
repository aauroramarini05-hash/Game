import * as THREE from 'https://unpkg.com/three@0.164.1/build/three.module.js';
import { GLTFLoader } from 'https://unpkg.com/three@0.164.1/examples/jsm/loaders/GLTFLoader.js';
import { clone } from 'https://unpkg.com/three@0.164.1/examples/jsm/utils/SkeletonUtils.js';

const $ = (id) => document.getElementById(id);
const ui = {
  intro: $('intro'), startBtn: $('startBtn'), hud: $('hud'), settings: $('settings'), settingsToggle: $('settingsToggle'),
  settingsClose: $('settingsClose'), camBtn: $('camBtn'),
  speed: $('speed'), fps: $('fps'), score: $('score'),
  language: $('language'), fpsLimit: $('fpsLimit'), fpsLimitValue: $('fpsLimitValue'), quality: $('quality'),
  shadows: $('shadows'), traffic: $('traffic'), trafficValue: $('trafficValue'), pedestrians: $('pedestrians'), pedValue: $('pedValue'),
  mobileHud: $('mobileHud'), mobileControls: $('mobileControls')
};

const text = {
  it: { start: 'Avvia esperienza', speed: 'Velocità', score: 'Punti guida', settings: 'Impostazioni avanzate', controls: 'WASD/Frecce guida, Shift nitro, mouse visuale.', traffic: 'Traffico auto', peds: 'Pedoni', mobile: 'Comandi touch' },
  en: { start: 'Start experience', speed: 'Speed', score: 'Driving score', settings: 'Advanced settings', controls: 'WASD/Arrows drive, Shift nitro, mouse camera.', traffic: 'Car traffic', peds: 'Pedestrians', mobile: 'Touch controls' }
};

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87a3c7);
scene.fog = new THREE.Fog(0xa7bfd9, 70, 420);

const renderer = new THREE.WebGLRenderer({ canvas: $('gameCanvas'), antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
renderer.shadowMap.enabled = true;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1300);
camera.position.set(0, 5.4, 12);

const hemi = new THREE.HemisphereLight(0xc9e6ff, 0x38434f, 1.1);
const sun = new THREE.DirectionalLight(0xffffff, 1.2);
sun.position.set(60, 100, -35);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
scene.add(hemi, sun);

const tex = new THREE.TextureLoader();
const asphalt = tex.load('https://threejs.org/examples/textures/terrain/grasslight-big.jpg');
asphalt.wrapS = asphalt.wrapT = THREE.RepeatWrapping;
asphalt.repeat.set(24, 24);

const roadTex = tex.load('https://threejs.org/examples/textures/hardwood2_diffuse.jpg');
roadTex.wrapS = roadTex.wrapT = THREE.RepeatWrapping;
roadTex.repeat.set(18, 18);

const ground = new THREE.Mesh(new THREE.PlaneGeometry(720, 720), new THREE.MeshStandardMaterial({ map: asphalt, roughness: 0.95, metalness: 0.05 }));
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

const roads = new THREE.Group();
const roadMat = new THREE.MeshStandardMaterial({ map: roadTex, roughness: 0.82, metalness: 0.12, color: 0x7e7e7e });
for (let i = -3; i <= 3; i++) {
  const v = new THREE.Mesh(new THREE.PlaneGeometry(28, 640), roadMat);
  v.rotation.x = -Math.PI / 2;
  v.position.set(i * 88, 0.03, 0);
  v.receiveShadow = true;
  roads.add(v);
  const h = new THREE.Mesh(new THREE.PlaneGeometry(640, 28), roadMat);
  h.rotation.x = -Math.PI / 2;
  h.position.set(0, 0.03, i * 88);
  h.receiveShadow = true;
  roads.add(h);
}
scene.add(roads);

const city = new THREE.Group();
scene.add(city);

const state = { active: false, score: 0, cameraMode: 0, yaw: 0, speed: 0, touch: {}, mixers: [], readyCar: null, readyPerson: null };
const keys = {};
window.addEventListener('keydown', (e) => keys[e.key.toLowerCase()] = true);
window.addEventListener('keyup', (e) => keys[e.key.toLowerCase()] = false);

const player = new THREE.Group();
scene.add(player);

const playerFallback = new THREE.Mesh(new THREE.BoxGeometry(1.7, 1, 3.4), new THREE.MeshStandardMaterial({ color: 0xe12f40, metalness: 0.82, roughness: 0.26 }));
playerFallback.position.y = 0.65;
playerFallback.castShadow = true;
player.add(playerFallback);

const vehicles = [];
const people = [];

const gltfLoader = new GLTFLoader();

function setupModelShadows(root) {
  root.traverse((o) => {
    if (o.isMesh) {
      o.castShadow = true;
      o.receiveShadow = true;
      if (o.material) {
        o.material.metalness = typeof o.material.metalness === 'number' ? o.material.metalness : 0.2;
        o.material.roughness = typeof o.material.roughness === 'number' ? o.material.roughness : 0.7;
      }
    }
  });
}

function loadBaseAssets() {
  gltfLoader.load('https://threejs.org/examples/models/gltf/LittlestTokyo.glb', (gltf) => {
    const model = gltf.scene;
    model.scale.setScalar(0.095);
    model.position.set(-65, 0, -55);
    setupModelShadows(model);
    city.add(model);
  });

  gltfLoader.load('https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/ToyCar/glTF-Binary/ToyCar.glb', (gltf) => {
    const base = gltf.scene;
    setupModelShadows(base);

    state.readyCar = base;
    if (player.children.length) player.clear();
    const p = base.clone();
    p.scale.setScalar(0.58);
    p.position.y = 0.4;
    player.add(p);

    rebuildVehicles(Number(ui.traffic.value));
  });

  gltfLoader.load('https://threejs.org/examples/models/gltf/Soldier.glb', (gltf) => {
    state.readyPerson = { scene: gltf.scene, animations: gltf.animations };
    rebuildPeople(Number(ui.pedestrians.value));
  });
}
loadBaseAssets();

function randomLane() {
  return (Math.floor(Math.random() * 7) - 3) * 88 + (Math.random() > 0.5 ? 7 : -7);
}

function makeVehicleModel() {
  if (state.readyCar) {
    const v = state.readyCar.clone();
    v.scale.setScalar(0.58);
    return v;
  }
  const fb = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1, 3.4), new THREE.MeshStandardMaterial({ color: new THREE.Color().setHSL(Math.random(), 0.7, 0.52) }));
  fb.castShadow = true;
  return fb;
}

function rebuildVehicles(n) {
  vehicles.forEach(v => scene.remove(v.root));
  vehicles.length = 0;

  for (let i = 0; i < n; i++) {
    const root = new THREE.Group();
    const model = makeVehicleModel();
    root.add(model);
    root.position.y = 0.4;
    scene.add(root);
    const axis = Math.random() > 0.5 ? 'x' : 'z';
    vehicles.push({ root, axis, lane: randomLane(), progress: Math.random() * 550 - 275, dir: Math.random() > 0.5 ? 1 : -1, v: 12 + Math.random() * 18 });
  }
}

function makePerson() {
  if (!state.readyPerson) {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(new THREE.CapsuleGeometry(0.24, 0.8, 4, 8), new THREE.MeshStandardMaterial({ color: 0x4d86d9 })));
    return { root: g, mixer: null };
  }

  const actor = clone(state.readyPerson.scene);
  actor.scale.setScalar(0.013);
  setupModelShadows(actor);

  const mixer = new THREE.AnimationMixer(actor);
  const walk = state.readyPerson.animations.find(a => /walk/i.test(a.name)) ?? state.readyPerson.animations[0];
  mixer.clipAction(walk).play();

  return { root: actor, mixer };
}

function rebuildPeople(n) {
  people.forEach(p => scene.remove(p.root));
  people.length = 0;
  state.mixers = [];

  for (let i = 0; i < n; i++) {
    const { root, mixer } = makePerson();
    root.position.set(Math.random() * 580 - 290, 0, Math.random() * 580 - 290);
    scene.add(root);
    if (mixer) state.mixers.push(mixer);
    people.push({ root, dir: new THREE.Vector3(Math.random() - .5, 0, Math.random() - .5).normalize(), speed: 1.1 + Math.random() * 2.1 });
  }
}

ui.settingsToggle.addEventListener('click', () => ui.settings.classList.toggle('hidden'));
ui.settingsClose.addEventListener('click', () => ui.settings.classList.add('hidden'));
ui.camBtn.addEventListener('click', () => state.cameraMode = (state.cameraMode + 1) % 3);
ui.traffic.addEventListener('input', () => { ui.trafficValue.textContent = ui.traffic.value; rebuildVehicles(Number(ui.traffic.value)); });
ui.pedestrians.addEventListener('input', () => { ui.pedValue.textContent = ui.pedestrians.value; rebuildPeople(Number(ui.pedestrians.value)); });
ui.fpsLimit.addEventListener('input', () => ui.fpsLimitValue.textContent = ui.fpsLimit.value);
ui.shadows.addEventListener('change', () => renderer.shadowMap.enabled = ui.shadows.checked);
ui.quality.addEventListener('change', () => {
  const map = { low: [0.75, 0.8], medium: [1.1, 1.2], ultra: [1.3, 1.45] };
  const [h, s] = map[ui.quality.value] ?? map.medium;
  hemi.intensity = h;
  sun.intensity = s;
});
ui.mobileHud.addEventListener('change', () => ui.mobileControls.classList.toggle('hidden', !ui.mobileHud.checked || !isMobile()));
ui.language.addEventListener('change', () => updateLang(ui.language.value));

function updateLang(lang) {
  const t = text[lang] ?? text.it;
  $('startBtn').textContent = t.start;
  $('settingsTitle').textContent = t.settings;
  $('trafficLabel').textContent = t.traffic;
  $('pedLabel').textContent = t.peds;
  $('mobileLabel').textContent = t.mobile;
  $('controlsText').textContent = t.controls;
}
updateLang('it');

function isMobile() {
  return window.matchMedia('(max-width: 900px)').matches || 'ontouchstart' in window;
}
if (isMobile()) ui.mobileControls.classList.remove('hidden');

for (const btn of ui.mobileControls.querySelectorAll('button')) {
  const key = btn.dataset.key;
  const down = () => state.touch[key] = true;
  const up = () => state.touch[key] = false;
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
  try { await document.body.requestPointerLock?.(); } catch {}
});

window.addEventListener('mousemove', (e) => {
  if (!state.active) return;
  state.yaw -= e.movementX * 0.0016;
});

const clock = new THREE.Clock();
let carry = 0, fpsAcc = 0, fpsCount = 0;

function update(step, elapsed) {
  const steerL = keys.a || keys.arrowleft || state.touch.left;
  const steerR = keys.d || keys.arrowright || state.touch.right;
  const gas = keys.w || keys.arrowup || state.touch.up;
  const brake = keys.s || keys.arrowdown || state.touch.down || state.touch.brake;
  const nitro = keys.shift || state.touch.nitro;

  if (steerL) state.yaw += step * 1.9;
  if (steerR) state.yaw -= step * 1.9;

  const target = gas ? (nitro ? 42 : 30) : brake ? -15 : 0;
  state.speed = THREE.MathUtils.damp(state.speed, target, gas || brake ? 4.6 : 2.8, step);

  const dir = new THREE.Vector3(Math.sin(state.yaw), 0, Math.cos(state.yaw));
  player.position.addScaledVector(dir, state.speed * step);
  player.position.x = THREE.MathUtils.clamp(player.position.x, -310, 310);
  player.position.z = THREE.MathUtils.clamp(player.position.z, -310, 310);
  player.rotation.y = state.yaw;

  state.score += Math.abs(state.speed) * step * 0.16;
  const t = text[ui.language.value] ?? text.it;
  ui.speed.textContent = `${t.speed}: ${Math.round(Math.abs(state.speed) * 3.6)} km/h`;
  ui.score.textContent = `${t.score}: ${Math.floor(state.score)}`;

  const cams = [
    new THREE.Vector3(player.position.x - Math.sin(state.yaw) * 14, 7, player.position.z - Math.cos(state.yaw) * 14),
    new THREE.Vector3(player.position.x + Math.sin(state.yaw) * 1.1, 2.35, player.position.z + Math.cos(state.yaw) * 1.1),
    new THREE.Vector3(player.position.x, 36, player.position.z + 0.1)
  ];
  camera.position.lerp(cams[state.cameraMode], 0.1);
  camera.lookAt(player.position.x, state.cameraMode === 2 ? 0 : 1.45, player.position.z);

  vehicles.forEach((v) => {
    v.progress += v.v * v.dir * step;
    if (v.progress > 310) v.progress = -310;
    if (v.progress < -310) v.progress = 310;
    if (v.axis === 'x') {
      v.root.position.set(v.progress, 0.4, v.lane);
      v.root.rotation.y = v.dir > 0 ? -Math.PI / 2 : Math.PI / 2;
    } else {
      v.root.position.set(v.lane, 0.4, v.progress);
      v.root.rotation.y = v.dir > 0 ? Math.PI : 0;
    }
  });

  people.forEach((p) => {
    p.root.position.addScaledVector(p.dir, p.speed * step);
    if (Math.abs(p.root.position.x) > 320 || Math.abs(p.root.position.z) > 320) p.dir.multiplyScalar(-1);
    if (Math.random() < 0.008) p.dir.applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.random() * 0.8 - 0.4);
    p.root.rotation.y = Math.atan2(p.dir.x, p.dir.z);
  });

  state.mixers.forEach((m) => m.update(step));

  sun.position.x = Math.sin(elapsed * 0.08) * 110;
  sun.position.z = Math.cos(elapsed * 0.08) * 110;
}

function renderLoop() {
  requestAnimationFrame(renderLoop);
  const dt = clock.getDelta();
  carry += dt;
  const budget = 1 / Number(ui.fpsLimit.value);
  if (carry < budget) return;

  const step = carry;
  carry = 0;

  if (state.active) update(step, clock.elapsedTime);
  renderer.render(scene, camera);

  fpsAcc += step;
  fpsCount++;
  if (fpsAcc >= 0.4) {
    ui.fps.textContent = `FPS: ${Math.round(fpsCount / fpsAcc)}`;
    fpsAcc = 0;
    fpsCount = 0;
  }
}
renderLoop();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  if (isMobile()) ui.mobileControls.classList.remove('hidden');
});
