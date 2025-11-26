import { Scene3D } from './scene.js';
import { HandTracking } from './handTracking.js';
import { GestureRecognizer } from './gestures.js';
import { PhysicsWorld } from './physics.js';
import { GroceryStore } from './groceryStore.js';
import { GroceryItems } from './items.js';
import { Hands3D } from './hands3D.js';
import { FeedbackSystem } from './feedback.js';

class GroceryStoreApp {
    constructor() {
        this.scene3D = null;
        this.handTracking = null;
        this.gestureRecognizer = null;
        this.physics = null;
        this.store = null;
        this.items = null;
        this.hands3D = null;
        this.feedback = null;

        this.isInitialized = false;
        this.cartItems = [];

        this.init();
    }

    async init() {
        try {
            console.log('Starting initialization...');
            this.updateLoadingStatus('Setting up 3D environment...');

            // Initialize 3D scene
            console.log('Creating 3D scene...');
            this.scene3D = new Scene3D();
            await this.scene3D.init();
            console.log('3D scene created successfully');

            this.updateLoadingStatus('Initializing physics engine...');

            // Initialize physics
            console.log('Initializing physics...');
            this.physics = new PhysicsWorld();
            console.log('Physics initialized successfully');

            this.updateLoadingStatus('Building grocery store...');

            // Create grocery store environment
            console.log('Building store environment...');
            this.store = new GroceryStore(this.scene3D, this.physics);
            this.store.build();
            console.log('Store built successfully');

            this.updateLoadingStatus('Stocking shelves with items...');

            // Create grocery items
            console.log('Creating items...');
            this.items = new GroceryItems(this.scene3D, this.physics);
            this.items.createItems();
            console.log('Items created successfully');

            this.updateLoadingStatus('Initializing hand tracking...');

            // Initialize hand tracking
            console.log('Starting hand tracking initialization...');
            this.handTracking = new HandTracking();
            await this.handTracking.init();
            console.log('Hand tracking initialized successfully');

            this.updateLoadingStatus('Setting up gesture recognition...');

            // Initialize gesture recognizer
            this.gestureRecognizer = new GestureRecognizer();

            // Initialize 3D hands
            this.hands3D = new Hands3D(this.scene3D);

            // Initialize feedback system
            this.feedback = new FeedbackSystem(this.scene3D);

            this.updateLoadingStatus('Starting experience...');

            // Set up hand tracking callback
            this.handTracking.onResults((results) => {
                this.handleHandResults(results);
            });

            // Start the animation loop
            this.animate();

            // Hide loading screen
            setTimeout(() => {
                document.getElementById('loading-screen').classList.add('hidden');
                this.isInitialized = true;
            }, 500);

        } catch (error) {
            console.error('Initialization error:', error);
            console.error('Full error stack:', error.stack);

            const loadingScreen = document.getElementById('loading-screen');
            const statusElement = document.getElementById('loading-status');

            if (statusElement) {
                statusElement.innerHTML = `
                    <div style="color: #ff4444; margin-top: 20px;">
                        <strong>❌ Error:</strong> ${error.message}<br><br>
                        <small>Check browser console (F12) for details</small><br><br>
                        <button onclick="location.reload()" style="background: #00ffff; color: #000; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; font-weight: bold;">
                            Retry
                        </button>
                    </div>
                `;
            }
        }
    }

    handleHandResults(results) {
        const handStatus = document.getElementById('hand-text');
        const handIndicator = document.getElementById('hand-indicator');

        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            handIndicator.className = 'status-indicator active';
            const handCount = results.multiHandLandmarks.length;
            handStatus.textContent = `${handCount} hand${handCount > 1 ? 's' : ''} detected`;

            // Process each hand
            results.multiHandLandmarks.forEach((landmarks, index) => {
                const handedness = results.multiHandedness[index].label;

                // Update 3D hand visualization
                this.hands3D.updateHand(landmarks, handedness, index);

                // Recognize gestures
                const gesture = this.gestureRecognizer.recognize(landmarks, handedness);

                // Handle interactions based on gestures
                this.handleGesture(gesture, landmarks, handedness, index);
            });
        } else {
            handIndicator.className = 'status-indicator inactive';
            handStatus.textContent = 'No hands detected';
            this.hands3D.hideHands();
        }
    }

    handleGesture(gesture, landmarks, handedness, handIndex) {
        const handWorldPos = this.hands3D.getHandWorldPosition(handIndex);

        if (!handWorldPos) return;

        switch (gesture.type) {
            case 'grab':
                this.handleGrab(handWorldPos, handIndex);
                break;

            case 'release':
                this.handleRelease(handIndex);
                break;

            case 'pinch':
                this.handlePinch(handWorldPos, gesture.data, handIndex);
                break;

            case 'swipe':
                this.handleSwipe(gesture.data, handIndex);
                break;
        }
    }

    handleGrab(position, handIndex) {
        // Find nearest item
        const nearestItem = this.items.findNearestItem(position, 0.5);

        if (nearestItem && !nearestItem.isGrabbed) {
            nearestItem.grab(handIndex);
            this.feedback.showMessage('Grabbed!', '#00ff00');
            this.feedback.createParticles(position, '#00ff00');
        }
    }

    handleRelease(handIndex) {
        const item = this.items.getGrabbedItem(handIndex);

        if (item) {
            item.release();
            this.feedback.showMessage('Released', '#ffff00');
        }
    }

    handlePinch(position, data, handIndex) {
        const item = this.items.getGrabbedItem(handIndex);

        if (item) {
            item.rotate(data.rotation);
            this.feedback.createMotionTrail(position, '#00ffff');
        }
    }

    handleSwipe(data, handIndex) {
        const item = this.items.getGrabbedItem(handIndex);

        if (item) {
            const velocity = data.velocity;

            // Check if swiping towards cart
            if (this.isSwipeTowardsCart(data.direction)) {
                item.tossToCart(velocity);
                this.addToCart(item);
                this.feedback.showMessage('Added to Cart! 🛒', '#00ff88');
                this.feedback.createParticles(item.position, '#00ff88');
            } else {
                item.toss(velocity);
                this.feedback.showMessage('Tossed!', '#ff8800');
            }
        }
    }

    isSwipeTowardsCart(direction) {
        // Cart is positioned at x: -3, z: -2
        // Check if swipe direction has negative x component
        return direction.x < -0.3;
    }

    addToCart(item) {
        this.cartItems.push(item.name);
        document.getElementById('cart-count').textContent = this.cartItems.length;

        // Visual feedback on cart
        this.store.animateCart();
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        if (this.isInitialized) {
            const delta = this.scene3D.clock.getDelta();

            // Update physics
            this.physics.update(delta);

            // Update items with physics
            this.items.update();

            // Update hands
            this.hands3D.update(delta);

            // Update feedback effects
            this.feedback.update(delta);

            // Render scene
            this.scene3D.render();
        }
    }

    updateLoadingStatus(status) {
        const statusElement = document.getElementById('loading-status');
        if (statusElement) {
            statusElement.textContent = status;
        }
    }
}

// Start the application
window.addEventListener('DOMContentLoaded', () => {
    new GroceryStoreApp();
});
