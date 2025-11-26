export class HandTracking {
    constructor() {
        this.hands = null;
        this.camera = null;
        this.videoElement = null;
        this.onResultsCallback = null;
        this.animationFrame = null;
    }

    async init() {
        try {
            // Get video element
            this.videoElement = document.getElementById('webcam');

            // Import MediaPipe dynamically
            const { Hands } = await import('@mediapipe/hands');
            const { Camera } = await import('@mediapipe/camera_utils');

            // Initialize MediaPipe Hands
            this.hands = new Hands({
                locateFile: (file) => {
                    return `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915/${file}`;
                }
            });

            this.hands.setOptions({
                maxNumHands: 2,
                modelComplexity: 1,
                minDetectionConfidence: 0.5,
                minTrackingConfidence: 0.5
            });

            this.hands.onResults((results) => {
                if (this.onResultsCallback) {
                    this.onResultsCallback(results);
                }
            });

            // Initialize camera
            this.camera = new Camera(this.videoElement, {
                onFrame: async () => {
                    if (this.hands) {
                        await this.hands.send({ image: this.videoElement });
                    }
                },
                width: 1280,
                height: 720
            });

            await this.camera.start();

            console.log('Hand tracking initialized successfully');
            return this;
        } catch (error) {
            console.error('Failed to initialize hand tracking:', error);
            throw error;
        }
    }

    onResults(callback) {
        this.onResultsCallback = callback;
    }

    stop() {
        if (this.camera) {
            this.camera.stop();
        }
    }
}
