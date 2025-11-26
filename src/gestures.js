export class GestureRecognizer {
    constructor() {
        this.previousPositions = new Map();
        this.gestureHistory = new Map();
    }

    recognize(landmarks, handedness) {
        const handKey = handedness;

        // Calculate various hand metrics
        const metrics = this.calculateMetrics(landmarks);

        // Store previous position for velocity calculation
        const previousData = this.previousPositions.get(handKey) || {
            position: metrics.palmPosition,
            timestamp: Date.now()
        };

        const currentTime = Date.now();
        const deltaTime = (currentTime - previousData.timestamp) / 1000;

        // Calculate velocity
        const velocity = {
            x: (metrics.palmPosition.x - previousData.position.x) / deltaTime,
            y: (metrics.palmPosition.y - previousData.position.y) / deltaTime,
            z: (metrics.palmPosition.z - previousData.position.z) / deltaTime
        };

        this.previousPositions.set(handKey, {
            position: metrics.palmPosition,
            timestamp: currentTime
        });

        // Recognize specific gestures
        let gesture = { type: 'none', data: null };

        // Check for grab (closed fist)
        if (this.isGrabGesture(metrics)) {
            gesture = { type: 'grab', data: metrics };
        }
        // Check for release (open hand)
        else if (this.isOpenHand(metrics)) {
            gesture = { type: 'release', data: metrics };
        }
        // Check for pinch
        else if (this.isPinchGesture(metrics)) {
            gesture = {
                type: 'pinch',
                data: {
                    ...metrics,
                    rotation: this.calculateRotation(landmarks)
                }
            };
        }

        // Check for swipe (fast movement)
        const speed = Math.sqrt(velocity.x ** 2 + velocity.y ** 2 + velocity.z ** 2);
        if (speed > 2.0) {
            gesture = {
                type: 'swipe',
                data: {
                    velocity: velocity,
                    direction: this.normalizeVector(velocity),
                    speed: speed
                }
            };
        }

        return gesture;
    }

    calculateMetrics(landmarks) {
        // Palm position (base of middle finger)
        const palmPosition = {
            x: landmarks[9].x,
            y: landmarks[9].y,
            z: landmarks[9].z
        };

        // Calculate distances between fingertips and palm
        const fingerDistances = {
            thumb: this.distance(landmarks[4], landmarks[9]),
            index: this.distance(landmarks[8], landmarks[9]),
            middle: this.distance(landmarks[12], landmarks[9]),
            ring: this.distance(landmarks[16], landmarks[9]),
            pinky: this.distance(landmarks[20], landmarks[9])
        };

        // Check if fingers are extended
        const fingersExtended = {
            thumb: this.isFingerExtended(landmarks, 'thumb'),
            index: this.isFingerExtended(landmarks, 'index'),
            middle: this.isFingerExtended(landmarks, 'middle'),
            ring: this.isFingerExtended(landmarks, 'ring'),
            pinky: this.isFingerExtended(landmarks, 'pinky')
        };

        // Pinch distance (thumb to index)
        const pinchDistance = this.distance(landmarks[4], landmarks[8]);

        return {
            palmPosition,
            fingerDistances,
            fingersExtended,
            pinchDistance,
            landmarks
        };
    }

    isGrabGesture(metrics) {
        // Closed fist: all fingers except thumb are not extended
        const { fingersExtended } = metrics;
        return !fingersExtended.index &&
               !fingersExtended.middle &&
               !fingersExtended.ring &&
               !fingersExtended.pinky;
    }

    isOpenHand(metrics) {
        // Open hand: most fingers are extended
        const { fingersExtended } = metrics;
        const extendedCount = Object.values(fingersExtended)
            .filter(extended => extended).length;
        return extendedCount >= 4;
    }

    isPinchGesture(metrics) {
        // Pinch: thumb and index finger close together
        return metrics.pinchDistance < 0.05;
    }

    isFingerExtended(landmarks, finger) {
        const fingerIndices = {
            thumb: [1, 2, 3, 4],
            index: [5, 6, 7, 8],
            middle: [9, 10, 11, 12],
            ring: [13, 14, 15, 16],
            pinky: [17, 18, 19, 20]
        };

        const indices = fingerIndices[finger];
        if (!indices) return false;

        // Check if tip is farther from wrist than middle joint
        const wrist = landmarks[0];
        const tip = landmarks[indices[3]];
        const middle = landmarks[indices[2]];

        const distWristToTip = this.distance(wrist, tip);
        const distWristToMiddle = this.distance(wrist, middle);

        return distWristToTip > distWristToMiddle * 1.1;
    }

    distance(point1, point2) {
        const dx = point1.x - point2.x;
        const dy = point1.y - point2.y;
        const dz = point1.z - point2.z;
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }

    normalizeVector(vector) {
        const length = Math.sqrt(vector.x ** 2 + vector.y ** 2 + vector.z ** 2);
        if (length === 0) return { x: 0, y: 0, z: 0 };
        return {
            x: vector.x / length,
            y: vector.y / length,
            z: vector.z / length
        };
    }

    calculateRotation(landmarks) {
        // Calculate rotation based on hand orientation
        const wrist = landmarks[0];
        const indexMCP = landmarks[5];
        const pinkyMCP = landmarks[17];

        const handVector = {
            x: indexMCP.x - pinkyMCP.x,
            y: indexMCP.y - pinkyMCP.y
        };

        const angle = Math.atan2(handVector.y, handVector.x);
        return angle;
    }
}
