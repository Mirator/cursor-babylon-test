// Using global Babylon namespace from CDN
const { Engine, Scene, FreeCamera, Vector3, HemisphericLight, DirectionalLight, Color3, MeshBuilder, StandardMaterial } = BABYLON;
import { Player } from './Player.js';
import { Weapon } from './Weapon.js';
import { EnemyManager } from './EnemyManager.js';
import { UI } from './UI.js';

class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.engine = null;
        this.scene = null;
        this.player = null;
        this.weapon = null;
        this.enemyManager = null;
        this.ui = null;
        this.score = 0;
        this.isGameOver = false;
        this.explosionParticles = [];
    }

    init() {
        // Create Babylon.js engine
        this.engine = new Engine(this.canvas, true, {
            preserveDrawingBuffer: true,
            stencil: true
        });

        // Create scene
        this.scene = new Scene(this.engine);
        this.scene.clearColor = new Color3(0.05, 0.05, 0.1);

        // Setup scene
        this.setupScene();
        
        // Initialize game systems
        this.player = new Player(this.scene, this.canvas);
        this.weapon = new Weapon(this.scene, this.player);
        this.enemyManager = new EnemyManager(this.scene, this.player);
        this.ui = new UI();

        // Start game loop
        this.startGameLoop();

        // Handle window resize
        window.addEventListener('resize', () => {
            this.engine.resize();
        });
    }

    setupScene() {
        // Create space skybox
        const skybox = MeshBuilder.CreateBox('skybox', { size: 1000 }, this.scene);
        const skyboxMaterial = new StandardMaterial('skyboxMaterial', this.scene);
        skyboxMaterial.emissiveColor = new Color3(0.1, 0.1, 0.2);
        skyboxMaterial.disableLighting = true;
        skybox.material = skyboxMaterial;
        skybox.infiniteDistance = true;

        // Add stars effect (simple approach - could be enhanced with particles)
        this.createStars();

        // Create ground/platform
        const ground = MeshBuilder.CreateGround('ground', { width: 200, height: 200 }, this.scene);
        const groundMaterial = new StandardMaterial('groundMaterial', this.scene);
        groundMaterial.diffuseColor = new Color3(0.2, 0.2, 0.3);
        groundMaterial.specularColor = new Color3(0.1, 0.1, 0.1);
        ground.material = groundMaterial;
        ground.position.y = 0;

        // Add some platforms for gameplay
        this.createPlatforms();

        // Setup lighting
        const ambientLight = new HemisphericLight('ambientLight', new Vector3(0, 1, 0), this.scene);
        ambientLight.intensity = 0.3;
        ambientLight.diffuse = new Color3(0.5, 0.5, 0.7);

        const directionalLight = new DirectionalLight('directionalLight', new Vector3(-1, -1, -1), this.scene);
        directionalLight.intensity = 0.5;
        directionalLight.diffuse = new Color3(1, 1, 1);
    }

    createStars() {
        // Create a simple starfield effect
        for (let i = 0; i < 500; i++) {
            const star = MeshBuilder.CreateSphere(`star_${i}`, { diameter: 0.1 }, this.scene);
            star.position.x = (Math.random() - 0.5) * 500;
            star.position.y = (Math.random() - 0.5) * 500;
            star.position.z = (Math.random() - 0.5) * 500;
            
            const starMaterial = new StandardMaterial(`starMaterial_${i}`, this.scene);
            starMaterial.emissiveColor = new Color3(1, 1, 1);
            starMaterial.disableLighting = true;
            star.material = starMaterial;
        }
    }

    createPlatforms() {
        // Create some floating platforms for gameplay variety
        const platforms = [
            { x: 30, y: 5, z: 30, size: 15 },
            { x: -30, y: 5, z: 30, size: 15 },
            { x: 30, y: 5, z: -30, size: 15 },
            { x: -30, y: 5, z: -30, size: 15 },
            { x: 0, y: 10, z: 0, size: 20 }
        ];

        platforms.forEach((platform, index) => {
            const platformMesh = MeshBuilder.CreateBox(`platform_${index}`, { 
                width: platform.size, 
                height: 2, 
                depth: platform.size 
            }, this.scene);
            platformMesh.position.set(platform.x, platform.y, platform.z);
            
            const platformMaterial = new StandardMaterial(`platformMaterial_${index}`, this.scene);
            platformMaterial.diffuseColor = new Color3(0.3, 0.3, 0.4);
            platformMaterial.emissiveColor = new Color3(0.1, 0.1, 0.2);
            platformMesh.material = platformMaterial;
        });
    }

    startGameLoop() {
        this.scene.registerBeforeRender(() => {
            if (this.isGameOver) return;

            const deltaTime = this.engine.getDeltaTime() / 1000; // Convert to seconds

            // Update player
            this.player.update(deltaTime);

            // Update weapon
            this.weapon.update(deltaTime);

            // Update enemies
            this.enemyManager.update(deltaTime);

            // Update explosion particles
            if (this.explosionParticles) {
                this.explosionParticles.forEach((particle, index) => {
                    if (particle.age < particle.lifetime) {
                        particle.age += deltaTime;
                        const moveDelta = particle.direction.scale(particle.speed * deltaTime);
                        particle.mesh.position.addInPlace(moveDelta);
                        particle.mesh.scaling.scaleInPlace(0.98);
                        const alpha = 1 - (particle.age / particle.lifetime);
                        particle.mesh.material.alpha = alpha;
                    } else {
                        particle.mesh.dispose();
                        this.explosionParticles.splice(index, 1);
                    }
                });
            }

            // Check collisions
            this.checkCollisions();

            // Update UI
            this.ui.updateHealth(this.player.health);
            this.ui.updateAmmo(this.weapon.currentAmmo, this.weapon.totalAmmo);
            this.ui.updateScore(this.score);

            // Check game over
            if (this.player.health <= 0 && !this.isGameOver) {
                this.gameOver();
            }
        });

        // Render loop
        this.engine.runRenderLoop(() => {
            this.scene.render();
        });
    }

    checkCollisions() {
        // Check player projectiles vs enemies
        const projectilesToRemove = [];
        this.weapon.projectiles.forEach((projectile, projIndex) => {
            if (projectile.isDestroyed) {
                projectilesToRemove.push(projIndex);
                return;
            }

            this.enemyManager.enemies.forEach((enemy) => {
                if (!enemy.isAlive || projectile.isDestroyed) return;

                const distance = Vector3.Distance(projectile.mesh.position, enemy.mesh.position);
                if (distance < 1.5) { // Collision threshold
                    // Hit enemy
                    enemy.takeDamage(projectile.damage);
                    projectile.destroy();

                    if (!enemy.isAlive) {
                        this.score += 100;
                        this.createExplosion(enemy.position);
                    }
                }
            });
        });

        // Remove destroyed projectiles (in reverse order to maintain indices)
        projectilesToRemove.reverse().forEach(index => {
            this.weapon.projectiles.splice(index, 1);
        });
        this.weapon.projectiles = this.weapon.projectiles.filter(p => !p.isDestroyed);

        // Check enemy projectiles vs player
        this.enemyManager.enemies.forEach((enemy) => {
            if (!enemy.isAlive) return;
            
            const enemyProjectilesToRemove = [];
            enemy.projectiles.forEach((projectile, projIndex) => {
                if (projectile.isDestroyed) {
                    enemyProjectilesToRemove.push(projIndex);
                    return;
                }

                const distance = Vector3.Distance(projectile.mesh.position, this.player.camera.position);
                if (distance < 1.5) {
                    // Hit player
                    this.player.takeDamage(projectile.damage);
                    projectile.destroy();
                    enemyProjectilesToRemove.push(projIndex);
                }
            });

            // Remove destroyed projectiles
            enemyProjectilesToRemove.reverse().forEach(index => {
                enemy.projectiles.splice(index, 1);
            });
            enemy.projectiles = enemy.projectiles.filter(p => !p.isDestroyed);
        });
    }

    createExplosion(position) {
        // Simple explosion effect using multiple small spheres
        const explosionParticles = [];
        for (let i = 0; i < 15; i++) {
            const particle = MeshBuilder.CreateSphere(`explosion_${Date.now()}_${i}`, { diameter: 0.3 }, this.scene);
            particle.position = position.clone();
            
            const material = new StandardMaterial(`explosionMaterial_${Date.now()}_${i}`, this.scene);
            const colorVariation = Math.random();
            if (colorVariation > 0.5) {
                material.emissiveColor = new Color3(1, 0.5, 0); // Orange
            } else {
                material.emissiveColor = new Color3(1, 1, 0.3); // Yellow
            }
            material.disableLighting = true;
            particle.material = material;

            explosionParticles.push({
                mesh: particle,
                direction: new Vector3(
                    (Math.random() - 0.5) * 2,
                    Math.random() * 0.5 + 0.5,
                    (Math.random() - 0.5) * 2
                ).normalize(),
                speed: 3 + Math.random() * 4,
                age: 0,
                lifetime: 0.6
            });
        }

        // Store explosion particles to update in game loop
        this.explosionParticles.push(...explosionParticles);
    }

    gameOver() {
        this.isGameOver = true;
        this.ui.showGameOver(this.score);
        
        const restartButton = document.getElementById('restart-button');
        restartButton.onclick = () => {
            this.restart();
        };
    }

    restart() {
        // Reset game state
        this.score = 0;
        this.isGameOver = false;
        
        // Reset player
        this.player.reset();
        
        // Reset weapon
        this.weapon.reset();
        
        // Clear enemies
        this.enemyManager.reset();
        
        // Clear explosion particles
        this.explosionParticles.forEach(particle => particle.mesh.dispose());
        this.explosionParticles = [];
        
        // Hide game over screen
        this.ui.hideGameOver();
    }
}

// Export for ES6 modules
export { Game };

