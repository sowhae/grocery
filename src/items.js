import * as THREE from 'three';

export class GroceryItems {
    constructor(scene3D, physics) {
        this.scene = scene3D;
        this.physics = physics;
        this.items = [];
        this.grabbedItems = new Map();
    }

    createItems() {
        // Create various grocery items on shelves
        const itemTypes = [
            { type: 'can', name: 'Soup Can', color: 0xff3333, shelf: 0 },
            { type: 'box', name: 'Cereal Box', color: 0xffaa00, shelf: 0 },
            { type: 'bottle', name: 'Milk Bottle', color: 0xffffff, shelf: 0 },
            { type: 'can', name: 'Soda Can', color: 0x3333ff, shelf: 1 },
            { type: 'box', name: 'Crackers', color: 0xffff00, shelf: 1 },
            { type: 'bottle', name: 'Juice Bottle', color: 0xff9900, shelf: 1 },
            { type: 'sphere', name: 'Orange', color: 0xff8800, shelf: 2 },
            { type: 'sphere', name: 'Apple', color: 0xff0000, shelf: 2 },
            { type: 'box', name: 'Cookies', color: 0x8b4513, shelf: 2 }
        ];

        const shelfPositions = [
            { x: -3, y: 0.5, z: -2.5 },
            { x: 0, y: 0.5, z: -2.5 },
            { x: 3, y: 0.5, z: -2.5 }
        ];

        itemTypes.forEach((itemData, index) => {
            const shelfPos = shelfPositions[itemData.shelf];
            const offsetX = (index % 3 - 1) * 0.4;

            let item;
            switch (itemData.type) {
                case 'can':
                    item = this.createCan(itemData, shelfPos, offsetX);
                    break;
                case 'box':
                    item = this.createBox(itemData, shelfPos, offsetX);
                    break;
                case 'bottle':
                    item = this.createBottle(itemData, shelfPos, offsetX);
                    break;
                case 'sphere':
                    item = this.createSphere(itemData, shelfPos, offsetX);
                    break;
            }

            if (item) {
                this.items.push(item);
            }
        });
    }

    createCan(itemData, shelfPos, offsetX) {
        const radius = 0.08;
        const height = 0.15;

        // Visual mesh
        const geometry = new THREE.CylinderGeometry(radius, radius, height, 32);
        const material = new THREE.MeshStandardMaterial({
            color: itemData.color,
            roughness: 0.3,
            metalness: 0.7,
            emissive: itemData.color,
            emissiveIntensity: 0.1
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        const position = {
            x: shelfPos.x + offsetX,
            y: shelfPos.y + height / 2 + 0.05,
            z: shelfPos.z
        };

        mesh.position.set(position.x, position.y, position.z);
        this.scene.add(mesh);

        // Add label
        this.addLabel(mesh, itemData.name);

        // Physics body
        const physicsBody = this.physics.createCylinderBody({
            radiusTop: radius,
            radiusBottom: radius,
            height: height,
            mass: 0.5,
            position: position
        });

        // Add glow outline
        const outlineGeometry = new THREE.CylinderGeometry(radius * 1.05, radius * 1.05, height * 1.05, 32);
        const outlineMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0,
            side: THREE.BackSide
        });
        const outline = new THREE.Mesh(outlineGeometry, outlineMaterial);
        mesh.add(outline);

        return {
            name: itemData.name,
            type: 'can',
            mesh: mesh,
            outline: outline,
            physicsBody: physicsBody,
            isGrabbed: false,
            grabbedBy: null,
            position: mesh.position
        };
    }

    createBox(itemData, shelfPos, offsetX) {
        const width = 0.12;
        const height = 0.18;
        const depth = 0.08;

        const geometry = new THREE.BoxGeometry(width, height, depth);
        const material = new THREE.MeshStandardMaterial({
            color: itemData.color,
            roughness: 0.7,
            metalness: 0.2,
            emissive: itemData.color,
            emissiveIntensity: 0.1
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        const position = {
            x: shelfPos.x + offsetX,
            y: shelfPos.y + height / 2 + 0.05,
            z: shelfPos.z
        };

        mesh.position.set(position.x, position.y, position.z);
        this.scene.add(mesh);

        this.addLabel(mesh, itemData.name);

        const physicsBody = this.physics.createBoxBody({
            size: { x: width, y: height, z: depth },
            mass: 0.3,
            position: position
        });

        // Add glow outline
        const outlineGeometry = new THREE.BoxGeometry(width * 1.1, height * 1.1, depth * 1.1);
        const outlineMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0,
            side: THREE.BackSide
        });
        const outline = new THREE.Mesh(outlineGeometry, outlineMaterial);
        mesh.add(outline);

        return {
            name: itemData.name,
            type: 'box',
            mesh: mesh,
            outline: outline,
            physicsBody: physicsBody,
            isGrabbed: false,
            grabbedBy: null,
            position: mesh.position
        };
    }

    createBottle(itemData, shelfPos, offsetX) {
        const radiusTop = 0.05;
        const radiusBottom = 0.07;
        const height = 0.2;

        const geometry = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, 16);
        const material = new THREE.MeshPhysicalMaterial({
            color: itemData.color,
            roughness: 0.2,
            metalness: 0.1,
            transmission: 0.5,
            thickness: 0.5,
            emissive: itemData.color,
            emissiveIntensity: 0.05
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        const position = {
            x: shelfPos.x + offsetX,
            y: shelfPos.y + height / 2 + 0.05,
            z: shelfPos.z
        };

        mesh.position.set(position.x, position.y, position.z);
        this.scene.add(mesh);

        this.addLabel(mesh, itemData.name);

        const physicsBody = this.physics.createCylinderBody({
            radiusTop: radiusTop,
            radiusBottom: radiusBottom,
            height: height,
            mass: 0.4,
            position: position
        });

        // Add glow outline
        const outlineGeometry = new THREE.CylinderGeometry(radiusTop * 1.1, radiusBottom * 1.1, height * 1.05, 16);
        const outlineMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0,
            side: THREE.BackSide
        });
        const outline = new THREE.Mesh(outlineGeometry, outlineMaterial);
        mesh.add(outline);

        return {
            name: itemData.name,
            type: 'bottle',
            mesh: mesh,
            outline: outline,
            physicsBody: physicsBody,
            isGrabbed: false,
            grabbedBy: null,
            position: mesh.position
        };
    }

    createSphere(itemData, shelfPos, offsetX) {
        const radius = 0.1;

        const geometry = new THREE.SphereGeometry(radius, 32, 32);
        const material = new THREE.MeshStandardMaterial({
            color: itemData.color,
            roughness: 0.6,
            metalness: 0.1,
            emissive: itemData.color,
            emissiveIntensity: 0.1
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        const position = {
            x: shelfPos.x + offsetX,
            y: shelfPos.y + radius + 0.05,
            z: shelfPos.z
        };

        mesh.position.set(position.x, position.y, position.z);
        this.scene.add(mesh);

        this.addLabel(mesh, itemData.name);

        const physicsBody = this.physics.createSphereBody({
            radius: radius,
            mass: 0.2,
            position: position
        });

        // Add glow outline
        const outlineGeometry = new THREE.SphereGeometry(radius * 1.1, 32, 32);
        const outlineMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0,
            side: THREE.BackSide
        });
        const outline = new THREE.Mesh(outlineGeometry, outlineMaterial);
        mesh.add(outline);

        return {
            name: itemData.name,
            type: 'sphere',
            mesh: mesh,
            outline: outline,
            physicsBody: physicsBody,
            isGrabbed: false,
            grabbedBy: null,
            position: mesh.position
        };
    }

    addLabel(mesh, text) {
        // Create a simple text sprite for the label
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, 256, 64);

        ctx.fillStyle = '#00ffff';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, 128, 32);

        const texture = new THREE.CanvasTexture(canvas);
        const spriteMaterial = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            opacity: 0.8
        });

        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.scale.set(0.5, 0.125, 1);
        sprite.position.y = 0.2;
        mesh.add(sprite);
    }

    findNearestItem(position, maxDistance) {
        let nearest = null;
        let minDistance = maxDistance;

        this.items.forEach(item => {
            if (item.isGrabbed) return;

            const distance = this.distance3D(position, item.mesh.position);
            if (distance < minDistance) {
                minDistance = distance;
                nearest = item;
            }
        });

        return nearest;
    }

    distance3D(pos1, pos2) {
        const dx = pos1.x - pos2.x;
        const dy = pos1.y - pos2.y;
        const dz = pos1.z - pos2.z;
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }

    getGrabbedItem(handIndex) {
        return this.grabbedItems.get(handIndex);
    }

    update() {
        this.items.forEach(item => {
            if (!item.isGrabbed) {
                // Sync visual mesh with physics body
                item.mesh.position.copy(item.physicsBody.position);
                item.mesh.quaternion.copy(item.physicsBody.quaternion);
            }

            // Update outline glow
            if (item.outline) {
                const opacity = item.isGrabbed ? 0.5 : 0;
                item.outline.material.opacity = THREE.MathUtils.lerp(
                    item.outline.material.opacity,
                    opacity,
                    0.1
                );
            }
        });
    }
}

// Add methods to item objects
GroceryItems.prototype.addItemMethods = function(item) {
    item.grab = (handIndex) => {
        item.isGrabbed = true;
        item.grabbedBy = handIndex;
        item.physicsBody.mass = 0;
        item.physicsBody.updateMassProperties();
        this.grabbedItems.set(handIndex, item);
    };

    item.release = () => {
        item.isGrabbed = false;
        if (item.grabbedBy !== null) {
            this.grabbedItems.delete(item.grabbedBy);
        }
        item.grabbedBy = null;
        item.physicsBody.mass = item.type === 'sphere' ? 0.2 : 0.3;
        item.physicsBody.updateMassProperties();
    };

    item.rotate = (angle) => {
        item.mesh.rotation.y += angle * 0.1;
    };

    item.toss = (velocity) => {
        item.release();
        item.physicsBody.velocity.set(velocity.x * 3, velocity.y * 3, velocity.z * 3);
        item.physicsBody.angularVelocity.set(
            Math.random() * 2 - 1,
            Math.random() * 2 - 1,
            Math.random() * 2 - 1
        );
    };

    item.tossToCart = (velocity) => {
        item.release();
        // Calculate direction to cart
        const cartPos = { x: -3, y: 1, z: -2 };
        const direction = {
            x: cartPos.x - item.mesh.position.x,
            y: cartPos.y - item.mesh.position.y,
            z: cartPos.z - item.mesh.position.z
        };
        const length = Math.sqrt(direction.x ** 2 + direction.y ** 2 + direction.z ** 2);
        const normalized = {
            x: direction.x / length,
            y: direction.y / length,
            z: direction.z / length
        };

        const speed = 5;
        item.physicsBody.velocity.set(
            normalized.x * speed,
            normalized.y * speed + 2,
            normalized.z * speed
        );
        item.physicsBody.angularVelocity.set(
            Math.random() * 2 - 1,
            Math.random() * 2 - 1,
            Math.random() * 2 - 1
        );
    };
};

// Call this for all items after creation
GroceryItems.prototype.createItems = function() {
    const itemTypes = [
        { type: 'can', name: 'Soup Can', color: 0xff3333, shelf: 0 },
        { type: 'box', name: 'Cereal Box', color: 0xffaa00, shelf: 0 },
        { type: 'bottle', name: 'Milk Bottle', color: 0xffffff, shelf: 0 },
        { type: 'can', name: 'Soda Can', color: 0x3333ff, shelf: 1 },
        { type: 'box', name: 'Crackers', color: 0xffff00, shelf: 1 },
        { type: 'bottle', name: 'Juice Bottle', color: 0xff9900, shelf: 1 },
        { type: 'sphere', name: 'Orange', color: 0xff8800, shelf: 2 },
        { type: 'sphere', name: 'Apple', color: 0xff0000, shelf: 2 },
        { type: 'box', name: 'Cookies', color: 0x8b4513, shelf: 2 }
    ];

    const shelfPositions = [
        { x: -3, y: 0.5, z: -2.5 },
        { x: 0, y: 0.5, z: -2.5 },
        { x: 3, y: 0.5, z: -2.5 }
    ];

    itemTypes.forEach((itemData, index) => {
        const shelfPos = shelfPositions[itemData.shelf];
        const offsetX = (index % 3 - 1) * 0.4;

        let item;
        switch (itemData.type) {
            case 'can':
                item = this.createCan(itemData, shelfPos, offsetX);
                break;
            case 'box':
                item = this.createBox(itemData, shelfPos, offsetX);
                break;
            case 'bottle':
                item = this.createBottle(itemData, shelfPos, offsetX);
                break;
            case 'sphere':
                item = this.createSphere(itemData, shelfPos, offsetX);
                break;
        }

        if (item) {
            this.addItemMethods(item);
            this.items.push(item);
        }
    });
};
