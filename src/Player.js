// Using global Babylon namespace from CDN
const { FreeCamera, Vector3, MeshBuilder, StandardMaterial, Color3, TransformNode } = BABYLON;

class Player {
    constructor(scene, canvas) {
        this.scene = scene;
        this.canvas = canvas;
        
        // Player properties
        this.health = 100;
        this.maxHealth = 100;
        this.speed = 5.0;
        this.jumpForce = 8.0;
        this.gravity = -20.0;
        
        // Movement state
        this.velocity = new Vector3(0, 0, 0);
        this.isGrounded = false;
        this.moveDirection = new Vector3(0, 0, 0);
        
        // Input state
        this.keys = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            jump: false
        };
        
        // Mouse state
        this.mouseX = 0;
        this.mouseY = 0;
        this.sensitivity = 0.002;
        this.yaw = 0;
        this.pitch = 0;
        
        // Create camera (first-person view)
        this.camera = new FreeCamera('playerCamera', new Vector3(0, 2, 0), scene);
        this.camera.rotation = new Vector3(0, 0, 0);
        this.camera.speed = 0;
        this.camera.angularSensibility = 0;
        this.camera.setTarget(Vector3.Zero());
        
        // Lock pointer for mouse look
        this.setupInput();
        
        // Create invisible player mesh for collision
        this.mesh = MeshBuilder.CreateBox('playerMesh', { width: 1, height: 2, depth: 1 }, scene);
        this.mesh.isVisible = false;
        this.mesh.position = this.camera.position.clone();
        
        // Create stick figure
        this.stickFigure = this.createStickFigure(scene);
    }

    setupInput() {
        // Keyboard input
        window.addEventListener('keydown', (e) => {
            switch(e.key.toLowerCase()) {
                case 'w':
                    this.keys.forward = true;
                    break;
                case 's':
                    this.keys.backward = true;
                    break;
                case 'a':
                    this.keys.left = true;
                    break;
                case 'd':
                    this.keys.right = true;
                    break;
                case ' ':
                    this.keys.jump = true;
                    e.preventDefault();
                    break;
            }
        });

        window.addEventListener('keyup', (e) => {
            switch(e.key.toLowerCase()) {
                case 'w':
                    this.keys.forward = false;
                    break;
                case 's':
                    this.keys.backward = false;
                    break;
                case 'a':
                    this.keys.left = false;
                    break;
                case 'd':
                    this.keys.right = false;
                    break;
                case ' ':
                    this.keys.jump = false;
                    break;
            }
        });

        // Mouse input for camera rotation
        this.canvas.addEventListener('click', () => {
            this.canvas.requestPointerLock();
        });

        document.addEventListener('pointerlockchange', () => {
            if (document.pointerLockElement === this.canvas) {
                this.canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
            } else {
                this.canvas.removeEventListener('mousemove', this.onMouseMove.bind(this));
            }
        });

        // Prevent context menu
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
    }

    onMouseMove(e) {
        if (document.pointerLockElement === this.canvas) {
            const deltaX = e.movementX || 0;
            const deltaY = e.movementY || 0;

            this.yaw += deltaX * this.sensitivity;
            this.pitch += deltaY * this.sensitivity;

            // Clamp pitch to prevent flipping
            this.pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.pitch));

            // Update camera rotation
            this.camera.rotation.y = this.yaw;
            this.camera.rotation.x = this.pitch;
        }
    }

    createStickFigure(scene) {
        // Create root node to hold all parts
        const root = new TransformNode('playerStickFigure', scene);
        
        // Create material (white/light gray for player)
        const material = new StandardMaterial('playerStickMaterial', scene);
        material.diffuseColor = new Color3(0.9, 0.9, 0.9);
        material.emissiveColor = new Color3(0.1, 0.1, 0.1);
        
        // Head (sphere)
        const head = MeshBuilder.CreateSphere('playerHead', { diameter: 0.35 }, scene);
        head.position.y = 1.0; // Position above torso
        head.material = material;
        head.parent = root;
        
        // Torso (cylinder)
        const torso = MeshBuilder.CreateCylinder('playerTorso', { 
            height: 1.0, 
            diameter: 0.15 
        }, scene);
        torso.position.y = 0.5; // Center of torso
        torso.material = material;
        torso.parent = root;
        
        // Left arm
        const leftArm = MeshBuilder.CreateCylinder('playerLeftArm', { 
            height: 0.6, 
            diameter: 0.1 
        }, scene);
        leftArm.position.x = -0.3;
        leftArm.position.y = 0.7;
        leftArm.rotation.z = Math.PI / 2; // Rotate to horizontal
        leftArm.material = material;
        leftArm.parent = root;
        
        // Right arm
        const rightArm = MeshBuilder.CreateCylinder('playerRightArm', { 
            height: 0.6, 
            diameter: 0.1 
        }, scene);
        rightArm.position.x = 0.3;
        rightArm.position.y = 0.7;
        rightArm.rotation.z = Math.PI / 2; // Rotate to horizontal
        rightArm.material = material;
        rightArm.parent = root;
        
        // Left leg
        const leftLeg = MeshBuilder.CreateCylinder('playerLeftLeg', { 
            height: 0.8, 
            diameter: 0.12 
        }, scene);
        leftLeg.position.x = -0.15;
        leftLeg.position.y = -0.4;
        leftLeg.material = material;
        leftLeg.parent = root;
        
        // Right leg
        const rightLeg = MeshBuilder.CreateCylinder('playerRightLeg', { 
            height: 0.8, 
            diameter: 0.12 
        }, scene);
        rightLeg.position.x = 0.15;
        rightLeg.position.y = -0.4;
        rightLeg.material = material;
        rightLeg.parent = root;
        
        return root;
    }

    update(deltaTime) {
        // Calculate movement direction based on camera rotation
        const forward = new Vector3(
            Math.sin(this.yaw),
            0,
            Math.cos(this.yaw)
        );
        const right = new Vector3(
            Math.cos(this.yaw),
            0,
            -Math.sin(this.yaw)
        );

        // Reset movement direction
        this.moveDirection.set(0, 0, 0);

        // Apply input
        if (this.keys.forward) {
            this.moveDirection.addInPlace(forward);
        }
        if (this.keys.backward) {
            this.moveDirection.subtractInPlace(forward);
        }
        if (this.keys.left) {
            this.moveDirection.subtractInPlace(right);
        }
        if (this.keys.right) {
            this.moveDirection.addInPlace(right);
        }

        // Normalize movement direction
        if (this.moveDirection.length() > 0) {
            this.moveDirection.normalize();
        }

        // Apply horizontal movement
        this.velocity.x = this.moveDirection.x * this.speed;
        this.velocity.z = this.moveDirection.z * this.speed;

        // Check if grounded (simple check - on or near ground level)
        this.isGrounded = this.camera.position.y <= 2.1;

        // Apply gravity
        if (!this.isGrounded) {
            this.velocity.y += this.gravity * deltaTime;
        } else {
            // On ground - can jump
            if (this.keys.jump && this.velocity.y <= 0) {
                this.velocity.y = this.jumpForce;
                this.isGrounded = false;
            } else {
                this.velocity.y = 0;
            }
        }

        // Clamp vertical velocity
        this.velocity.y = Math.max(this.velocity.y, -50);

        // Update camera position
        const newPosition = this.camera.position.add(
            this.velocity.scale(deltaTime)
        );

        // Keep player above ground
        if (newPosition.y < 1) {
            newPosition.y = 1;
            this.velocity.y = 0;
            this.isGrounded = true;
        }

        // Keep player within bounds (optional)
        newPosition.x = Math.max(-90, Math.min(90, newPosition.x));
        newPosition.z = Math.max(-90, Math.min(90, newPosition.z));

        this.camera.position = newPosition;
        this.mesh.position = this.camera.position.clone();
        
        // Update stick figure position and rotation
        if (this.stickFigure) {
            // Position stick figure at camera position, but offset down so head aligns with camera
            this.stickFigure.position = this.camera.position.clone();
            this.stickFigure.position.y -= 0.35; // Offset so head is at camera height
            // Rotate stick figure to match camera yaw
            this.stickFigure.rotation.y = this.yaw;
        }
    }

    takeDamage(amount) {
        this.health = Math.max(0, this.health - amount);
    }

    reset() {
        this.health = this.maxHealth;
        this.camera.position = new Vector3(0, 2, 0);
        this.velocity.set(0, 0, 0);
        this.yaw = 0;
        this.pitch = 0;
        this.camera.rotation.set(0, 0, 0);
        if (this.stickFigure) {
            this.stickFigure.position = this.camera.position.clone();
            this.stickFigure.position.y -= 0.35;
            this.stickFigure.rotation.y = 0;
        }
    }

    get position() {
        return this.camera.position;
    }
}

export { Player };

