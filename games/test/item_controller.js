import * as THREE from 'https://esm.sh/three@0.175.0';
import * as CANNON from 'https://cdn.skypack.dev/cannon-es';

export class ItemController {
  constructor(scene, world, radius = 0.3, position = new THREE.Vector3(0, 5, 0), customMesh = null) {
    this.scene = scene;
    this.world = world;
    this.radius = radius;

    // Use the custom mesh if provided, otherwise create a default sphere mesh
    this.mesh = customMesh || new THREE.Mesh(
      new THREE.SphereGeometry(radius, 32, 32),
      new THREE.MeshStandardMaterial({ color: 0xff4444 })
    );

    // Scale the mesh to match the radius
    const scale = (radius) / Math.max(this.mesh.geometry.boundingBox?.max.x || 1, 1);
    this.mesh.scale.set(scale, scale, scale);

    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    this.mesh.userData = { self: this };
    this.scene.add(this.mesh);

    // Physics body remains a sphere
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
    // Sync the custom mesh's position and rotation with the physics body
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