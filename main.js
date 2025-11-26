// Virtual Grocery Store - Hand Tracking Application
// Author: Claude
// Description: Interactive 3D grocery store controlled via webcam hand tracking

class VirtualGroceryStore {
    constructor() {
        this.hands = null;
        this.camera = null;
        this.scene = null;
        this.renderer = null;
        this.threeCamera = null;
        this.world = null;
        this.groceryItems = [];
        this.cart = [];
        this.handLandmarks = null;
        this.currentGesture = 'none';
        this.grabbedItem = null;
        this.handPosition = new THREE.Vector3();
        this.handVelocity = new THREE.Vector3();
        this.previousHandPosition = new THREE.Vector3();
        this.isPinching = false;
        this.pinchStartDistance = 0;
        this.inspectedItem = null;

        this.init();
    }

    async init() {
        this.showLoading();
        await this.initHandTracking();
        this.initThreeJS();
        this.initPhysics();
        this.createStore();
        this.animate();
        this.hideLoading();
    }

    showLoading() {
        const loading = document.createElement('div');
        loading.id = 'loading';
        loading.className = 'loading';
        loading.textContent = 'Initializing hand tracking';
        document.getElementById('main-view').appendChild(loading);
    }

    hideLoading() {
        const loading = document.getElementById('loading');
        if (loading) loading.remove();
    }

    // Hand Tracking Setup
    async initHandTracking() {
        const videoElement = document.getElementById('webcam');
        const canvasElement = document.getElementById('hand-canvas');
        const canvasCtx = canvasElement.getContext('2d');

        this.hands = new Hands({
            locateFile: (file) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
            }
        });

        this.hands.setOptions({
            maxNumHands: 2,
            modelComplexity: 1,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
        });

        this.hands.onResults((results) => {
            canvasCtx.save();
            canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

            if (results.multiHandLandmarks) {
                for (const landmarks of results.multiHandLandmarks) {
                    drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, {
                        color: '#00FF00',
                        lineWidth: 2
                    });
                    drawLandmarks(canvasCtx, landmarks, {
                        color: '#FF0000',
                        lineWidth: 1,
                        radius: 3
                    });
                }

                // Use first hand for control
                this.handLandmarks = results.multiHandLandmarks[0];
                this.updateHandPosition();
                this.recognizeGesture();
            } else {
                this.handLandmarks = null;
                this.currentGesture = 'none';
            }

            canvasCtx.restore();
        });

        this.camera = new Camera(videoElement, {
            onFrame: async () => {
                await this.hands.send({ image: videoElement });
            },
            width: 640,
            height: 480
        });

        this.camera.start();
    }

    // Three.js Setup
    initThreeJS() {
        const canvas = document.getElementById('three-canvas');
        const width = canvas.parentElement.clientWidth;
        const height = canvas.parentElement.clientHeight;

        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xf0f0f0);
        this.scene.fog = new THREE.Fog(0xf0f0f0, 10, 50);

        // Camera (MOVED CLOSER for better view)
        this.threeCamera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
        this.threeCamera.position.set(0, 2.5, 5);
        this.threeCamera.lookAt(0, 2, 0);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            antialias: true,
            alpha: false
        });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // Lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 10, 5);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 50;
        this.scene.add(directionalLight);

        // Spotlight for dramatic effect
        const spotLight = new THREE.SpotLight(0xffffff, 0.5);
        spotLight.position.set(0, 10, 0);
        spotLight.angle = Math.PI / 6;
        spotLight.penumbra = 0.3;
        this.scene.add(spotLight);

        // Hand cursor visualization (BIGGER and more visible)
        const cursorGeometry = new THREE.SphereGeometry(0.2, 16, 16);
        const cursorMaterial = new THREE.MeshStandardMaterial({
            color: 0x00ff00,
            emissive: 0x00ff00,
            emissiveIntensity: 0.7,
            transparent: true,
            opacity: 0.8
        });
        this.handCursor = new THREE.Mesh(cursorGeometry, cursorMaterial);
        this.handCursor.visible = false;
        this.scene.add(this.handCursor);

        // Resize handler
        window.addEventListener('resize', () => {
            const w = canvas.parentElement.clientWidth;
            const h = canvas.parentElement.clientHeight;
            this.threeCamera.aspect = w / h;
            this.threeCamera.updateProjectionMatrix();
            this.renderer.setSize(w, h);
        });
    }

    // Physics Setup
    initPhysics() {
        this.world = new CANNON.World();
        this.world.gravity.set(0, -9.82, 0);
        this.world.broadphase = new CANNON.NaiveBroadphase();
        this.world.solver.iterations = 10;
        this.world.defaultContactMaterial.friction = 0.3;
        this.world.defaultContactMaterial.restitution = 0.4;
    }

    // Create Store Environment
    createStore() {
        // Floor
        const floorGeometry = new THREE.PlaneGeometry(20, 20);
        const floorMaterial = new THREE.MeshStandardMaterial({
            color: 0xcccccc,
            roughness: 0.8,
            metalness: 0.2
        });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        this.scene.add(floor);

        const floorBody = new CANNON.Body({
            mass: 0,
            shape: new CANNON.Plane()
        });
        floorBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
        this.world.addBody(floorBody);

        // Shelves
        this.createShelves();

        // Grocery Items
        this.createGroceryItems();

        // Shopping Cart
        this.createShoppingCart();
    }

    createShelves() {
        const shelfMaterial = new THREE.MeshStandardMaterial({
            color: 0x8B4513,
            roughness: 0.7,
            metalness: 0.1
        });

        // Back wall shelves (MOVED CLOSER from z=-3 to z=-0.5)
        for (let row = 0; row < 3; row++) {
            const shelfGeometry = new THREE.BoxGeometry(8, 0.1, 0.8);
            const shelf = new THREE.Mesh(shelfGeometry, shelfMaterial);
            shelf.position.set(0, 1 + row * 1.2, -0.5);
            shelf.castShadow = true;
            shelf.receiveShadow = true;
            this.scene.add(shelf);

            // Shelf support
            const supportGeometry = new THREE.BoxGeometry(0.1, 1.2, 0.8);
            for (let i = -1; i <= 1; i++) {
                const support = new THREE.Mesh(supportGeometry, shelfMaterial);
                support.position.set(i * 3.5, 0.6 + row * 1.2, -0.5);
                support.castShadow = true;
                this.scene.add(support);
            }
        }
    }

    createGroceryItems() {
        const items = [
            // Row 1 - Bottom shelf (BIGGER sizes, CLOSER position)
            { name: '🥛 Milk', color: 0xFFFFFF, pos: [-3, 1.3, 0], shape: 'box', size: [0.5, 0.9, 0.5], price: '$3.99' },
            { name: '🍞 Bread', color: 0xDEB887, pos: [-1.5, 1.3, 0], shape: 'box', size: [0.6, 0.5, 0.5], price: '$2.49' },
            { name: '🧀 Cheese', color: 0xFFD700, pos: [0, 1.3, 0], shape: 'box', size: [0.5, 0.5, 0.5], price: '$4.99' },
            { name: '🥚 Eggs', color: 0xFFF8DC, pos: [1.5, 1.3, 0], shape: 'box', size: [0.6, 0.35, 0.6], price: '$3.49' },
            { name: '🧈 Butter', color: 0xFFE4B5, pos: [3, 1.3, 0], shape: 'box', size: [0.4, 0.35, 0.4], price: '$4.29' },

            // Row 2 - Middle shelf (BIGGER sizes, CLOSER position)
            { name: '🍎 Apples', color: 0xFF4444, pos: [-3, 2.5, 0], shape: 'sphere', size: 0.35, price: '$1.99' },
            { name: '🍊 Oranges', color: 0xFF8C00, pos: [-1.5, 2.5, 0], shape: 'sphere', size: 0.35, price: '$2.29' },
            { name: '🍌 Bananas', color: 0xFFFF00, pos: [0, 2.5, 0], shape: 'box', size: [0.7, 0.25, 0.25], price: '$1.49' },
            { name: '🍇 Grapes', color: 0x9370DB, pos: [1.5, 2.5, 0], shape: 'sphere', size: 0.32, price: '$3.99' },
            { name: '🍓 Strawberries', color: 0xFF69B4, pos: [3, 2.5, 0], shape: 'box', size: [0.5, 0.35, 0.5], price: '$4.49' },

            // Row 3 - Top shelf (BIGGER sizes, CLOSER position)
            { name: '🥫 Soup', color: 0xCD5C5C, pos: [-3, 3.7, 0], shape: 'cylinder', size: [0.25, 0.6], price: '$2.99' },
            { name: '🍝 Pasta', color: 0xF4A460, pos: [-1.5, 3.7, 0], shape: 'box', size: [0.5, 0.6, 0.35], price: '$1.99' },
            { name: '🥣 Cereal', color: 0xFFB6C1, pos: [0, 3.7, 0], shape: 'box', size: [0.6, 0.75, 0.35], price: '$3.99' },
            { name: '☕ Coffee', color: 0x8B4513, pos: [1.5, 3.7, 0], shape: 'cylinder', size: [0.25, 0.6], price: '$8.99' },
            { name: '🍪 Cookies', color: 0xD2691E, pos: [3, 3.7, 0], shape: 'box', size: [0.55, 0.4, 0.4], price: '$3.49' }
        ];

        items.forEach((item, index) => {
            this.createGroceryItem(item, index);
        });
    }

    createGroceryItem(itemData, index) {
        let geometry, body;

        if (itemData.shape === 'box') {
            geometry = new THREE.BoxGeometry(...itemData.size);
            const halfExtents = new CANNON.Vec3(
                itemData.size[0] / 2,
                itemData.size[1] / 2,
                itemData.size[2] / 2
            );
            body = new CANNON.Body({
                mass: 1,
                shape: new CANNON.Box(halfExtents),
                linearDamping: 0.3,
                angularDamping: 0.3
            });
        } else if (itemData.shape === 'sphere') {
            geometry = new THREE.SphereGeometry(itemData.size, 16, 16);
            body = new CANNON.Body({
                mass: 0.8,
                shape: new CANNON.Sphere(itemData.size),
                linearDamping: 0.3,
                angularDamping: 0.3
            });
        } else if (itemData.shape === 'cylinder') {
            geometry = new THREE.CylinderGeometry(itemData.size[0], itemData.size[0], itemData.size[1], 16);
            body = new CANNON.Body({
                mass: 1,
                shape: new CANNON.Cylinder(itemData.size[0], itemData.size[0], itemData.size[1], 16),
                linearDamping: 0.3,
                angularDamping: 0.3
            });
        }

        const material = new THREE.MeshStandardMaterial({
            color: itemData.color,
            roughness: 0.6,
            metalness: 0.2
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(...itemData.pos);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        this.scene.add(mesh);

        body.position.set(...itemData.pos);
        this.world.addBody(body);

        // Create outline for glow effect
        const outlineGeometry = geometry.clone();
        const outlineMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0,
            side: THREE.BackSide
        });
        const outline = new THREE.Mesh(outlineGeometry, outlineMaterial);
        outline.scale.multiplyScalar(1.1);
        mesh.add(outline);

        const groceryItem = {
            id: index,
            name: itemData.name,
            price: itemData.price,
            mesh: mesh,
            body: body,
            outline: outline,
            originalPosition: new THREE.Vector3(...itemData.pos),
            isGrabbed: false,
            isInCart: false,
            color: itemData.color
        };

        this.groceryItems.push(groceryItem);
    }

    createShoppingCart() {
        const cartGroup = new THREE.Group();

        // Cart base
        const baseGeometry = new THREE.BoxGeometry(1.5, 0.1, 1);
        const baseMaterial = new THREE.MeshStandardMaterial({ color: 0x4CAF50 });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.y = 0.5;
        cartGroup.add(base);

        // Cart walls
        const wallMaterial = new THREE.MeshStandardMaterial({
            color: 0x4CAF50,
            transparent: true,
            opacity: 0.7,
            side: THREE.DoubleSide
        });

        const frontWall = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.6, 0.05), wallMaterial);
        frontWall.position.set(0, 0.8, -0.5);
        cartGroup.add(frontWall);

        const backWall = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.6, 0.05), wallMaterial);
        backWall.position.set(0, 0.8, 0.5);
        cartGroup.add(backWall);

        const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.6, 1), wallMaterial);
        leftWall.position.set(-0.75, 0.8, 0);
        cartGroup.add(leftWall);

        const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.6, 1), wallMaterial);
        rightWall.position.set(0.75, 0.8, 0);
        cartGroup.add(rightWall);

        cartGroup.position.set(4, 0, 2);
        this.scene.add(cartGroup);

        // Cart physics (trigger zone)
        const cartBody = new CANNON.Body({
            mass: 0,
            shape: new CANNON.Box(new CANNON.Vec3(0.75, 0.5, 0.5)),
            isTrigger: true
        });
        cartBody.position.set(4, 0.5, 2);
        this.world.addBody(cartBody);

        this.cartMesh = cartGroup;
        this.cartBody = cartBody;
    }

    // Hand Position Mapping
    updateHandPosition() {
        if (!this.handLandmarks) return;

        // Use palm center (landmark 0) or index finger tip (landmark 8)
        const indexTip = this.handLandmarks[8];

        // Map normalized coordinates (0-1) to 3D space
        // Flip X for mirror effect
        const x = (1 - indexTip.x) * 12 - 6; // Map to -6 to 6 (increased range)
        const y = (1 - indexTip.y) * 6 + 0.5; // Map to 0.5 to 6.5 (increased range)
        const z = indexTip.z * -8 + 1; // Map depth with much larger range (deeper reach)

        this.previousHandPosition.copy(this.handPosition);
        this.handPosition.set(x, y, z);

        // Calculate velocity
        this.handVelocity.subVectors(this.handPosition, this.previousHandPosition);

        // Update hand cursor
        this.handCursor.position.copy(this.handPosition);
        this.handCursor.visible = true;
    }

    // Gesture Recognition
    recognizeGesture() {
        if (!this.handLandmarks) {
            this.updateGestureUI('none');
            return;
        }

        const landmarks = this.handLandmarks;

        // Key points
        const thumb_tip = landmarks[4];
        const index_tip = landmarks[8];
        const middle_tip = landmarks[12];
        const ring_tip = landmarks[16];
        const pinky_tip = landmarks[20];
        const wrist = landmarks[0];
        const index_mcp = landmarks[5];

        // Calculate distances
        const thumbIndexDist = this.distance3D(thumb_tip, index_tip);
        const indexMiddleDist = this.distance3D(index_tip, middle_tip);

        // Pinch gesture (thumb and index close)
        if (thumbIndexDist < 0.05) {
            this.currentGesture = 'pinch';
            this.handlePinch();
            this.updateGestureUI('pinch');
            return;
        }

        // Grab gesture (all fingers curled)
        const fingersUp = this.countFingersUp(landmarks);
        if (fingersUp === 0) {
            this.currentGesture = 'grab';
            this.handleGrab();
            this.updateGestureUI('grab');
            return;
        }

        // Swipe gesture (open hand moving fast)
        if (fingersUp >= 4 && this.handVelocity.length() > 0.3) {
            this.currentGesture = 'swipe';
            this.handleSwipe();
            this.updateGestureUI('swipe');
            return;
        }

        // Hover (default)
        this.currentGesture = 'hover';
        this.handleHover();
        this.updateGestureUI('hover');
    }

    distance3D(p1, p2) {
        return Math.sqrt(
            Math.pow(p1.x - p2.x, 2) +
            Math.pow(p1.y - p2.y, 2) +
            Math.pow(p1.z - p2.z, 2)
        );
    }

    countFingersUp(landmarks) {
        let count = 0;

        // Thumb
        if (landmarks[4].x < landmarks[3].x) count++;

        // Other fingers
        const fingerTips = [8, 12, 16, 20];
        const fingerPips = [6, 10, 14, 18];

        for (let i = 0; i < fingerTips.length; i++) {
            if (landmarks[fingerTips[i]].y < landmarks[fingerPips[i]].y) {
                count++;
            }
        }

        return count;
    }

    // Gesture Handlers
    handleHover() {
        // Reset any grabbed item
        if (this.grabbedItem && !this.isPinching) {
            this.grabbedItem.isGrabbed = false;
            this.grabbedItem = null;
        }

        // Highlight items near hand (MUCH larger range)
        this.groceryItems.forEach(item => {
            if (item.isInCart) return;

            const distance = this.handPosition.distanceTo(item.mesh.position);
            if (distance < 2.5) {
                // Glow effect with smooth falloff
                item.outline.material.opacity = Math.max(0, 0.8 - distance * 0.3);
            } else {
                item.outline.material.opacity = 0;
            }
        });
    }

    handleGrab() {
        // Find nearest item (MUCH larger grab range)
        let nearest = null;
        let minDist = 2.0; // Increased from 0.5 to 2.0

        this.groceryItems.forEach(item => {
            if (item.isInCart) return;
            const dist = this.handPosition.distanceTo(item.mesh.position);
            if (dist < minDist) {
                minDist = dist;
                nearest = item;
            }
        });

        if (nearest && !this.grabbedItem) {
            this.grabbedItem = nearest;
            this.grabbedItem.isGrabbed = true;
            this.grabbedItem.body.mass = 0; // Make kinematic
        }

        // Move grabbed item with hand
        if (this.grabbedItem) {
            this.grabbedItem.mesh.position.copy(this.handPosition);
            this.grabbedItem.body.position.copy(this.handPosition);
            this.grabbedItem.body.velocity.set(0, 0, 0);
            this.grabbedItem.outline.material.opacity = 0.8;
        }
    }

    handleSwipe() {
        if (this.grabbedItem) {
            // Release item with velocity
            this.grabbedItem.body.mass = 1; // Make dynamic again
            this.grabbedItem.body.velocity.set(
                this.handVelocity.x * 20,
                this.handVelocity.y * 20,
                this.handVelocity.z * 20
            );

            // Check if tossed toward cart
            const directionToCart = new THREE.Vector3()
                .subVectors(this.cartMesh.position, this.grabbedItem.mesh.position)
                .normalize();

            const velocityDirection = this.handVelocity.clone().normalize();
            const dot = directionToCart.dot(velocityDirection);

            // If tossed toward cart (dot > 0.5), increase chance of landing in cart
            if (dot > 0.3) {
                const targetPos = this.cartMesh.position.clone();
                targetPos.y += 0.5;
                const impulse = new CANNON.Vec3()
                    .copy(targetPos)
                    .vsub(this.grabbedItem.body.position)
                    .scale(2);
                this.grabbedItem.body.velocity.copy(impulse);
            }

            this.grabbedItem.isGrabbed = false;
            this.grabbedItem = null;
        }
    }

    handlePinch() {
        if (!this.isPinching) {
            // Start pinch
            this.isPinching = true;

            // Find nearest item to inspect (LARGER range)
            let nearest = null;
            let minDist = 2.0; // Increased from 1.0 to 2.0

            this.groceryItems.forEach(item => {
                if (item.isInCart) return;
                const dist = this.handPosition.distanceTo(item.mesh.position);
                if (dist < minDist) {
                    minDist = dist;
                    nearest = item;
                }
            });

            if (nearest) {
                this.inspectedItem = nearest;
                this.inspectedItem.outline.material.opacity = 0.8;
                this.inspectedItem.outline.material.color.set(0xffff00);
            }
        } else {
            // Rotate inspected item
            if (this.inspectedItem) {
                this.inspectedItem.mesh.rotation.y += 0.05;
                this.inspectedItem.body.quaternion.copy(this.inspectedItem.mesh.quaternion);
            }
        }
    }

    updateGestureUI(gesture) {
        const gestureText = document.getElementById('gesture-text');
        const gestureIndicator = document.getElementById('gesture-indicator');

        const messages = {
            'none': 'Show your hand',
            'hover': '👆 Hovering',
            'grab': '✊ Grabbed!',
            'swipe': '🤚 Swipe to toss!',
            'pinch': '🤏 Inspecting'
        };

        gestureText.textContent = messages[gesture] || 'Ready';

        if (gesture === 'grab' || gesture === 'swipe' || gesture === 'pinch') {
            gestureIndicator.classList.add('gesture-active');
        } else {
            gestureIndicator.classList.remove('gesture-active');
        }

        // Reset pinch state
        if (gesture !== 'pinch' && this.isPinching) {
            this.isPinching = false;
            if (this.inspectedItem) {
                this.inspectedItem.outline.material.color.set(0x00ffff);
                this.inspectedItem.outline.material.opacity = 0;
                this.inspectedItem = null;
            }
        }
    }

    // Animation Loop
    animate() {
        requestAnimationFrame(() => this.animate());

        // Update physics
        this.world.step(1 / 60);

        // Sync Three.js meshes with physics bodies
        this.groceryItems.forEach(item => {
            if (!item.isGrabbed) {
                item.mesh.position.copy(item.body.position);
                item.mesh.quaternion.copy(item.body.quaternion);
            }

            // Check if item is in cart
            if (!item.isInCart) {
                const distToCart = item.mesh.position.distanceTo(this.cartMesh.position);
                if (distToCart < 1.0 && item.mesh.position.y < 1.5 && item.mesh.position.y > 0.3) {
                    this.addToCart(item);
                }
            }
        });

        // Render
        this.renderer.render(this.scene, this.threeCamera);
    }

    addToCart(item) {
        item.isInCart = true;
        this.cart.push(item);

        // Remove from physics world
        this.world.removeBody(item.body);

        // Animate item into cart
        const cartPos = this.cartMesh.position.clone();
        cartPos.y = 0.6;
        cartPos.x += (Math.random() - 0.5) * 0.5;
        cartPos.z += (Math.random() - 0.5) * 0.3;

        item.mesh.position.copy(cartPos);
        item.mesh.scale.set(0.5, 0.5, 0.5);

        // Update UI
        this.updateCartUI();

        // Visual feedback
        this.cartMesh.children[0].material.emissive = new THREE.Color(0x00ff00);
        this.cartMesh.children[0].material.emissiveIntensity = 0.5;

        setTimeout(() => {
            this.cartMesh.children[0].material.emissiveIntensity = 0;
        }, 300);
    }

    updateCartUI() {
        const cartCount = document.getElementById('cart-count');
        const cartItems = document.getElementById('cart-items');

        cartCount.textContent = this.cart.length;

        cartItems.innerHTML = '';
        this.cart.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'cart-item';
            itemDiv.innerHTML = `
                <span class="cart-item-name">${item.name}</span>
                <span class="cart-item-price">${item.price}</span>
            `;
            cartItems.appendChild(itemDiv);
        });
    }
}

// Initialize the application when page loads
window.addEventListener('load', () => {
    new VirtualGroceryStore();
});
