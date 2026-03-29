import * as THREE from "https://unpkg.com/three@0.164.1/build/three.module.js";
import { OrbitControls } from "https://unpkg.com/three@0.164.1/examples/jsm/controls/OrbitControls.js";

const i18n = {
  it: {
    introTitle: "xDustAtom Present",
    introSubtitle: "Caricamento città 3D avanzata…",
    start: "Avvia",
    uiTitle: "Impostazioni Avanzate",
    lang: "Lingua",
    fps: "Limite FPS",
    quality: "Qualità",
    dayNight: "Ciclo Giorno/Notte",
    traffic: "Traffico Dinamico",
    reset: "Reset Camera",
    fpsNow: "FPS attuali",
    cityTime: "Ora città",
    entities: "Entità animate",
    hint: "WASD + mouse per muoverti"
  },
  en: {
    introTitle: "xDustAtom Present",
    introSubtitle: "Loading advanced 3D city…",
    start: "Start",
    uiTitle: "Advanced Settings",
    lang: "Language",
    fps: "FPS Limit",
    quality: "Quality",
    dayNight: "Day/Night Cycle",
    traffic: "Dynamic Traffic",
    reset: "Reset Camera",
    fpsNow: "Current FPS",
    cityTime: "City Time",
    entities: "Animated Entities",
    hint: "WASD + mouse to move"
  }
};

const state = {
  fpsCap: 60,
  language: "it",
  quality: "high",
  dayNight: true,
  traffic: true,
  cityHour: 12,
  entities: 0,
  keys: {}
};

const scene = new THREE.Scene();
scene.background = new THREE.Color("#87c4ff");
scene.fog = new THREE.FogExp2("#95bfe9", 0.0032);

const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 2000);
camera.position.set(40, 24, 45);

const canvas = document.getElementById("scene");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.maxPolarAngle = Math.PI * 0.48;
controls.target.set(0, 8, 0);

const hemi = new THREE.HemisphereLight("#cbe8ff", "#2e3845", 0.58);
scene.add(hemi);

const sun = new THREE.DirectionalLight("#fff6db", 1.5);
sun.castShadow = true;
sun.shadow.camera.top = 140;
sun.shadow.camera.bottom = -140;
sun.shadow.camera.left = -140;
sun.shadow.camera.right = 140;
sun.shadow.mapSize.set(2048, 2048);
sun.position.set(80, 90, 45);
scene.add(sun);

const asphalt = new THREE.MeshStandardMaterial({ color: "#1b1e23", roughness: 0.92, metalness: 0.08 });
const road = new THREE.Mesh(new THREE.PlaneGeometry(1200, 1200), asphalt);
road.rotation.x = -Math.PI / 2;
road.receiveShadow = true;
scene.add(road);

const gridMaterial = new THREE.MeshStandardMaterial({ color: "#343b45", roughness: 0.78, metalness: 0.15 });
const lineMaterial = new THREE.MeshStandardMaterial({ color: "#e6e2cd", emissive: "#3b3a30", emissiveIntensity: 0.3 });

for (let i = -500; i <= 500; i += 50) {
  const laneX = new THREE.Mesh(new THREE.PlaneGeometry(10, 1000), gridMaterial);
  laneX.rotation.x = -Math.PI / 2;
  laneX.position.set(i, 0.01, 0);
  laneX.receiveShadow = true;
  scene.add(laneX);

  const laneZ = new THREE.Mesh(new THREE.PlaneGeometry(1000, 10), gridMaterial);
  laneZ.rotation.x = -Math.PI / 2;
  laneZ.position.set(0, 0.01, i);
  laneZ.receiveShadow = true;
  scene.add(laneZ);

  if (i % 100 === 0) {
    const markX = new THREE.Mesh(new THREE.PlaneGeometry(2, 1000), lineMaterial);
    markX.rotation.x = -Math.PI / 2;
    markX.position.set(i, 0.015, 0);
    scene.add(markX);

    const markZ = new THREE.Mesh(new THREE.PlaneGeometry(1000, 2), lineMaterial);
    markZ.rotation.x = -Math.PI / 2;
    markZ.position.set(0, 0.015, i);
    scene.add(markZ);
  }
}

const buildingGroup = new THREE.Group();
scene.add(buildingGroup);
const boxGeo = new THREE.BoxGeometry(1, 1, 1);
const rng = (min, max) => Math.random() * (max - min) + min;

for (let x = -450; x <= 450; x += 30) {
  for (let z = -450; z <= 450; z += 30) {
    if (Math.abs(x) < 30 || Math.abs(z) < 30) continue;
    const h = rng(8, 95);
    const b = new THREE.Mesh(
      boxGeo,
      new THREE.MeshStandardMaterial({
        color: new THREE.Color().setHSL(0.55 + Math.random() * 0.1, 0.12, 0.2 + Math.random() * 0.2),
        roughness: 0.55,
        metalness: 0.35
      })
    );
    b.scale.set(rng(10, 20), h, rng(10, 20));
    b.position.set(x + rng(-4, 4), h / 2, z + rng(-4, 4));
    b.castShadow = true;
    b.receiveShadow = true;
    buildingGroup.add(b);

    const emissiveWindows = new THREE.Mesh(
      new THREE.PlaneGeometry(0.8, 0.8),
      new THREE.MeshStandardMaterial({
        color: "#b6d7ff",
        emissive: "#6ec0ff",
        emissiveIntensity: 0.4,
        transparent: true,
        opacity: 0.65
      })
    );
    emissiveWindows.position.set(b.position.x, Math.max(2, h * 0.45), b.position.z + b.scale.z / 2 + 0.1);
    scene.add(emissiveWindows);
  }
}

const treeGroup = new THREE.Group();
scene.add(treeGroup);
const treeTrunkMat = new THREE.MeshStandardMaterial({ color: "#6f4f2d", roughness: 1 });
const treeLeafMat = new THREE.MeshStandardMaterial({ color: "#418f53", roughness: 0.9 });
for (let i = 0; i < 280; i++) {
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.65, 3), treeTrunkMat);
  const crown = new THREE.Mesh(new THREE.SphereGeometry(rng(1.8, 3), 8, 8), treeLeafMat);
  const tx = rng(-480, 480);
  const tz = rng(-480, 480);
  if (Math.abs(tx) < 40 || Math.abs(tz) < 40) continue;
  trunk.position.set(tx, 1.5, tz);
  crown.position.set(tx, 4.2, tz);
  trunk.castShadow = crown.castShadow = true;
  treeGroup.add(trunk, crown);
}

const vehicles = [];
const vehicleMat = ["#ff6e6e", "#53f7c1", "#ffd25f", "#5ea8ff", "#fe8dff"].map(
  (c) => new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 0.08, metalness: 0.35, roughness: 0.45 })
);
for (let i = 0; i < 60; i++) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(4, 1.5, 2), vehicleMat[i % vehicleMat.length]);
  mesh.castShadow = true;
  mesh.position.y = 0.8;
  const axis = i % 2 ? "x" : "z";
  const lane = (Math.floor(Math.random() * 8) - 4) * 50 + (Math.random() > 0.5 ? 12 : -12);
  const speed = rng(14, 32) * (Math.random() > 0.5 ? 1 : -1);
  vehicles.push({ mesh, axis, lane, speed, offset: rng(-450, 450) });
  scene.add(mesh);
}

state.entities = vehicles.length + treeGroup.children.length;

const clock = new THREE.Clock();
let accumulator = 0;
let fpsCounterAcc = 0;
let fpsFrameCount = 0;

const ui = {
  introOverlay: document.getElementById("introOverlay"),
  startButton: document.getElementById("startButton"),
  languageSelect: document.getElementById("languageSelect"),
  fpsCap: document.getElementById("fpsCap"),
  fpsCapValue: document.getElementById("fpsCapValue"),
  quality: document.getElementById("qualitySelect"),
  dayNight: document.getElementById("dayNightToggle"),
  traffic: document.getElementById("trafficToggle"),
  resetCamera: document.getElementById("resetCamera"),
  fpsNow: document.getElementById("fpsNow"),
  cityTime: document.getElementById("cityTime"),
  entityCount: document.getElementById("entityCount")
};

function applyLanguage(lang) {
  const t = i18n[lang] ?? i18n.it;
  document.getElementById("introTitle").textContent = t.introTitle;
  document.getElementById("introSubtitle").textContent = t.introSubtitle;
  ui.startButton.textContent = t.start;
  document.getElementById("uiTitle").textContent = t.uiTitle;
  document.getElementById("langLabel").textContent = t.lang;
  document.getElementById("fpsLabel").textContent = t.fps;
  document.getElementById("qualityLabel").textContent = t.quality;
  document.getElementById("dayNightLabel").textContent = t.dayNight;
  document.getElementById("trafficLabel").textContent = t.traffic;
  ui.resetCamera.textContent = t.reset;
  document.getElementById("fpsNowLabel").textContent = t.fpsNow;
  document.getElementById("cityTimeLabel").textContent = t.cityTime;
  document.getElementById("entitiesLabel").textContent = t.entities;
  document.getElementById("hint").textContent = t.hint;
}

function updateQuality(level) {
  if (level === "low") {
    renderer.setPixelRatio(1);
    scene.fog.density = 0.0042;
    sun.shadow.mapSize.set(1024, 1024);
  } else if (level === "medium") {
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    scene.fog.density = 0.0036;
    sun.shadow.mapSize.set(1536, 1536);
  } else {
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    scene.fog.density = 0.0032;
    sun.shadow.mapSize.set(2048, 2048);
  }
}

function updateDayNight(dt) {
  if (!state.dayNight) return;
  state.cityHour = (state.cityHour + dt * 0.12) % 24;
  const phase = (state.cityHour / 24) * Math.PI * 2;
  const h = Math.sin(phase) * 0.5 + 0.5;

  sun.intensity = 0.3 + h * 1.4;
  hemi.intensity = 0.2 + h * 0.8;

  sun.position.set(Math.cos(phase) * 100, 25 + h * 110, Math.sin(phase) * 100);

  const sky = new THREE.Color().setHSL(0.58, 0.55, 0.15 + h * 0.45);
  scene.background.copy(sky);
}

function updateTraffic(dt) {
  for (const car of vehicles) {
    if (!state.traffic) {
      car.mesh.visible = false;
      continue;
    }
    car.mesh.visible = true;
    car.offset += car.speed * dt;
    if (car.offset > 520) car.offset = -520;
    if (car.offset < -520) car.offset = 520;

    if (car.axis === "x") {
      car.mesh.position.set(car.offset, 0.8, car.lane);
      car.mesh.rotation.y = Math.PI / 2 * Math.sign(car.speed);
    } else {
      car.mesh.position.set(car.lane, 0.8, car.offset);
      car.mesh.rotation.y = 0 + (car.speed < 0 ? Math.PI : 0);
    }
  }
}

function updateCameraMovement(dt) {
  const speed = 35 * dt;
  if (state.keys.w) camera.position.z -= speed;
  if (state.keys.s) camera.position.z += speed;
  if (state.keys.a) camera.position.x -= speed;
  if (state.keys.d) camera.position.x += speed;
}

window.addEventListener("keydown", (e) => (state.keys[e.key.toLowerCase()] = true));
window.addEventListener("keyup", (e) => (state.keys[e.key.toLowerCase()] = false));
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

ui.startButton.addEventListener("click", () => ui.introOverlay.classList.remove("visible"));
ui.languageSelect.addEventListener("change", (e) => {
  state.language = e.target.value;
  applyLanguage(state.language);
});
ui.fpsCap.addEventListener("input", (e) => {
  state.fpsCap = Number(e.target.value);
  ui.fpsCapValue.textContent = `${state.fpsCap}`;
});
ui.quality.addEventListener("change", (e) => {
  state.quality = e.target.value;
  updateQuality(state.quality);
});
ui.dayNight.addEventListener("change", (e) => (state.dayNight = e.target.checked));
ui.traffic.addEventListener("change", (e) => (state.traffic = e.target.checked));
ui.resetCamera.addEventListener("click", () => {
  camera.position.set(40, 24, 45);
  controls.target.set(0, 8, 0);
});

applyLanguage(state.language);
updateQuality(state.quality);
ui.entityCount.textContent = `${state.entities}`;

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  const frameDuration = 1 / state.fpsCap;
  accumulator += delta;
  fpsCounterAcc += delta;
  fpsFrameCount += 1;

  if (fpsCounterAcc >= 0.5) {
    ui.fpsNow.textContent = `${Math.round(fpsFrameCount / fpsCounterAcc)}`;
    fpsCounterAcc = 0;
    fpsFrameCount = 0;
  }

  while (accumulator >= frameDuration) {
    updateDayNight(frameDuration);
    updateTraffic(frameDuration);
    updateCameraMovement(frameDuration);
    controls.update();
    accumulator -= frameDuration;
  }

  const hours = Math.floor(state.cityHour).toString().padStart(2, "0");
  const mins = Math.floor((state.cityHour % 1) * 60).toString().padStart(2, "0");
  ui.cityTime.textContent = `${hours}:${mins}`;
  renderer.render(scene, camera);
}

animate();
