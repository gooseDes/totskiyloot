const THREE = await import('https://esm.sh/three@0.175.0');
const { GLTFLoader } = await import('https://esm.sh/three@0.175.0/examples/jsm/loaders/GLTFLoader.js');
import * as CANNON from 'https://cdn.skypack.dev/cannon-es';

import * as player_controller from "./player_controller.js";
import * as item_controller from "./item_controller.js";

function addCollider(world, mesh) {
  mesh.updateMatrixWorld(true);
  mesh.traverse((child) => {
    if (child.isMesh && child.geometry) {
      const shape = createTrimesh(child.geometry, child);
      if (shape) {
        const body = new CANNON.Body({ mass: 0 });
        body.collisionResponse = true;
        body.addShape(shape);
        body.position.set(0, 0, 0);
        const physicsMaterial = new CANNON.Material('sceneMaterial');
        const contactMaterial = new CANNON.ContactMaterial(physicsMaterial, physicsMaterial, {
          friction: 0.01,
          restitution: 0,
        });
        world.addContactMaterial(contactMaterial);
        body.material = physicsMaterial;
        world.addBody(body);
      }
    }
  });
}

function createTrimesh(geometry, mesh) {
  if (!geometry.attributes.position) return null;

  const cloned = geometry.clone();
  cloned.applyMatrix4(mesh.matrixWorld);

  const pos = cloned.attributes.position.array;
  const idx = cloned.index ? cloned.index.array : generateIndex(cloned);

  return new CANNON.Trimesh(pos, idx);
}

function generateIndex(geometry) {
  const count = geometry.attributes.position.count;
  const index = new Uint16Array(count);
  for (let i = 0; i < count; i++) index[i] = i;
  return index;
}


export const world = new CANNON.World({
  gravity: new CANNON.Vec3(0, -9.82, 0)
});

export const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111122);
scene.fog = new THREE.Fog(0x111122, 10, 50);

export const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 2, 0);

export const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const loader = new GLTFLoader();

const ambientLight = new THREE.AmbientLight(0x404040, 0.3);

export const flashlight = new THREE.SpotLight(0xffffff, 10, 100, Math.PI / 6, 0.2, 1.5);
flashlight.castShadow = true;
flashlight.shadow.mapSize.width = 1024;
flashlight.shadow.mapSize.height = 1024;
flashlight.shadow.bias = -0.005;
flashlight.target.position.set(0, 0, -1);

export const player = new player_controller.PlayerController(camera, flashlight, scene, renderer, world);

const cube = new item_controller.ItemController(scene, world);
var cubes = [];
loader.load('models/monkey.glb', (gltf) => {
  for (let i = 0; i < 50; i++) {
    cubes.push(new item_controller.ItemController(scene, world, Math.random()/3 + 0.2, new THREE.Vector3(Math.random() * 10 - 5, Math.random() * 10 + 5, Math.random() * 10 - 5), gltf.scene.children[0].clone()));
  }
});

loader.load('models/ball.glb', (gltf) => {
  for (let i = 0; i < 50; i++) {
    cubes.push(new item_controller.ItemController(scene, world, Math.random()/3 + 0.2, new THREE.Vector3(Math.random() * 10 - 5, Math.random() * 10 + 5, Math.random() * 10 - 5), gltf.scene.children[0].clone()));
  }
});

export var running = false;

export function update() {
  world.step(1 / 60);
  player.update();
  cube.update();
  for (let i = 0; i < cubes.length; i++) {
    cubes[i].update();
  }
}

export function render() {
  renderer.render(scene, camera);
}

export function start() {
  running = true;
  document.body.appendChild(renderer.domElement);

  loader.load('models/test_scene.glb', (gltf) => {
      gltf.scene.position.set(0, -2, 0)
      addCollider(world, gltf.scene);
      scene.add(gltf.scene);
  });
  
  const moonLight = new THREE.DirectionalLight(0x8888ff, 0.2);
  moonLight.position.set(5, 10, -10);
  moonLight.castShadow = true;
  moonLight.shadow.mapSize.width = 1024;
  moonLight.shadow.mapSize.height = 1024;
  moonLight.shadow.bias = -0.002;
  scene.add(moonLight);

  scene.add(ambientLight);
  scene.add(flashlight);
  scene.add(flashlight.target);
}

export function stop() {
  running = false;
  document.body.removeChild(renderer.domElement);
}

window.addEventListener('click', () => {
  if (!('ontouchstart' in window)) {
    renderer.domElement.requestPointerLock();
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen();
    } else if (document.documentElement.mozRequestFullScreen) {
        document.documentElement.mozRequestFullScreen();
    } else if (document.documentElement.webkitRequestFullscreen) {
        document.documentElement.webkitRequestFullscreen();
    } else if (document.documentElement.msRequestFullscreen) {
        document.documentElement.msRequestFullscreen();
    }
  }
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
