const THREE = await import('https://esm.sh/three@0.175.0');
const { GLTFLoader } = await import('https://esm.sh/three@0.175.0/examples/jsm/loaders/GLTFLoader.js');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x222244);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
camera.position.z = 5;

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const loader = new GLTFLoader();
var car = null;

loader.load('models/car/scene.gltf', (gltf) => {
  car = gltf.scene;
  scene.add(gltf.scene);
});

const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0xffffff, 2);
pointLight.position.set(5, 5, 5);
scene.add(pointLight);

const joystickZone = document.getElementById('joystick-zone');
let joystick;
let moveDirection = { x: 0, y: 0 };
let isTouching = false;
let touchStartX = 0, touchStartY = 0;

let keyState = { w: false, a: false, s: false, d: false };

function enableMobileControls() {
  console.log("📱 Mobile controls enabled");

  joystick = nipplejs.create({
    zone: joystickZone,
    mode: 'static',
    position: { left: '2svh', bottom: '2svh' },
    color: 'white',
  });

  joystick.on('move', (evt, data) => {
    const angle = data.angle.degree;
    const force = data.force;
    const rad = angle * (Math.PI / 180);
    moveDirection.x = Math.cos(rad) * force;
    moveDirection.y = Math.sin(rad) * force;
  });

  joystick.on('end', () => {
    moveDirection.x = 0;
    moveDirection.y = 0;
  });

  window.addEventListener('touchstart', handleTouchStart);
  window.addEventListener('touchmove', handleTouchMove);
  window.addEventListener('touchend', () => { isTouching = false; });
}

function handleTouchStart(e) {
  const touch = e.touches[0];
  if (!joystickZone.contains(touch.target)) {
    isTouching = true;
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
  }
}

function handleTouchMove(e) {
  if (!isTouching) return;
  const touch = e.touches[0];
  const deltaX = touch.clientX - touchStartX;
  const deltaY = touch.clientY - touchStartY;

  const sensitivity = 0.005;
  camera.rotation.y -= deltaX * sensitivity;
  camera.rotation.x -= deltaY * sensitivity;

  const maxPitch = Math.PI / 2 - 0.1;
  const minPitch = -Math.PI / 2 + 0.1;
  camera.rotation.x = Math.max(minPitch, Math.min(maxPitch, camera.rotation.x));

  touchStartX = touch.clientX;
  touchStartY = touch.clientY;
}

function enableDesktopControls() {
  console.log("💻 Desktop controls enabled");

  const canvas = renderer.domElement;

  canvas.addEventListener('click', () => {
    canvas.requestPointerLock();
  });

  document.addEventListener('pointerlockchange', () => {
    if (document.pointerLockElement === canvas) {
      document.addEventListener('mousemove', handleMouseMove);
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
    }
  });

  function handleMouseMove(event) {
    const sensitivity = 0.002;
    camera.rotation.y -= event.movementX * sensitivity;
    camera.rotation.x -= event.movementY * sensitivity;

    const maxPitch = Math.PI / 2 - 0.1;
    const minPitch = -Math.PI / 2 + 0.1;
    camera.rotation.x = Math.max(minPitch, Math.min(maxPitch, camera.rotation.x));
  }

  window.addEventListener('keydown', (e) => keyState[e.key.toLowerCase()] = true);
  window.addEventListener('keyup', (e) => keyState[e.key.toLowerCase()] = false);
}

const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
if (isTouchDevice) {
  enableMobileControls();
} else {
  enableDesktopControls();
}

function update() {
  requestAnimationFrame(update);

  if (!isTouchDevice) {
    const moveSpeed = 0.1;
    const direction = new THREE.Vector3();

    if (keyState.w) direction.z -= 1;
    if (keyState.s) direction.z += 1;
    if (keyState.a) direction.x -= 1;
    if (keyState.d) direction.x += 1;

    if (direction.length() > 0) {
      direction.normalize();

      const move = direction.clone().applyEuler(camera.rotation).multiplyScalar(moveSpeed);
      camera.position.add(move);
    }

  }

  if (isTouchDevice && (moveDirection.x !== 0 || moveDirection.y !== 0)) {
    const move = new THREE.Vector3(moveDirection.x, 0, -moveDirection.y)
      .normalize()
      .applyEuler(camera.rotation)
      .multiplyScalar(0.1);
    camera.position.add(move);
  }  

  renderer.render(scene, camera);
}
update();
