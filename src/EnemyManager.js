// Using global Babylon namespace from CDN
const { Vector3 } = BABYLON;
import { Enemy } from './Enemy.js';

class EnemyManager {
    constructor(scene, player) {
        this.scene = scene;
        this.player = player;
        this.enemies = [];
        
        // Spawn settings
        this.maxEnemies = 10;
        this.spawnInterval = 5.0; // seconds
        this.lastSpawnTime = 0;
        this.spawnRadius = 50.0;
        this.minSpawnDistance = 20.0; // Minimum distance from player to spawn
        
        // Spawn positions
        this.spawnPoints = [
            new Vector3(30, 1, 30),
            new Vector3(-30, 1, 30),
            new Vector3(30, 1, -30),
            new Vector3(-30, 1, -30),
            new Vector3(0, 1, 40),
            new Vector3(0, 1, -40),
            new Vector3(40, 1, 0),
            new Vector3(-40, 1, 0)
        ];
    }

    update(deltaTime) {
        const currentTime = Date.now() / 1000;

        // Remove dead enemies
        this.enemies = this.enemies.filter(enemy => enemy.isAlive);

        // Spawn new enemies
        if (this.enemies.length < this.maxEnemies) {
            if (currentTime - this.lastSpawnTime >= this.spawnInterval) {
                this.spawnEnemy();
                this.lastSpawnTime = currentTime;
            }
        }

        // Update all enemies
        this.enemies.forEach(enemy => {
            enemy.update(deltaTime);
        });
    }

    spawnEnemy() {
        // Find a spawn position far enough from player
        let spawnPosition = null;
        let attempts = 0;
        const maxAttempts = 20;

        while (!spawnPosition && attempts < maxAttempts) {
            // Try random spawn point or random position
            let candidate;
            if (Math.random() > 0.5 && this.spawnPoints.length > 0) {
                // Use predefined spawn point
                candidate = this.spawnPoints[Math.floor(Math.random() * this.spawnPoints.length)].clone();
            } else {
                // Random position in spawn radius
                const angle = Math.random() * Math.PI * 2;
                const distance = this.minSpawnDistance + Math.random() * (this.spawnRadius - this.minSpawnDistance);
                candidate = new Vector3(
                    Math.cos(angle) * distance,
                    1,
                    Math.sin(angle) * distance
                );
            }

            // Check if far enough from player
            const distanceToPlayer = Vector3.Distance(candidate, this.player.position);
            if (distanceToPlayer >= this.minSpawnDistance) {
                spawnPosition = candidate;
            }

            attempts++;
        }

        // Fallback to default position if no good spawn found
        if (!spawnPosition) {
            spawnPosition = new Vector3(
                (Math.random() - 0.5) * 40,
                1,
                (Math.random() - 0.5) * 40
            );
        }

        // Create enemy
        const enemy = new Enemy(this.scene, spawnPosition, this.player);
        this.enemies.push(enemy);
    }

    reset() {
        // Remove all enemies
        this.enemies.forEach(enemy => {
            if (enemy.isAlive) {
                enemy.die();
            }
        });
        this.enemies = [];
        this.lastSpawnTime = Date.now() / 1000;
    }
}

export { EnemyManager };

