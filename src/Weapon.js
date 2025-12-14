// Using global Babylon namespace from CDN
const { Vector3 } = BABYLON;
import { Projectile } from './Projectile.js';

class Weapon {
    constructor(scene, player) {
        this.scene = scene;
        this.player = player;
        
        // Weapon properties
        this.fireRate = 0.1; // seconds between shots
        this.lastFireTime = 0;
        this.currentAmmo = 30;
        this.magazineSize = 30;
        this.totalAmmo = 90;
        this.reloadTime = 2.0;
        this.isReloading = false;
        this.reloadStartTime = 0;
        this.projectileSpeed = 50.0;
        this.damage = 25;
        
        // Projectiles array
        this.projectiles = [];
        
        // Input
        this.isShooting = false;
        this.setupInput();
    }

    setupInput() {
        window.addEventListener('mousedown', (e) => {
            if (e.button === 0) { // Left mouse button
                this.isShooting = true;
            }
        });

        window.addEventListener('mouseup', (e) => {
            if (e.button === 0) {
                this.isShooting = false;
            }
        });

        // Reload on R key
        window.addEventListener('keydown', (e) => {
            if (e.key.toLowerCase() === 'r') {
                this.reload();
            }
        });
    }

    update(deltaTime) {
        const currentTime = Date.now() / 1000;

        // Handle reloading
        if (this.isReloading) {
            if (currentTime - this.reloadStartTime >= this.reloadTime) {
                this.finishReload();
            }
        }

        // Handle shooting
        if (this.isShooting && !this.isReloading) {
            if (this.currentAmmo > 0) {
                if (currentTime - this.lastFireTime >= this.fireRate) {
                    this.shoot();
                    this.lastFireTime = currentTime;
                }
            } else {
                // Auto-reload when out of ammo
                if (!this.isReloading) {
                    this.reload();
                }
            }
        }

        // Update projectiles
        this.projectiles.forEach((projectile, index) => {
            projectile.update(deltaTime);
            if (projectile.isDestroyed) {
                this.projectiles.splice(index, 1);
            }
        });
    }

    shoot() {
        if (this.currentAmmo <= 0 || this.isReloading) return;

        this.currentAmmo--;

        // Calculate shoot direction from camera
        const camera = this.player.camera;
        const forward = camera.getForwardRay().direction;
        
        // Start position slightly in front of camera
        const startPosition = camera.position.add(forward.scale(1));

        // Create projectile
        const projectile = new Projectile(
            this.scene,
            startPosition,
            forward,
            this.projectileSpeed,
            this.damage,
            true
        );

        this.projectiles.push(projectile);
    }

    reload() {
        if (this.isReloading || this.currentAmmo === this.magazineSize) return;
        if (this.totalAmmo <= 0) return; // No ammo to reload

        this.isReloading = true;
        this.reloadStartTime = Date.now() / 1000;
    }

    finishReload() {
        const ammoNeeded = this.magazineSize - this.currentAmmo;
        const ammoToReload = Math.min(ammoNeeded, this.totalAmmo);
        
        this.currentAmmo += ammoToReload;
        this.totalAmmo -= ammoToReload;
        this.isReloading = false;
    }

    reset() {
        this.currentAmmo = this.magazineSize;
        this.totalAmmo = 90;
        this.isReloading = false;
        this.lastFireTime = 0;
        
        // Clear projectiles
        this.projectiles.forEach(proj => proj.destroy());
        this.projectiles = [];
    }
}

export { Weapon };

