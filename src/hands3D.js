import * as THREE from 'three';

export class Hands3D {
    constructor(scene3D) {
        this.scene = scene3D;
        this.hands = new Map();
        this.motionTrails = new Map();
    }

    updateHand(landmarks, handedness, handIndex) {
        const handKey = `${handedness}_${handIndex}`;

        if (!this.hands.has(handKey)) {
            this.createHand(handKey);
        }

        const handGroup = this.hands.get(handKey);
        this.updateHandPosition(handGroup, landmarks);
        this.updateMotionTrail(handKey, landmarks);

        handGroup.visible = true;
    }

    createHand(handKey) {
        const handGroup = new THREE.Group();

        // Create hand skeleton with connections
        const connections = [
            // Thumb
            [0, 1], [1, 2], [2, 3], [3, 4],
            // Index finger
            [0, 5], [5, 6], [6, 7], [7, 8],
            // Middle finger
            [0, 9], [9, 10], [10, 11], [11, 12],
            // Ring finger
            [0, 13], [13, 14], [14, 15], [15, 16],
            // Pinky
            [0, 17], [17, 18], [18, 19], [19, 20],
            // Palm
            [5, 9], [9, 13], [13, 17], [17, 0]
        ];

        // Create joints (spheres at each landmark)
        const joints = [];
        for (let i = 0; i < 21; i++) {
            const geometry = new THREE.SphereGeometry(0.015, 16, 16);
            const material = new THREE.MeshPhongMaterial({
                color: 0x00ffff,
                emissive: 0x00ffff,
                emissiveIntensity: 0.5,
                transparent: true,
                opacity: 0.8
            });
            const joint = new THREE.Mesh(geometry, material);
            joint.castShadow = false;
            joints.push(joint);
            handGroup.add(joint);
        }

        // Create connections (cylinders between joints)
        const bones = [];
        connections.forEach(() => {
            const material = new THREE.LineBasicMaterial({
                color: 0x00ffff,
                transparent: true,
                opacity: 0.6,
                linewidth: 2
            });
            const geometry = new THREE.BufferGeometry();
            const line = new THREE.Line(geometry, material);
            bones.push(line);
            handGroup.add(line);
        });

        // Create palm glow
        const palmGlowGeometry = new THREE.SphereGeometry(0.08, 32, 32);
        const palmGlowMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.2,
            side: THREE.BackSide
        });
        const palmGlow = new THREE.Mesh(palmGlowGeometry, palmGlowMaterial);
        handGroup.add(palmGlow);

        handGroup.userData = {
            joints: joints,
            bones: bones,
            connections: connections,
            palmGlow: palmGlow
        };

        this.scene.add(handGroup);
        this.hands.set(handKey, handGroup);
    }

    updateHandPosition(handGroup, landmarks) {
        const { joints, bones, connections, palmGlow } = handGroup.userData;

        // Update joint positions
        landmarks.forEach((landmark, index) => {
            const worldPos = this.landmarkToWorld(landmark);
            joints[index].position.set(worldPos.x, worldPos.y, worldPos.z);
        });

        // Update bone connections
        connections.forEach((connection, index) => {
            const start = joints[connection[0]].position;
            const end = joints[connection[1]].position;

            const points = [start, end];
            bones[index].geometry.setFromPoints(points);
        });

        // Update palm glow position (center of palm)
        const palmCenter = this.landmarkToWorld(landmarks[9]);
        palmGlow.position.set(palmCenter.x, palmCenter.y, palmCenter.z);

        // Pulse glow effect
        const time = Date.now() * 0.002;
        palmGlow.scale.setScalar(1 + Math.sin(time) * 0.2);
    }

    landmarkToWorld(landmark) {
        // Convert normalized landmark coordinates to world coordinates
        // MediaPipe gives coords in normalized space [0, 1]
        // We need to map this to our 3D world

        const x = (landmark.x - 0.5) * 8; // Map to -4 to 4 range
        const y = (1 - landmark.y) * 3; // Map to 0 to 3 range (inverted Y)
        const z = landmark.z * -4 + 1; // Map Z depth

        return { x, y, z };
    }

    getHandWorldPosition(handIndex) {
        for (const [key, handGroup] of this.hands.entries()) {
            if (key.includes(`_${handIndex}`)) {
                if (handGroup.userData.joints && handGroup.userData.joints.length > 9) {
                    // Return palm position (landmark 9)
                    return handGroup.userData.joints[9].position.clone();
                }
            }
        }
        return null;
    }

    updateMotionTrail(handKey, landmarks) {
        if (!this.motionTrails.has(handKey)) {
            this.createMotionTrail(handKey);
        }

        const trail = this.motionTrails.get(handKey);
        const palmPos = this.landmarkToWorld(landmarks[9]);

        // Update trail
        trail.positions.push(palmPos);
        if (trail.positions.length > trail.maxLength) {
            trail.positions.shift();
        }

        // Update trail geometry
        if (trail.positions.length > 1) {
            const points = trail.positions.map(pos =>
                new THREE.Vector3(pos.x, pos.y, pos.z)
            );
            trail.line.geometry.setFromPoints(points);
            trail.line.visible = true;
        }
    }

    createMotionTrail(handKey) {
        const material = new THREE.LineBasicMaterial({
            color: 0x00ff88,
            transparent: true,
            opacity: 0.4,
            linewidth: 3
        });
        const geometry = new THREE.BufferGeometry();
        const line = new THREE.Line(geometry, material);

        this.scene.add(line);

        this.motionTrails.set(handKey, {
            line: line,
            positions: [],
            maxLength: 20
        });
    }

    hideHands() {
        this.hands.forEach(handGroup => {
            handGroup.visible = false;
        });

        this.motionTrails.forEach(trail => {
            trail.line.visible = false;
            trail.positions = [];
        });
    }

    update(deltaTime) {
        // Fade out motion trails
        this.motionTrails.forEach(trail => {
            if (trail.positions.length > 0 && !trail.line.visible) {
                trail.positions = [];
            }
        });

        // Animate hand glow
        this.hands.forEach(handGroup => {
            if (handGroup.visible && handGroup.userData.palmGlow) {
                const time = Date.now() * 0.002;
                handGroup.userData.palmGlow.material.opacity =
                    0.15 + Math.sin(time * 2) * 0.05;
            }
        });
    }
}
