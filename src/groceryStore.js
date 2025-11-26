import * as THREE from 'three';

export class GroceryStore {
    constructor(scene3D, physics) {
        this.scene = scene3D;
        this.physics = physics;
        this.cart = null;
        this.shelves = [];
    }

    build() {
        this.createFloor();
        this.createWalls();
        this.createShelves();
        this.createCart();
        this.createAmbientElements();
    }

    createFloor() {
        // Checkerboard floor with VR aesthetic
        const floorSize = 20;
        const geometry = new THREE.PlaneGeometry(floorSize, floorSize);

        // Create checkerboard texture
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        const tileSize = 64;
        for (let y = 0; y < 8; y++) {
            for (let x = 0; x < 8; x++) {
                ctx.fillStyle = (x + y) % 2 === 0 ? '#0a0a0a' : '#1a1a2e';
                ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
            }
        }

        // Add grid lines
        ctx.strokeStyle = '#00ffff33';
        ctx.lineWidth = 2;
        for (let i = 0; i <= 8; i++) {
            ctx.beginPath();
            ctx.moveTo(i * tileSize, 0);
            ctx.lineTo(i * tileSize, 512);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(0, i * tileSize);
            ctx.lineTo(512, i * tileSize);
            ctx.stroke();
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;

        const material = new THREE.MeshStandardMaterial({
            map: texture,
            roughness: 0.8,
            metalness: 0.2
        });

        const floor = new THREE.Mesh(geometry, material);
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        this.scene.add(floor);

        // Physics floor
        this.physics.createBoxBody({
            mass: 0,
            position: { x: 0, y: 0, z: 0 },
            size: { x: floorSize, y: 0.1, z: floorSize }
        });
    }

    createWalls() {
        const wallMaterial = new THREE.MeshStandardMaterial({
            color: 0x16213e,
            roughness: 0.9,
            metalness: 0.1
        });

        // Back wall
        const backWall = new THREE.Mesh(
            new THREE.BoxGeometry(20, 5, 0.2),
            wallMaterial
        );
        backWall.position.set(0, 2.5, -5);
        backWall.receiveShadow = true;
        this.scene.add(backWall);

        // Side walls
        const leftWall = new THREE.Mesh(
            new THREE.BoxGeometry(0.2, 5, 20),
            wallMaterial
        );
        leftWall.position.set(-10, 2.5, 0);
        leftWall.receiveShadow = true;
        this.scene.add(leftWall);

        const rightWall = new THREE.Mesh(
            new THREE.BoxGeometry(0.2, 5, 20),
            wallMaterial
        );
        rightWall.position.set(10, 2.5, 0);
        rightWall.receiveShadow = true;
        this.scene.add(rightWall);
    }

    createShelves() {
        const shelfMaterial = new THREE.MeshStandardMaterial({
            color: 0x2d4059,
            roughness: 0.6,
            metalness: 0.4,
            emissive: 0x001122,
            emissiveIntensity: 0.1
        });

        // Create 3 shelf units
        const shelfPositions = [
            { x: -3, z: -3 },
            { x: 0, z: -3 },
            { x: 3, z: -3 }
        ];

        shelfPositions.forEach((pos, index) => {
            const shelf = this.createShelfUnit(pos.x, pos.z, shelfMaterial);
            this.shelves.push(shelf);
        });
    }

    createShelfUnit(x, z, material) {
        const shelfGroup = new THREE.Group();

        // Vertical supports
        const support = new THREE.Mesh(
            new THREE.BoxGeometry(0.1, 2, 0.1),
            material
        );

        const support1 = support.clone();
        support1.position.set(-0.8, 1, -0.4);
        shelfGroup.add(support1);

        const support2 = support.clone();
        support2.position.set(0.8, 1, -0.4);
        shelfGroup.add(support2);

        const support3 = support.clone();
        support3.position.set(-0.8, 1, 0.4);
        shelfGroup.add(support3);

        const support4 = support.clone();
        support4.position.set(0.8, 1, 0.4);
        shelfGroup.add(support4);

        // Horizontal shelves
        const shelfLevels = [0.5, 1.0, 1.5];
        shelfLevels.forEach(height => {
            const shelfBoard = new THREE.Mesh(
                new THREE.BoxGeometry(1.8, 0.05, 1.0),
                material
            );
            shelfBoard.position.y = height;
            shelfBoard.castShadow = true;
            shelfBoard.receiveShadow = true;
            shelfGroup.add(shelfBoard);

            // Add edge glow
            const edgeGeometry = new THREE.EdgesGeometry(shelfBoard.geometry);
            const edgeMaterial = new THREE.LineBasicMaterial({
                color: 0x00ffff,
                transparent: true,
                opacity: 0.3
            });
            const edges = new THREE.LineSegments(edgeGeometry, edgeMaterial);
            shelfBoard.add(edges);

            // Physics for shelf
            this.physics.createBoxBody({
                mass: 0,
                position: { x: x, y: height, z: z },
                size: { x: 1.8, y: 0.05, z: 1.0 }
            });
        });

        shelfGroup.position.set(x, 0, z);
        this.scene.add(shelfGroup);

        return shelfGroup;
    }

    createCart() {
        const cartGroup = new THREE.Group();

        // Cart body
        const cartMaterial = new THREE.MeshStandardMaterial({
            color: 0xff6600,
            roughness: 0.5,
            metalness: 0.6,
            emissive: 0xff3300,
            emissiveIntensity: 0.2
        });

        const cartBody = new THREE.Mesh(
            new THREE.BoxGeometry(0.8, 0.5, 0.6),
            cartMaterial
        );
        cartBody.position.y = 0.5;
        cartBody.castShadow = true;
        cartGroup.add(cartBody);

        // Cart rim with glow
        const rimGeometry = new THREE.EdgesGeometry(cartBody.geometry);
        const rimMaterial = new THREE.LineBasicMaterial({
            color: 0x00ff88,
            linewidth: 2
        });
        const rim = new THREE.LineSegments(rimGeometry, rimMaterial);
        cartBody.add(rim);

        // Wheels
        const wheelMaterial = new THREE.MeshStandardMaterial({
            color: 0x333333,
            roughness: 0.7,
            metalness: 0.3
        });

        const wheelGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.05, 16);
        const wheelPositions = [
            { x: -0.3, z: -0.25 },
            { x: 0.3, z: -0.25 },
            { x: -0.3, z: 0.25 },
            { x: 0.3, z: 0.25 }
        ];

        wheelPositions.forEach(pos => {
            const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
            wheel.rotation.z = Math.PI / 2;
            wheel.position.set(pos.x, 0.1, pos.z);
            cartGroup.add(wheel);
        });

        cartGroup.position.set(-3, 0, -2);
        this.scene.add(cartGroup);
        this.cart = cartGroup;

        // Physics for cart
        this.physics.createBoxBody({
            mass: 0,
            position: { x: -3, y: 0.5, z: -2 },
            size: { x: 0.8, y: 0.5, z: 0.6 }
        });
    }

    createAmbientElements() {
        // Add some floating particles for atmosphere
        const particleCount = 100;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount * 3; i += 3) {
            positions[i] = (Math.random() - 0.5) * 20;
            positions[i + 1] = Math.random() * 5;
            positions[i + 2] = (Math.random() - 0.5) * 20;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const material = new THREE.PointsMaterial({
            color: 0x00ffff,
            size: 0.05,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending
        });

        const particles = new THREE.Points(geometry, material);
        this.scene.add(particles);
    }

    animateCart() {
        if (!this.cart) return;

        // Bounce animation
        const originalY = this.cart.position.y;
        const bounceHeight = 0.2;
        const duration = 500;
        const startTime = Date.now();

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / duration;

            if (progress < 1) {
                const bounce = Math.sin(progress * Math.PI) * bounceHeight;
                this.cart.position.y = originalY + bounce;
                requestAnimationFrame(animate);
            } else {
                this.cart.position.y = originalY;
            }
        };

        animate();
    }
}
