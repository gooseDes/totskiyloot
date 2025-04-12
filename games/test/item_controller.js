import * as THREE from 'https://esm.sh/three@0.175.0';
import * as CANNON from 'https://cdn.skypack.dev/cannon-es';

export class ItemController {
  constructor(scene, world, radius = 0.3, position = new THREE.Vector3(0, 5, 0)) {
    this.scene = scene;
    this.world = world;
    this.radius = radius;

    this.geometry = new THREE.SphereGeometry(radius, 32, 32);
    this.material = new THREE.MeshStandardMaterial({ color: 0xff4444 });
    this.sphere = new THREE.Mesh(this.geometry, this.material);
    this.sphere.castShadow = true;
    this.sphere.receiveShadow = true;
    this.sphere.userData = { self: this };
    this.scene.add(this.sphere);

    this.sphereBody = new CANNON.Body({
      mass: 1,
      position: new CANNON.Vec3(position.x, position.y, position.z),
      shape: new CANNON.Sphere(radius),
      linearDamping: 0.9,
      angularDamping: 0.9,
    });

    this.world.addBody(this.sphereBody);
    this.lastUpdateTime = performance.now();
  }

  update() {
    this.sphere.position.copy(this.sphereBody.position);
    this.sphere.quaternion.copy(this.sphereBody.quaternion);

    const now = performance.now();
    const dt = (now - this.lastUpdateTime) / 1000;
    this.lastUpdateTime = now;
  }
}