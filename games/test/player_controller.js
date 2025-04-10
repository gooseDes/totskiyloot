const THREE = await import('https://esm.sh/three@0.175.0');
import * as CANNON from 'https://cdn.skypack.dev/cannon-es';

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

    this.keyState = { w: false, a: false, s: false, d: false, space: false };
    this.jumpState = false;

    this.yaw = 0;
    this.pitch = 0;

    this.lookTouchId = null;
    this.lastLookX = 0;
    this.lastLookY = 0;

    this.jumpImpulse = 5;
    this.moveSpeed = 5;
    this.isTouchDevice = 'ontouchstart' in window;

    const radius = 0.3, height = 1.4;
    const sphereShape = new CANNON.Sphere(radius);
    const cylinderShape = new CANNON.Cylinder(radius, radius, height - 2 * radius, 8);

    this.playerBody = new CANNON.Body({
      mass: 1,
      fixedRotation: true,
      linearDamping: 0.9
    });

    this.playerBody.addShape(sphereShape, new CANNON.Vec3(0, height / 2 - radius, 0));
    this.playerBody.addShape(cylinderShape);
    this.playerBody.addShape(sphereShape, new CANNON.Vec3(0, -height / 2 + radius, 0));

    this.playerBody.position.set(0, 5, 0);
    this.world.addBody(this.playerBody);

    this.lastUpdateTime = performance.now();
    this.start();
    this.setupControls();
  }

  setupControls() {
    window.addEventListener('keydown', (e) => {
      const k = e.code;
      if (k in this.keyState) this.keyState[k.toLowerCase()] = true;
    });

    window.addEventListener('keyup', (e) => {
      const k = e.code;
      if (k in this.keyState) this.keyState[k.toLowerCase()] = false;
      if (k === 'Space') this.jumpState = false;
    });
  }

  enableMobileControls() {
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

    window.addEventListener('touchstart', this.handleTouchStart);
    window.addEventListener('touchmove', this.handleTouchMove);
    window.addEventListener('touchend', (e) => {
      for (let t of e.changedTouches) {
        if (t.identifier === this.lookTouchId) this.lookTouchId = null;
      }
    });
  }

  enableDesktopControls() {
    const canvas = this.renderer.domElement;
    canvas.addEventListener('click', () => canvas.requestPointerLock());

    document.addEventListener('pointerlockchange', () => {
      if (document.pointerLockElement === canvas)
        document.addEventListener('mousemove', this.handleMouseMove);
      else
        document.removeEventListener('mousemove', this.handleMouseMove);
    });
  }

  handleTouchStart = (e) => {
    for (let t of e.touches) {
      if (!this.joystickZone.contains(t.target) && !this.jumpButton.contains(t.target)) {
        this.lookTouchId = t.identifier;
        this.lastLookX = t.clientX;
        this.lastLookY = t.clientY;
      }
    }
  };

  handleTouchMove = (e) => {
    for (let t of e.touches) {
      if (t.identifier === this.lookTouchId) {
        const dx = t.clientX - this.lastLookX;
        const dy = t.clientY - this.lastLookY;
        const sens = 0.005;
        this.yaw -= dx * sens;
        this.pitch = Math.max(-Math.PI/2+0.1, Math.min(Math.PI/2-0.1, this.pitch - dy * sens));
        this.lastLookX = t.clientX;
        this.lastLookY = t.clientY;
        this.updateCameraRotation();
      }
    }
  };

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
    if (this.isGrounded()) {
      this.playerBody.velocity.y = this.jumpImpulse;
      this.jumpState = true;
    }
  }

  isGrounded() {
    const ray = new CANNON.Ray();
    const from = this.playerBody.position.clone();
    const to = from.clone();
    to.y -= 1.0;
    ray.from.copy(from);
    ray.to.copy(to);
    const result = new CANNON.RaycastResult();
    ray.intersectWorld(this.world, { collisionFilterMask: -1, skipBackfaces: true }, result);
    return result.hasHit;
  }

  update() {
    const now = performance.now();
    const dt = (now - this.lastUpdateTime) / 1000;
    this.lastUpdateTime = now;

    const velocity = new CANNON.Vec3();
    const dir = new THREE.Vector3();

    if (!this.isTouchDevice) {
      if (this.keyState.w) dir.z -= 1;
      if (this.keyState.s) dir.z += 1;
      if (this.keyState.a) dir.x -= 1;
      if (this.keyState.d) dir.x += 1;

      dir.normalize().applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
      velocity.x = dir.x * this.moveSpeed;
      velocity.z = dir.z * this.moveSpeed;

      if (this.keyState.space) this.jump();
    } else {
      const move = new THREE.Vector3(this.moveDirection.x, 0, -this.moveDirection.y)
        .normalize().applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
      velocity.x = move.x * this.moveSpeed;
      velocity.z = move.z * this.moveSpeed;
    }

    this.playerBody.velocity.x = velocity.x;
    this.playerBody.velocity.z = velocity.z;

    this.camera.position.copy(this.playerBody.position);
    this.flashlight.position.copy(this.playerBody.position);
    this.flashlight.target.position.copy(
      this.camera.getWorldDirection(new THREE.Vector3()).add(this.playerBody.position)
    );
  }

  start() {
    if (this.isTouchDevice) this.enableMobileControls();
    else this.enableDesktopControls();
  }

  addCollider(mesh) {
    mesh.traverse((child) => {
      if (child.isMesh) {
        const shape = this.createTrimesh(child.geometry);
        if (shape) {
          const body = new CANNON.Body({ mass: 0 });
          body.addShape(shape);
          body.position.copy(child.getWorldPosition(new THREE.Vector3()));
          this.world.addBody(body);
        }
      }
    });
  }

  createTrimesh(geometry) {
    if (!geometry.attributes.position) return null;
    const pos = geometry.attributes.position.array;
    const idx = geometry.index ? geometry.index.array : null;
    return new CANNON.Trimesh(pos, idx);
  }
}
