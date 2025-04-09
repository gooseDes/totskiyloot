const THREE = await import('https://esm.sh/three@0.175.0');
const { GLTFLoader } = await import('https://esm.sh/three@0.175.0/examples/jsm/loaders/GLTFLoader.js');
import * as player_controller from "./player_controller.js";

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

export const player = new player_controller.PlayerController(camera, flashlight, scene, renderer, []);

export var running = false;

export function update() {
  player.update(1/60);
}

export function render() {
  renderer.render(scene, camera);
}

export function start() {
  running = true;
  document.body.appendChild(renderer.domElement);

  loader.load('models/test_scene.glb', (gltf) => {
      gltf.scene.traverse((node) => {
          if (node.isMesh) {
              node.castShadow = true;
              node.receiveShadow = true;
              if (node.material && node.material.isMeshStandardMaterial) {
                  node.material.roughness = 1;
                  node.material.metalness = 0.1;
              }
          }
      });

      gltf.scene.position.set(0, -2, 0);
      player.collisionMeshes.push(gltf.scene);
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
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
