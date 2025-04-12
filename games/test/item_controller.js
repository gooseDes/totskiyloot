import * as THREE from 'https://esm.sh/three@0.175.0';
import * as CANNON from 'https://cdn.skypack.dev/cannon-es';

export class ItemController {
  constructor(scene, world, radius = 0.3, position = new THREE.Vector3(0, 5, 0)) {
    this.scene = scene;
    this.world = world;
    this.radius = radius;

    this.geometry = new THREE.SphereGeometry(radius, 32, 32);
    this.material = new THREE.MeshStandardMaterial({ color: 0xff4444 });
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    this.mesh.userData = { self: this };
    this.scene.add(this.mesh);

    this.sphereBody = new CANNON.Body({
      mass: 1,
      position: new CANNON.Vec3(position.x, position.y, position.z),
      shape: new CANNON.Sphere(radius),
      linearDamping: 0.9,
      angularDamping: 0.9,
    });

    const physicsMaterial = new CANNON.Material('sphereMaterial');
    const contactMaterial = new CANNON.ContactMaterial(physicsMaterial, physicsMaterial, {
      friction: 0.1,
      restitution: 0,
    });
    this.world.addContactMaterial(contactMaterial);
    this.sphereBody.material = physicsMaterial;

    this.world.addBody(this.sphereBody);
    this.lastUpdateTime = performance.now();
  }

  update() {
    this.mesh.position.copy(this.sphereBody.position);
    this.mesh.quaternion.copy(this.sphereBody.quaternion);

    const now = performance.now();
    const dt = (now - this.lastUpdateTime) / 1000;
    this.lastUpdateTime = now;
  }

  remove() {
    this.scene.remove(this.mesh);
    this.world.removeBody(this.sphereBody);
  }

  add() {
    this.scene.add(this.mesh);
    this.world.addBody(this.sphereBody);
  }
}