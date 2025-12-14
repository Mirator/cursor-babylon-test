// Using global Babylon namespace from CDN
const { MeshBuilder, StandardMaterial, Color3, Vector3 } = BABYLON;

class Projectile {
    constructor(scene, position, direction, speed, damage, isPlayerProjectile = true) {
        this.scene = scene;
        this.position = position.clone();
        this.direction = direction.normalize();
        this.speed = speed;
        this.damage = damage;
        this.isPlayerProjectile = isPlayerProjectile;
        this.lifetime = 5.0; // seconds
        this.age = 0;
        this.isDestroyed = false;

        // Create projectile mesh
        this.mesh = MeshBuilder.CreateSphere('projectile', { diameter: 0.3 }, scene);
        this.mesh.position = this.position.clone();

        // Create material
        const material = new StandardMaterial('projectileMaterial', scene);
        if (isPlayerProjectile) {
            material.emissiveColor = new Color3(0, 1, 1); // Cyan for player
            material.diffuseColor = new Color3(0, 0.8, 1);
        } else {
            material.emissiveColor = new Color3(1, 0, 0); // Red for enemy
            material.diffuseColor = new Color3(1, 0.2, 0.2);
        }
        this.mesh.material = material;

        // Add glow effect
        this.mesh.visibility = 1;
        
        // Add rotation animation
        this.mesh.rotation.x = Math.random() * Math.PI * 2;
        this.mesh.rotation.y = Math.random() * Math.PI * 2;
        this.mesh.rotation.z = Math.random() * Math.PI * 2;
    }

    update(deltaTime) {
        if (this.isDestroyed) return;

        this.age += deltaTime;

        // Check lifetime
        if (this.age >= this.lifetime) {
            this.destroy();
            return;
        }

        // Update position
        const movement = this.direction.scale(this.speed * deltaTime);
        this.position.addInPlace(movement);
        this.mesh.position = this.position.clone();
        
        // Rotate projectile for visual effect
        this.mesh.rotation.x += deltaTime * 10;
        this.mesh.rotation.y += deltaTime * 10;

        // Check bounds (destroy if too far)
        if (this.position.length() > 200) {
            this.destroy();
        }
    }

    destroy() {
        if (this.isDestroyed) return;
        this.isDestroyed = true;
        this.mesh.dispose();
    }
}

export { Projectile };

