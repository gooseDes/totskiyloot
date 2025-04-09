const THREE = await import('https://esm.sh/three@0.175.0');

export class PlayerController {
  constructor(camera, flashlight, scene, renderer, collisionMeshes = []) {
    this.camera = camera;
    this.flashlight = flashlight;
    this.scene = scene;
    this.renderer = renderer;
    this.collisionMeshes = collisionMeshes;

    this.joystickZone = document.getElementById('joystick-zone');
    this.jumpButton = document.getElementById('jump-button');
    this.joystick = null;
    this.moveDirection = { x: 0, y: 0 };

    this.keyState = { w: false, a: false, s: false, d: false, space: false };
    this.jumpState = false;

    this.rotationQuaternion = new THREE.Quaternion();
    this.yaw = 0;
    this.pitch = 0;
    this.isJoystickActive = false;

    this.lookTouchId = null;
    this.lastLookX = 0;
    this.lastLookY = 0;

    this.jumpForce = 0.2;
    this.speed_y = 0;

    this.isTouchDevice = 'ontouchstart' in window;

    this.raycaster = new THREE.Raycaster();
    this.collisionDistance = 0.5;

    this.start();

    window.addEventListener('keydown', (e) => {
      switch (e.code) {
        case 'KeyW': this.keyState.w = true; break;
        case 'KeyA': this.keyState.a = true; break;
        case 'KeyS': this.keyState.s = true; break;
        case 'KeyD': this.keyState.d = true; break;
        case 'Space': this.keyState.space = true; break;
      }
    });

    window.addEventListener('keyup', (e) => {
      switch (e.code) {
        case 'KeyW': this.keyState.w = false; break;
        case 'KeyA': this.keyState.a = false; break;
        case 'KeyS': this.keyState.s = false; break;
        case 'KeyD': this.keyState.d = false; break;
        case 'Space': this.keyState.space = false; this.jumpState = false; break;
      }
    });
  }

  raycastCollisionCheck(direction) {
    this.raycaster.set(this.camera.position, direction.clone().normalize());
    const intersects = this.raycaster.intersectObjects(this.collisionMeshes, true);
    if (intersects.length > 0 && intersects[0].distance < this.collisionDistance) {
      return true;
    }
    return false;
  }

  tryMove(directionVec) {
    const dir = directionVec.clone();
    if (!this.raycastCollisionCheck(dir)) {
      this.camera.position.add(dir);
    }
  }

  enableMobileControls() {
    console.log("📱 Mobile controls enabled");

    this.joystick = nipplejs.create({
      zone: this.joystickZone,
      mode: 'static',
      position: { left: '2svh', bottom: '2svh' },
      color: 'white',
      multitouch: true,
      restOpacity: 0.5
    });

    this.jumpButton.style.visibility = 'visible';

    this.jumpButton.addEventListener('click', () => {
      this.speed_y = this.jumpForce;
    });

    this.joystick.on('start', () => {
      this.isJoystickActive = true;
    });

    this.joystick.on('move', (evt, data) => {
      const angle = data.angle.degree;
      const force = data.force;
      const rad = angle * (Math.PI / 180);

      const moveX = Math.cos(rad) * force;
      const moveY = Math.sin(rad) * force;

      this.moveDirection.x = moveX;
      this.moveDirection.y = moveY;
    });

    this.joystick.on('end', () => {
      this.isJoystickActive = false;
      this.moveDirection.x = 0;
      this.moveDirection.y = 0;
    });

    window.addEventListener('touchstart', this.handleTouchStart);
    window.addEventListener('touchmove', this.handleTouchMove);
    window.addEventListener('touchend', (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === this.lookTouchId) {
          this.lookTouchId = null;
        }
      }
    });
  }

  enableDesktopControls() {
    console.log("💻 Desktop controls enabled");

    const canvas = this.renderer.domElement;

    canvas.addEventListener('click', () => {
      canvas.requestPointerLock();
    });

    document.addEventListener('pointerlockchange', () => {
      if (document.pointerLockElement === canvas) {
        document.addEventListener('mousemove', this.handleMouseMove);
      } else {
        document.removeEventListener('mousemove', this.handleMouseMove);
      }
    });
  }

  handleTouchStart = (e) => {
    for (let i = 0; i < e.touches.length; i++) {
      const touch = e.touches[i];
      if (!this.joystickZone.contains(touch.target) && !this.jumpButton.contains(touch.target)) {
        this.lookTouchId = touch.identifier;
        this.lastLookX = touch.clientX;
        this.lastLookY = touch.clientY;
      }
    }
  };

  handleTouchMove = (e) => {
    for (let i = 0; i < e.touches.length; i++) {
      const touch = e.touches[i];
      if (touch.identifier === this.lookTouchId) {
        const deltaX = touch.clientX - this.lastLookX;
        const deltaY = touch.clientY - this.lastLookY;

        const sensitivity = 0.005;
        this.yaw -= deltaX * sensitivity;
        this.pitch -= deltaY * sensitivity;

        const maxPitch = Math.PI / 2 - 0.1;
        const minPitch = -Math.PI / 2 + 0.1;
        this.pitch = Math.max(minPitch, Math.min(maxPitch, this.pitch));

        const quaternion = new THREE.Quaternion();
        quaternion.setFromEuler(new THREE.Euler(this.pitch, this.yaw, 0, 'YXZ'));
        this.camera.quaternion.copy(quaternion);

        this.lastLookX = touch.clientX;
        this.lastLookY = touch.clientY;
      }
    }
  };

  handleMouseMove = (event) => {
    const sensitivity = 0.002;
    this.yaw -= event.movementX * sensitivity;
    this.pitch -= event.movementY * sensitivity;

    const maxPitch = Math.PI / 2 - 0.1;
    const minPitch = -Math.PI / 2 + 0.1;
    this.pitch = Math.max(minPitch, Math.min(maxPitch, this.pitch));

    const quaternion = new THREE.Quaternion();
    quaternion.setFromEuler(new THREE.Euler(this.pitch, this.yaw, 0, 'YXZ'));
    this.camera.quaternion.copy(quaternion);
  };

  update() {
    this.speed_y -= 0.0098;

    this.camera.position.y += this.speed_y;
    this.flashlight.position.copy(this.camera.position);
    this.flashlight.target.position.copy(this.camera.getWorldDirection(new THREE.Vector3()).add(this.camera.position));

    if (this.camera.position.y <= 0) {
      this.speed_y = 0;
      this.camera.position.y = 0;
    }

    const moveSpeed = 0.1;

    if (!this.isTouchDevice) {
      if (this.keyState.w) {
        const dir = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw)).multiplyScalar(moveSpeed);
        this.tryMove(dir);
      }
      if (this.keyState.s) {
        const dir = new THREE.Vector3(Math.sin(this.yaw), 0, Math.cos(this.yaw)).multiplyScalar(moveSpeed);
        this.tryMove(dir);
      }
      if (this.keyState.a) {
        const dir = new THREE.Vector3(-Math.cos(this.yaw), 0, Math.sin(this.yaw)).multiplyScalar(moveSpeed);
        this.tryMove(dir);
      }
      if (this.keyState.d) {
        const dir = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw)).multiplyScalar(moveSpeed);
        this.tryMove(dir);
      }
      if (this.keyState.space && !this.jumpState) {
        this.jumpState = true;
        this.speed_y = this.jumpForce;
      }
    }

    if (this.isTouchDevice && (this.moveDirection.x !== 0 || this.moveDirection.y !== 0)) {
      const move = new THREE.Vector3(this.moveDirection.x, 0, -this.moveDirection.y)
        .normalize()
        .applyEuler(new THREE.Euler(0, this.yaw, 0))
        .multiplyScalar(0.1);
      this.tryMove(move);
    }
  }

  start() {
    if (this.isTouchDevice) {
      this.enableMobileControls();
    } else {
      this.enableDesktopControls();
    }
  }
}
