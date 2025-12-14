// Using global Babylon namespace from CDN
const { MeshBuilder, StandardMaterial, Color3, Vector3, TransformNode } = BABYLON;
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
        
        // Animation state
        this.animationTime = 0;
        this.isMoving = false;
        
        // Create enemy stick figure
        const stickFigureData = this.createStickFigure(scene);
        this.mesh = stickFigureData.root;
        this.bodyParts = stickFigureData.parts;
        this.mesh.position = this.position.clone();
        
        // Projectiles
        this.projectiles = [];
        this.projectileSpeed = 30.0;
        this.damage = 10;
        
        // Initialize patrol target
        this.setNewPatrolTarget();
    }

    createStickFigure(scene) {
        // Create root node to hold all parts
        const root = new TransformNode('enemyStickFigure', scene);
        
        // Create material (red for enemy)
        const material = new StandardMaterial('enemyStickMaterial', scene);
        material.diffuseColor = new Color3(1, 0.2, 0.2);
        material.emissiveColor = new Color3(0.5, 0, 0);
        
        // Head (sphere)
        const head = MeshBuilder.CreateSphere('enemyHead', { diameter: 0.35 }, scene);
        head.position.y = 1.0; // Position above torso
        head.material = material;
        head.parent = root;
        
        // Torso (cylinder)
        const torso = MeshBuilder.CreateCylinder('enemyTorso', { 
            height: 1.0, 
            diameter: 0.15 
        }, scene);
        torso.position.y = 0.5; // Center of torso
        torso.material = material;
        torso.parent = root;
        
        // Left arm
        const leftArm = MeshBuilder.CreateCylinder('enemyLeftArm', { 
            height: 0.6, 
            diameter: 0.1 
        }, scene);
        leftArm.position.x = -0.3;
        leftArm.position.y = 0.7;
        leftArm.rotation.z = Math.PI / 2; // Rotate to horizontal
        leftArm.material = material;
        leftArm.parent = root;
        
        // Right arm
        const rightArm = MeshBuilder.CreateCylinder('enemyRightArm', { 
            height: 0.6, 
            diameter: 0.1 
        }, scene);
        rightArm.position.x = 0.3;
        rightArm.position.y = 0.7;
        rightArm.rotation.z = Math.PI / 2; // Rotate to horizontal
        rightArm.material = material;
        rightArm.parent = root;
        
        // Create pistol
        const pistol = this.createPistol(scene);
        // Position pistol at the end of the right arm (hand position)
        // Right arm center is at (0.3, 0.7), extends 0.3 units in +x direction
        pistol.position.x = 0.3 + 0.3; // End of right arm (hand position)
        pistol.position.y = 0.7;
        pistol.position.z = 0.02; // Slightly forward
        pistol.rotation.z = Math.PI / 2; // Match arm rotation (horizontal)
        pistol.parent = root;
        
        // Left leg
        const leftLeg = MeshBuilder.CreateCylinder('enemyLeftLeg', { 
            height: 0.8, 
            diameter: 0.12 
        }, scene);
        leftLeg.position.x = -0.15;
        leftLeg.position.y = -0.4;
        leftLeg.material = material;
        leftLeg.parent = root;
        
        // Right leg
        const rightLeg = MeshBuilder.CreateCylinder('enemyRightLeg', { 
            height: 0.8, 
            diameter: 0.12 
        }, scene);
        rightLeg.position.x = 0.15;
        rightLeg.position.y = -0.4;
        rightLeg.material = material;
        rightLeg.parent = root;
        
        // Store references to body parts for animation
        const parts = {
            head: head,
            torso: torso,
            leftArm: leftArm,
            rightArm: rightArm,
            leftLeg: leftLeg,
            rightLeg: rightLeg,
            pistol: pistol
        };
        
        // Store initial positions/rotations for animation
        parts.torsoInitialPos = torso.position.clone();
        parts.headInitialPos = head.position.clone();
        parts.leftArmInitialPos = leftArm.position.clone();
        parts.rightArmInitialPos = rightArm.position.clone();
        parts.leftLegInitialPos = leftLeg.position.clone();
        parts.rightLegInitialPos = rightLeg.position.clone();
        parts.leftArmInitialRot = leftArm.rotation.clone();
        parts.rightArmInitialRot = rightArm.rotation.clone();
        parts.leftLegInitialRot = leftLeg.rotation.clone();
        parts.rightLegInitialRot = rightLeg.rotation.clone();
        
        return { root, parts };
    }

    createPistol(scene) {
        // Create a simple stick-figure style pistol
        const pistolGroup = new TransformNode('enemyPistol', scene);
        
        // Pistol material (dark gray/black)
        const pistolMaterial = new StandardMaterial('pistolMaterial', scene);
        pistolMaterial.diffuseColor = new Color3(0.2, 0.2, 0.2);
        pistolMaterial.emissiveColor = new Color3(0.05, 0.05, 0.05);
        
        // Barrel (main body)
        const barrel = MeshBuilder.CreateBox('pistolBarrel', {
            width: 0.4,
            height: 0.08,
            depth: 0.08
        }, scene);
        barrel.position.x = 0.2; // Extend forward
        barrel.material = pistolMaterial;
        barrel.parent = pistolGroup;
        
        // Grip/handle
        const grip = MeshBuilder.CreateBox('pistolGrip', {
            width: 0.15,
            height: 0.12,
            depth: 0.06
        }, scene);
        grip.position.x = -0.05;
        grip.position.y = -0.08;
        grip.material = pistolMaterial;
        grip.parent = pistolGroup;
        
        // Trigger guard (simple box)
        const triggerGuard = MeshBuilder.CreateBox('pistolTriggerGuard', {
            width: 0.1,
            height: 0.06,
            depth: 0.04
        }, scene);
        triggerGuard.position.x = 0.05;
        triggerGuard.position.y = -0.04;
        triggerGuard.material = pistolMaterial;
        triggerGuard.parent = pistolGroup;
        
        return pistolGroup;
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

        // Check if moving
        const speed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.z * this.velocity.z);
        this.isMoving = speed > 0.1;

        // Update animation
        this.updateAnimation(deltaTime);

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

    updateAnimation(deltaTime) {
        if (!this.bodyParts) return;

        this.animationTime += deltaTime;

        if (this.isMoving) {
            // Walking animation
            const walkSpeed = 8.0; // Animation speed
            const legSwing = 0.4; // Leg swing amplitude
            const armSwing = 0.3; // Arm swing amplitude
            const legLift = 0.15; // Leg lift amount

            // Animate legs (alternating swing)
            const leftLegPhase = Math.sin(this.animationTime * walkSpeed);
            const rightLegPhase = Math.sin(this.animationTime * walkSpeed + Math.PI); // 180 degrees out of phase

            // Left leg
            this.bodyParts.leftLeg.rotation.x = leftLegPhase * legSwing;
            this.bodyParts.leftLeg.position.y = this.bodyParts.leftLegInitialPos.y + Math.max(0, leftLegPhase) * legLift;

            // Right leg
            this.bodyParts.rightLeg.rotation.x = rightLegPhase * legSwing;
            this.bodyParts.rightLeg.position.y = this.bodyParts.rightLegInitialPos.y + Math.max(0, rightLegPhase) * legLift;

            // Animate arms (opposite to legs for natural walking)
            this.bodyParts.leftArm.rotation.z = this.bodyParts.leftArmInitialRot.z + rightLegPhase * armSwing;
            this.bodyParts.rightArm.rotation.z = this.bodyParts.rightArmInitialRot.z + leftLegPhase * armSwing;

            // Update pistol to follow right arm
            if (this.bodyParts.pistol) {
                this.bodyParts.pistol.rotation.z = this.bodyParts.rightArm.rotation.z;
            }

            // Slight torso bob
            this.bodyParts.torso.position.y = this.bodyParts.torsoInitialPos.y + Math.abs(Math.sin(this.animationTime * walkSpeed * 2)) * 0.05;
        } else {
            // Idle animation (subtle breathing/bobbing)
            const idleSpeed = 2.0;
            const idleBob = 0.03;
            const idleSway = 0.05;

            // Gentle torso bob
            this.bodyParts.torso.position.y = this.bodyParts.torsoInitialPos.y + Math.sin(this.animationTime * idleSpeed) * idleBob;

            // Slight head movement
            this.bodyParts.head.position.y = this.bodyParts.headInitialPos.y + Math.sin(this.animationTime * idleSpeed * 0.7) * idleBob * 0.5;

            // Gentle arm sway
            this.bodyParts.leftArm.rotation.z = this.bodyParts.leftArmInitialRot.z + Math.sin(this.animationTime * idleSpeed * 0.5) * idleSway;
            this.bodyParts.rightArm.rotation.z = this.bodyParts.rightArmInitialRot.z - Math.sin(this.animationTime * idleSpeed * 0.5) * idleSway;

            // Update pistol to follow right arm
            if (this.bodyParts.pistol) {
                this.bodyParts.pistol.rotation.z = this.bodyParts.rightArm.rotation.z;
            }

            // Reset legs to initial position
            this.bodyParts.leftLeg.rotation.x = 0;
            this.bodyParts.leftLeg.position.y = this.bodyParts.leftLegInitialPos.y;
            this.bodyParts.rightLeg.rotation.x = 0;
            this.bodyParts.rightLeg.position.y = this.bodyParts.rightLegInitialPos.y;
        }
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

        // Get pistol world position for shooting
        let startPosition;
        if (this.bodyParts && this.bodyParts.pistol) {
            // Get the world position of the pistol barrel (end of the gun)
            const pistolWorldMatrix = this.bodyParts.pistol.getWorldMatrix();
            const pistolWorldPos = Vector3.TransformCoordinates(
                new Vector3(0.4, 0, 0), // Barrel end position in local space
                pistolWorldMatrix
            );
            startPosition = pistolWorldPos;
        } else {
            // Fallback to center position if pistol not available
            startPosition = this.position.add(new Vector3(0, 1, 0));
        }

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
            // Flash effect when hit - apply to all child meshes
            if (this.mesh && this.mesh.getChildMeshes) {
                const childMeshes = this.mesh.getChildMeshes();
                childMeshes.forEach(childMesh => {
                    if (childMesh.material) {
                        const material = childMesh.material;
                        const originalEmissive = material.emissiveColor.clone();
                        material.emissiveColor = new Color3(1, 1, 1);
                        setTimeout(() => {
                            if (material) {
                                material.emissiveColor = originalEmissive;
                            }
                        }, 100);
                    }
                });
            }
        }
    }

    die() {
        this.isAlive = false;
        // Destroy projectiles
        this.projectiles.forEach(proj => proj.destroy());
        this.projectiles = [];
        // Remove stick figure and all child meshes
        if (this.mesh) {
            // Dispose all child meshes first
            if (this.mesh.getChildMeshes) {
                this.mesh.getChildMeshes().forEach(child => {
                    if (child.material) {
                        child.material.dispose();
                    }
                    child.dispose();
                });
            }
            this.mesh.dispose();
        }
    }
}

export { Enemy };

