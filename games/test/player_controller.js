const THREE = await import('https://esm.sh/three@0.175.0');
import * as CANNON from 'https://cdn.skypack.dev/cannon-es';
import { ItemController } from './item_controller.js';

export class PlayerController {
  constructor(camera, flashlight, scene, renderer, world) {
    this.camera = camera;
    this.flashlight = flashlight;
    this.scene = scene;
    this.renderer = renderer;
    this.world = world;

    this.joystickZone = document.getElementById('joystick-zone');
    this.jumpButton = document.getElementById('jump-button');
    this.joystick = null;
    this.moveDirection = { x: 0, y: 0 };

    this.keyState = { keyw: false, keya: false, keys: false, keyd: false, space: false };
    this.jumpState = false;

    this.yaw = 0;
    this.pitch = 0;

    this.isTouchDevice = 'ontouchstart' in window;
    this.moveSpeed = 5;

    this.lastTouchX = null;
    this.lastTouchY = null;
    this.isLooking = false;

    const radius = 0.3, height = 1.4;
    const sphereShape = new CANNON.Sphere(radius);
    const cylinderShape = new CANNON.Cylinder(radius, radius, height - 2 * radius, 8);

    this.playerBody = new CANNON.Body({
      mass: 3,
      fixedRotation: true,
      linearDamping: 0.9
    });

    this.playerBody.addShape(sphereShape, new CANNON.Vec3(0, height / 2 - radius, 0));
    this.playerBody.addShape(cylinderShape);
    this.playerBody.addShape(sphereShape, new CANNON.Vec3(0, -height / 2 + radius, 0));

    this.playerBody.position.set(0, 5, 0);
    this.world.addBody(this.playerBody);

    this.isOnGround = false;

    const sensorRadius = 0.05;
    this.groundSensor = new CANNON.Body({
      mass: 0,
      type: CANNON.Body.STATIC,
      collisionResponse: false,
      collisionFilterGroup: 1,
      collisionFilterMask: 1
    });
    this.groundSensor.addShape(new CANNON.Sphere(sensorRadius));
    this.world.addBody(this.groundSensor);

    this.world.addEventListener('beginContact', (e) => {
      const { bodyA, bodyB } = e;
      if ((bodyA === this.groundSensor && bodyB !== this.playerBody) ||
          (bodyB === this.groundSensor && bodyA !== this.playerBody)) {
        this.isOnGround = true;
      }
    });

    this.world.addEventListener('endContact', (e) => {
      const { bodyA, bodyB } = e;
      if ((bodyA === this.groundSensor && bodyB !== this.playerBody) ||
          (bodyB === this.groundSensor && bodyA !== this.playerBody)) {
        this.isOnGround = false;
      }
    });

    this.inventory = [];

    this.lastUpdateTime = performance.now();
    this.start();
    this.setupControls();
  }

  setupControls() {
    window.addEventListener('keydown', (e) => {
      const k = e.code;
      if (k.toLocaleLowerCase() in this.keyState) this.keyState[k.toLowerCase()] = true;
      if (k == 'KeyE') this.tryPickUpItem();
      if (k == 'KeyF' && this.inventory.length > 0) {
        const item = this.inventory[0];
        item.add();
        item.sphereBody.position.copy(this.playerBody.position);
        const throwDir = new THREE.Vector3();
        this.camera.getWorldDirection(throwDir);
        throwDir.normalize().multiplyScalar(50);
        throwDir.y += 10;
        item.sphereBody.velocity.set(throwDir.x, throwDir.y, throwDir.z);
        this.inventory.shift();
      }
    });

    window.addEventListener('keyup', (e) => {
      const k = e.code;
      if (k.toLocaleLowerCase() in this.keyState) this.keyState[k.toLowerCase()] = false;
      if (k === 'Space') this.jumpState = false;
    });
  }

  setupTouchLookControls() {
    window.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1 && !this.joystickZone.contains(e.touches[0].target)) {
        const touch = e.touches[0];
        this.lastTouchX = touch.clientX;
        this.lastTouchY = touch.clientY;
        this.isLooking = true;
      }
    });

    window.addEventListener('touchmove', (e) => {
      if (this.isLooking && e.touches.length === 1) {
        const touch = e.touches[0];
        const dx = touch.clientX - this.lastTouchX;
        const dy = touch.clientY - this.lastTouchY;

        const sens = 0.002;
        this.yaw -= dx * sens;
        this.pitch = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, this.pitch - dy * sens));
        this.updateCameraRotation();

        this.lastTouchX = touch.clientX;
        this.lastTouchY = touch.clientY;
      }
    });

    window.addEventListener('touchend', () => {
      this.isLooking = false;
    });
  }

  enableMobileControls() {
    console.log('Mobile controls enabled');
    this.joystick = nipplejs.create({
      zone: this.joystickZone,
      mode: 'static',
      position: { left: '2svh', bottom: '2svh' },
      color: 'white'
    });

    this.jumpButton.style.visibility = 'visible';
    this.jumpButton.addEventListener('click', () => {
      this.jump();
    });

    this.joystick.on('move', (evt, data) => {
      const rad = data.angle.radian;
      const force = data.force;
      this.moveDirection.x = Math.cos(rad) * force;
      this.moveDirection.y = Math.sin(rad) * force;
    });

    this.joystick.on('end', () => {
      this.moveDirection.x = 0;
      this.moveDirection.y = 0;
    });

    this.setupTouchLookControls();
  }

  enableDesktopControls() {
    console.log('Desktop controls enabled');
    const canvas = this.renderer.domElement;
    canvas.addEventListener('click', () => canvas.requestPointerLock());

    document.addEventListener('pointerlockchange', () => {
      if (document.pointerLockElement === canvas)
        document.addEventListener('mousemove', this.handleMouseMove);
      else
        document.removeEventListener('mousemove', this.handleMouseMove);
    });
  }

  handleMouseMove = (e) => {
    const sens = 0.002;
    this.yaw -= e.movementX * sens;
    this.pitch = Math.max(-Math.PI/2+0.1, Math.min(Math.PI/2-0.1, this.pitch - e.movementY * sens));
    this.updateCameraRotation();
  };

  updateCameraRotation() {
    const quat = new THREE.Quaternion().setFromEuler(new THREE.Euler(this.pitch, this.yaw, 0, 'YXZ'));
    this.camera.quaternion.copy(quat);
  }

  jump() {
    this.playerBody.velocity.y = 5;
    this.jumpState = true;
  }

  tryPickUpItem() {
    const raycaster = new THREE.Raycaster();
    const cameraDirection = this.camera.getWorldDirection(new THREE.Vector3());
    raycaster.set(this.camera.position, cameraDirection);

    const intersects = raycaster.intersectObjects(this.scene.children, true);

    if (intersects.length > 0) {
      const item = intersects[0].object;
      if (item.userData && item.userData.self instanceof ItemController) {
        console.log('Picked up item:', item.userData.self);
        item.userData.self.remove();
        this.inventory.push(item.userData.self);
      }
    }
  }

  update() {
    const now = performance.now();
    const dt = (now - this.lastUpdateTime) / 1000;
    this.lastUpdateTime = now;

    const input = this.getInputDirection();

    if (input.lengthSq() > 0) {
      const cameraYawQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
      input.applyQuaternion(cameraYawQuat).normalize();

      this.playerBody.position.x += input.x * this.moveSpeed * dt;
      this.playerBody.position.z += input.z * this.moveSpeed * dt;
    }

    this.groundSensor.position.set(
      this.playerBody.position.x,
      this.playerBody.position.y - 0.75,
      this.playerBody.position.z
    );

    if (this.keyState.space && this.isOnGround) {
      this.jump();
    }

    this.camera.position.copy(this.playerBody.position);
    this.flashlight.position.copy(this.playerBody.position);
    this.flashlight.target.position.copy(
      this.camera.getWorldDirection(new THREE.Vector3()).add(this.playerBody.position)
    );

    if (this.keyState.space) {
      console.log(this.camera.position);
    }
  }

  getInputDirection() {
    const dir = new THREE.Vector3();

    if (!this.isTouchDevice) {
      if (this.keyState.keyw) dir.z -= 1;
      if (this.keyState.keys) dir.z += 1;
      if (this.keyState.keya) dir.x -= 1;
      if (this.keyState.keyd) dir.x += 1;
    } else {
      dir.set(this.moveDirection.x, 0, -this.moveDirection.y);
    }

    return dir;
  }

  start() {
    if (this.isTouchDevice) this.enableMobileControls();
    else this.enableDesktopControls();
  }
}
