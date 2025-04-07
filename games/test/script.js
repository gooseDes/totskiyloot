const THREE = await import('https://esm.sh/three@0.175.0');
const { GLTFLoader } = await import('https://esm.sh/three@0.175.0/examples/jsm/loaders/GLTFLoader.js');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x222244);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;
let player_speed_y = 0;
const jumpForce = 0.2;

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const loader = new GLTFLoader();
var car = null;

loader.load('models/menu_scene.glb', (gltf) => {
  gltf.scene.position.set(0, -2, 0)
  scene.add(gltf.scene);
});

const ambientLight = new THREE.AmbientLight(0xffffff, 0.1);
scene.add(ambientLight);

const pointLight = new THREE.SpotLight(0xffffff, 10, 1000, Math.PI / 4, 0.1, 2);
pointLight.target.position.set(0, 0, -1);
scene.add(pointLight);
scene.add(pointLight.target)

const joystickZone = document.getElementById('joystick-zone');
const jumpButton = document.getElementById('jump-button');
let joystick;
let moveDirection = { x: 0, y: 0 };
let isTouching = false;
let touchStartX = 0, touchStartY = 0;

let keyState = { w: false, a: false, s: false, d: false, space: false };
let jumpState = false;

const rotationQuaternion = new THREE.Quaternion();
let yaw = 0;
let pitch = 0;

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

function enableMobileControls() {
  console.log("📱 Mobile controls enabled");

  joystick = nipplejs.create({
    zone: joystickZone,
    mode: 'static',
    position: { left: '2svh', bottom: '2svh' },
    color: 'white',
    multitouch: true,
    restOpacity: 0.5
  });

  jumpButton.style.visibility = 'visible';

  jumpButton.addEventListener('click', function() {
    player_speed_y = jumpForce;
  });

  let isJoystickActive = false;

  joystick.on('start', (evt, data) => {
    isJoystickActive = true;
  });

  joystick.on('move', (evt, data) => {
    const angle = data.angle.degree;
    const force = data.force;
    const rad = angle * (Math.PI / 180);

    const moveX = Math.cos(rad) * force;
    const moveY = Math.sin(rad) * force;

    moveDirection.x = moveX;
    moveDirection.y = moveY;

  });

  joystick.on('end', () => {
    isJoystickActive = false;
    moveDirection.x = 0;
    moveDirection.y = 0;
  });

  window.addEventListener('touchstart', handleTouchStart);
  window.addEventListener('touchmove', handleTouchMove);
  window.addEventListener('touchend', (e) => { 
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === lookTouchId) {
        lookTouchId = null;
      }
    }
  });
}


let lookTouchId = null;
let lastLookX = 0;
let lastLookY = 0;

function handleTouchStart(e) {
  for (let i = 0; i < e.touches.length; i++) {
    const touch = e.touches[i];
    if (!joystickZone.contains(touch.target) && !jumpButton.contains(touch.target)) {
      lookTouchId = touch.identifier;
      lastLookX = touch.clientX;
      lastLookY = touch.clientY;
    }
  }
}


function handleTouchMove(e) {
  for (let i = 0; i < e.touches.length; i++) {
    const touch = e.touches[i];

    if (touch.identifier === lookTouchId) {
      const deltaX = touch.clientX - lastLookX;
      const deltaY = touch.clientY - lastLookY;

      const sensitivity = 0.005;
      yaw -= deltaX * sensitivity;
      pitch -= deltaY * sensitivity;

      const maxPitch = Math.PI / 2 - 0.1;
      const minPitch = -Math.PI / 2 + 0.1;
      pitch = Math.max(minPitch, Math.min(maxPitch, pitch));

      const quaternion = new THREE.Quaternion();
      quaternion.setFromEuler(new THREE.Euler(pitch, yaw, 0, 'YXZ'));
      camera.quaternion.copy(quaternion);

      lastLookX = touch.clientX;
      lastLookY = touch.clientY;
    }
  }
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
    yaw -= event.movementX * sensitivity;
    pitch -= event.movementY * sensitivity;

    const maxPitch = Math.PI / 2 - 0.1;
    const minPitch = -Math.PI / 2 + 0.1;
    pitch = Math.max(minPitch, Math.min(maxPitch, pitch));

    const quaternion = new THREE.Quaternion();
    quaternion.setFromEuler(new THREE.Euler(pitch, yaw, 0, 'YXZ'));

    camera.quaternion.copy(quaternion);
  }

  window.addEventListener('keydown', (e) => {
    switch (e.code) {
      case 'KeyW': keyState.w = true; break;
      case 'KeyA': keyState.a = true; break;
      case 'KeyS': keyState.s = true; break;
      case 'KeyD': keyState.d = true; break;
      case 'Space': keyState.space = true; break;
      default: break;
    }
  });

  window.addEventListener('keyup', (e) => {
    switch (e.code) {
      case 'KeyW': keyState.w = false; break;
      case 'KeyA': keyState.a = false; break;
      case 'KeyS': keyState.s = false; break;
      case 'KeyD': keyState.d = false; break;
      case 'Space': keyState.space = false; jumpState = false; break;
      default: break;
    }
  });
}

const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
if (isTouchDevice) {
  enableMobileControls();
} else {
  enableDesktopControls();
}

function update() {
  requestAnimationFrame(update);

  player_speed_y -= 0.0098;

  camera.position.y += player_speed_y;
  pointLight.position.copy(camera.position);
  pointLight.target.position.copy(camera.getWorldDirection(new THREE.Vector3()).add(camera.position));  
    
  if (camera.position.y <= 0) {
    player_speed_y = 0;
    camera.position.y = 0;
  }

  if (!isTouchDevice) {
    const moveSpeed = 0.1;

    if (keyState.w) {
      camera.position.x -= Math.sin(yaw) * moveSpeed;
      camera.position.z -= Math.cos(yaw) * moveSpeed;
    }
    if (keyState.s) {
      camera.position.x += Math.sin(yaw) * moveSpeed;
      camera.position.z += Math.cos(yaw) * moveSpeed;
    }
    if (keyState.a) {
      camera.position.x -= Math.cos(yaw) * moveSpeed;
      camera.position.z += Math.sin(yaw) * moveSpeed;
    }
    if (keyState.d) {
      camera.position.x += Math.cos(yaw) * moveSpeed;
      camera.position.z -= Math.sin(yaw) * moveSpeed;
    }
    if (keyState.space && !jumpState) {
      jumpState = true;
      player_speed_y = jumpForce;
    }
  }

  if (isTouchDevice && (moveDirection.x !== 0 || moveDirection.y !== 0)) {
    const move = new THREE.Vector3(moveDirection.x, 0, -moveDirection.y)
      .normalize()
      .applyEuler(new THREE.Euler(0, yaw, 0))
      .multiplyScalar(0.1);
    camera.position.add(move);
  }

  renderer.render(scene, camera);
}
update();
