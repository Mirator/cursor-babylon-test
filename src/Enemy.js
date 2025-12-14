// Using global Babylon namespace from CDN
const { MeshBuilder, StandardMaterial, Color3, Vector3 } = BABYLON;
import { Projectile } from './Projectile.js';

class Enemy {
    constructor(scene, position, player) {
        this.scene = scene;
        this.player = player;
        
        // Enemy properties
        this.health = 50;
        this.maxHealth = 50;
        this.speed = 2.0;
        this.isAlive = true;
        
        // AI state
        this.state = 'patrol'; // 'patrol', 'chase', 'attack'
        this.detectionRange = 30.0;
        this.attackRange = 15.0;
        this.patrolRadius = 20.0;
        this.patrolCenter = position.clone();
        this.patrolTarget = null;
        this.lastAttackTime = 0;
        this.attackCooldown = 2.0; // seconds
        
        // Movement
        this.velocity = new Vector3(0, 0, 0);
        this.position = position.clone();
        
        // Create enemy mesh
        this.mesh = MeshBuilder.CreateBox('enemy', { width: 1.5, height: 2, depth: 1.5 }, scene);
        this.mesh.position = this.position.clone();
        
        // Create material
        const material = new StandardMaterial('enemyMaterial', scene);
        material.diffuseColor = new Color3(1, 0.2, 0.2);
        material.emissiveColor = new Color3(0.5, 0, 0);
        this.mesh.material = material;
        
        // Add glow effect
        this.mesh.visibility = 1;
        
        // Projectiles
        this.projectiles = [];
        this.projectileSpeed = 30.0;
        this.damage = 10;
        
        // Initialize patrol target
        this.setNewPatrolTarget();
    }

    setNewPatrolTarget() {
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * this.patrolRadius;
        this.patrolTarget = new Vector3(
            this.patrolCenter.x + Math.cos(angle) * distance,
            this.patrolCenter.y,
            this.patrolCenter.z + Math.sin(angle) * distance
        );
    }

    update(deltaTime) {
        if (!this.isAlive) return;

        const currentTime = Date.now() / 1000;
        const playerPos = this.player.position;
        const distanceToPlayer = Vector3.Distance(this.position, playerPos);

        // Update AI state
        if (distanceToPlayer < this.attackRange && currentTime - this.lastAttackTime >= this.attackCooldown) {
            this.state = 'attack';
        } else if (distanceToPlayer < this.detectionRange) {
            this.state = 'chase';
        } else {
            this.state = 'patrol';
        }

        // Execute AI behavior
        switch (this.state) {
            case 'patrol':
                this.updatePatrol(deltaTime);
                break;
            case 'chase':
                this.updateChase(deltaTime, playerPos);
                break;
            case 'attack':
                this.updateAttack(deltaTime, playerPos);
                break;
        }

        // Update position
        this.position.addInPlace(this.velocity.scale(deltaTime));
        this.mesh.position = this.position.clone();
        
        // Keep enemy on ground
        if (this.position.y < 1) {
            this.position.y = 1;
        }

        // Update projectiles
        this.projectiles.forEach((projectile, index) => {
            projectile.update(deltaTime);
            if (projectile.isDestroyed) {
                this.projectiles.splice(index, 1);
            }
        });
    }

    updatePatrol(deltaTime) {
        if (!this.patrolTarget) {
            this.setNewPatrolTarget();
            return;
        }

        const direction = this.patrolTarget.subtract(this.position);
        const distance = direction.length();

        if (distance < 1.0) {
            // Reached patrol target, set new one
            this.setNewPatrolTarget();
        } else {
            direction.normalize();
            this.velocity.x = direction.x * this.speed * 0.5; // Slower when patrolling
            this.velocity.z = direction.z * this.speed * 0.5;
        }

        this.velocity.y = 0;
    }

    updateChase(deltaTime, playerPos) {
        const direction = playerPos.subtract(this.position);
        direction.y = 0; // Keep on ground level
        const distance = direction.length();

        if (distance > 0.5) {
            direction.normalize();
            this.velocity.x = direction.x * this.speed;
            this.velocity.z = direction.z * this.speed;
        } else {
            this.velocity.x = 0;
            this.velocity.z = 0;
        }

        this.velocity.y = 0;

        // Face player
        if (distance > 0) {
            const lookDirection = direction.normalize();
            const angle = Math.atan2(lookDirection.x, lookDirection.z);
            this.mesh.rotation.y = angle;
        }
    }

    updateAttack(deltaTime, playerPos) {
        // Stop moving
        this.velocity.set(0, 0, 0);

        // Face player
        const direction = playerPos.subtract(this.position);
        direction.y = 0;
        if (direction.length() > 0) {
            direction.normalize();
            const angle = Math.atan2(direction.x, direction.z);
            this.mesh.rotation.y = angle;
        }

        // Shoot at player
        const currentTime = Date.now() / 1000;
        if (currentTime - this.lastAttackTime >= this.attackCooldown) {
            this.shoot(playerPos);
            this.lastAttackTime = currentTime;
        }
    }

    shoot(targetPosition) {
        const direction = targetPosition.subtract(this.position);
        direction.normalize();

        // Start position slightly above enemy center
        const startPosition = this.position.add(new Vector3(0, 1, 0));

        const projectile = new Projectile(
            this.scene,
            startPosition,
            direction,
            this.projectileSpeed,
            this.damage,
            false // Enemy projectile
        );

        this.projectiles.push(projectile);
    }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.die();
        } else {
            // Flash effect when hit
            const material = this.mesh.material;
            const originalEmissive = material.emissiveColor.clone();
            material.emissiveColor = new Color3(1, 1, 1);
            setTimeout(() => {
                if (material) {
                    material.emissiveColor = originalEmissive;
                }
            }, 100);
        }
    }

    die() {
        this.isAlive = false;
        // Destroy projectiles
        this.projectiles.forEach(proj => proj.destroy());
        this.projectiles = [];
        // Remove mesh
        this.mesh.dispose();
    }
}

export { Enemy };

