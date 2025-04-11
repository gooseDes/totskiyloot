import * as THREE from 'https://esm.sh/three@0.175.0';
import * as CANNON from 'https://cdn.skypack.dev/cannon-es';

export class CubeController {
    constructor(scene, world, size, position) {
      this.scene = scene;
      this.world = world;
      
      // Cube Mesh
      this.cubeMesh = new THREE.Mesh(
        new THREE.BoxGeometry(size, size, size),
        new THREE.MeshStandardMaterial({ color: 0x00ff00 })
      );
      this.cubeMesh.position.copy(position);
      this.scene.add(this.cubeMesh);
      
      // Physics Body
      this.cubeBody = new CANNON.Body({
        mass: 1,  // Make the cube have mass so it can interact with other objects
        position: new CANNON.Vec3(position.x, position.y, position.z),
        linearDamping: 0.9,
      });
  
      // Box Collider for Cube
      const cubeShape = new CANNON.Box(new CANNON.Vec3(size / 2, size / 2, size / 2)); // Half-extents for box shape
      this.cubeBody.addShape(cubeShape);
  
      // Add to physics world
      this.world.addBody(this.cubeBody);
  
      this.lastUpdateTime = performance.now();
    }
  
    update() {
      // Step the physics world
      const now = performance.now();
      const dt = (now - this.lastUpdateTime) / 1000;
      this.lastUpdateTime = now;
      this.world.step(1 / 60, dt, 3);  // Update physics simulation
  
      // Sync the mesh position and rotation with the physics body
      const position = this.cubeBody.position;
      const rotation = this.cubeBody.quaternion;
  
      this.cubeMesh.position.set(position.x, position.y, position.z);
      this.cubeMesh.rotation.setFromQuaternion(rotation);

      console.log(this.cubeBody.position);
    }
  
    // Optionally: Add colliders for other objects in the scene
    addCollider(mesh) {
      mesh.updateMatrixWorld(true);
      mesh.traverse((child) => {
        if (child.isMesh && child.geometry) {
          const shape = this.createTrimesh(child.geometry, child);
          if (shape) {
            const body = new CANNON.Body({ mass: 0 });  // Static body (for ground or other static objects)
            body.addShape(shape);
            body.position.set(child.position.x, child.position.y, child.position.z);
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
  