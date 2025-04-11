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

    this.keyState = { keyw: false, keya: false, keys: false, keyd: false, space: false };
    this.jumpState = false;

    this.yaw = 0;
    this.pitch = 0;

    this.isTouchDevice = 'ontouchstart' in window;
    this.moveSpeed = 5;

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
      if (k.toLocaleLowerCase() in this.keyState) this.keyState[k.toLowerCase()] = true;
    });

    window.addEventListener('keyup', (e) => {
      const k = e.code;
      if (k.toLocaleLowerCase() in this.keyState) this.keyState[k.toLowerCase()] = false;
      if (k === 'Space') this.jumpState = false;
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

  isGrounded() {
    const from = this.playerBody.position.clone(); // Player position
    const to = new CANNON.Vec3(from.x, from.y - 10, from.z); // 1.1 units down to check below player
    
    const ray = new CANNON.Ray(from, to); // Create the ray from player position to just below the player
    const result = new CANNON.RaycastResult(); // The result object to store intersection data
  
    // Raycasting to the world
    ray.intersectWorld(this.world, result); // This will populate the result object

    console.log(result.hasHit);
  
    // If we hit something, and it's not the player's body, then we consider the player grounded
    if (result.hasHit && result.body !== this.playerBody) {
      return true; // Player is grounded
    }
  
    return false; // No ground hit
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

    this.camera.position.copy(this.playerBody.position);
    this.flashlight.position.copy(this.playerBody.position);
    this.flashlight.target.position.copy(
      this.camera.getWorldDirection(new THREE.Vector3()).add(this.playerBody.position)
    );

    if (this.keyState.space) this.jump();
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

  addCollider(mesh) {
    mesh.updateMatrixWorld(true);
    mesh.traverse((child) => {
      if (child.isMesh && child.geometry) {
        const shape = this.createTrimesh(child.geometry, child);
        if (shape) {
          const body = new CANNON.Body({ mass: 0 });
          body.addShape(shape);
          body.position.set(0, 0, 0);
          this.world.addBody(body);
        }
      }
    });
  }

  createTrimesh(geometry, mesh) {
    if (!geometry.attributes.position) return null;

    const cloned = geometry.clone();
    cloned.applyMatrix4(mesh.matrixWorld);

    const pos = cloned.attributes.position.array;
    const idx = cloned.index ? cloned.index.array : this.generateIndex(cloned);

    return new CANNON.Trimesh(pos, idx);
  }

  generateIndex(geometry) {
    const count = geometry.attributes.position.count;
    const index = new Uint16Array(count);
    for (let i = 0; i < count; i++) index[i] = i;
    return index;
  }
}
