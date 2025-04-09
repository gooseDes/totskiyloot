const THREE = await import('https://esm.sh/three@0.175.0');
const { GLTFLoader } = await import('https://esm.sh/three@0.175.0/examples/jsm/loaders/GLTFLoader.js');

export const scene = new THREE.Scene();
scene.background = new THREE.Color(0x222244);

export const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

export const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);

const loader = new GLTFLoader();

const ambientLight = new THREE.AmbientLight(0xffffff, 0.1);
export const light = new THREE.SpotLight(0xffffff, 10, 1000, Math.PI, 0.1, 2);
light.target.position.set(0, 0, 0);

export var running = false;

export function start() {
  running = true;
  document.body.appendChild(renderer.domElement);

  loader.load('models/menu_scene.glb', (gltf) => {
      gltf.scene.position.set(0, -2, 0)
      scene.add(gltf.scene);
  });

  scene.add(ambientLight);
  scene.add(light);
  scene.add(light.target);
}

export function update() {
    requestAnimationFrame(update);
    camera.rotation.y = Math.sin(performance.now()*0.000001)*360;
    light.intensity = Math.sin(performance.now()*0.001)*5+10;
}

export function render() {
  renderer.render(scene, camera);
}

export function stop() {
  running = false;
  document.body.removeChild(renderer.domElement);
}

window.addEventListener('click', () => {
  if (document.documentElement.requestFullscreen) {
    document.documentElement.requestFullscreen();
  } else if (document.documentElement.mozRequestFullScreen) { // Firefox
      document.documentElement.mozRequestFullScreen();
  } else if (document.documentElement.webkitRequestFullscreen) { // Chrome, Safari and Opera
      document.documentElement.webkitRequestFullscreen();
  } else if (document.documentElement.msRequestFullscreen) { // IE/Edge
      document.documentElement.msRequestFullscreen();
  }
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});