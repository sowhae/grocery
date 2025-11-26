# 🛒 Virtual Grocery Store - Hand Tracking Interface

An immersive virtual grocery store controlled entirely through webcam hand tracking. Shop for groceries using natural hand gestures - reach, grab, swipe, and pinch to interact with products in a 3D environment with realistic physics.

![Virtual Grocery Store](https://img.shields.io/badge/Hand_Tracking-MediaPipe-blue)
![3D Graphics](https://img.shields.io/badge/3D-Three.js-green)
![Physics](https://img.shields.io/badge/Physics-Cannon.js-orange)

## ✨ Features

### 🖐️ Hand Tracking
- **Real-time webcam tracking** using Google MediaPipe Hands
- Supports accurate hand landmark detection (21 points per hand)
- Mirror-mode display for intuitive interaction
- Low latency for responsive gesture recognition

### 🎮 Gesture Controls

| Gesture | Action | Description |
|---------|--------|-------------|
| 👆 **Hover** | Highlight items | Move your hand near products to see them glow |
| ✊ **Grab** | Pick up items | Make a fist to grab nearby products |
| 🤚 **Swipe** | Toss to cart | Open hand and swipe to throw items into the cart |
| 🤏 **Pinch** | Inspect/Rotate | Pinch thumb and index to rotate and examine products |

### 🎨 Visual Feedback
- **Glow effects**: Items light up when your hand hovers nearby
- **Interactive hints**: Visual indicators show which objects can be picked up
- **Motion feedback**: Smooth animations for all gestures
- **Hand cursor**: Real-time 3D visualization of hand position

### ⚛️ Realistic Physics
- Items bounce, roll, and wobble with realistic physics
- Proper collision detection between objects
- Damping and friction for natural movement
- Gravity simulation for authentic dropping behavior

### 🏪 Store Environment
- Clean, minimal shelf layout with 3 tiers
- 15 colorful grocery items (fruits, dairy, packaged goods)
- Professional lighting with shadows
- Shopping cart with visual feedback
- Price tags and product information

### 🛍️ Shopping Cart
- Automatic detection when items land in cart
- Real-time cart counter and item list
- Price display for each product
- Visual confirmation animations

## 🚀 Quick Start

### Prerequisites
- Modern web browser (Chrome, Edge, or Firefox recommended)
- Webcam access
- HTTPS connection (required for webcam access)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd grocery
   ```

2. **Serve with HTTPS**

   The application requires HTTPS to access the webcam. Use one of these methods:

   **Option A: Python HTTP Server**
   ```bash
   # Python 3
   python -m http.server 8000
   ```
   Then visit: `http://localhost:8000`

   **Option B: Node.js with http-server**
   ```bash
   npx http-server -p 8000
   ```

   **Option C: VS Code Live Server**
   - Install "Live Server" extension
   - Right-click `index.html` → "Open with Live Server"

3. **Grant webcam permissions**
   - Allow camera access when prompted by your browser
   - Position yourself so your hand is visible in the webcam preview

4. **Start shopping!**
   - Move your hand to control the 3D cursor
   - Try different gestures to interact with products

## 🎯 How to Use

### Getting Started
1. **Position yourself**: Sit about 2-3 feet from your webcam
2. **Lighting**: Ensure good lighting for best hand tracking
3. **Hand visibility**: Keep your hand in view of the camera
4. **Orientation**: Face the camera with palm visible

### Shopping Workflow
1. **Browse**: Move your hand near items to see them glow
2. **Pick up**: Make a fist when hovering over an item to grab it
3. **Inspect**: Use pinch gesture (thumb + index) to rotate and examine
4. **Add to cart**: Swipe toward the green cart to toss items in
5. **Check cart**: View your items in the left panel

### Tips for Best Experience
- **Smooth movements**: Move your hand slowly for better tracking
- **Clear gestures**: Make distinct hand shapes for each gesture
- **Distance**: Keep hand 1-2 feet from camera for optimal tracking
- **Background**: Use a plain background for better hand detection

## 🏗️ Technical Architecture

### Technologies Used

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Hand Tracking** | MediaPipe Hands | Real-time hand landmark detection |
| **3D Graphics** | Three.js (r128) | Rendering 3D scene and objects |
| **Physics Engine** | Cannon.js | Realistic physics simulation |
| **Video Processing** | WebRTC | Webcam access and streaming |

### Project Structure
```
grocery/
├── index.html          # Main HTML structure
├── style.css           # Styling and animations
├── main.js             # Core application logic
└── README.md           # Documentation
```

### Key Components

#### VirtualGroceryStore Class
Main application controller that manages:
- Hand tracking initialization
- 3D scene setup
- Physics world configuration
- Gesture recognition
- Item interactions
- Shopping cart logic

#### Hand Tracking Pipeline
```
Webcam → MediaPipe → Landmark Detection → Gesture Recognition → 3D Interaction
```

#### Gesture Recognition System
- **Distance-based detection**: Measures distances between finger landmarks
- **Finger counting**: Determines which fingers are extended
- **Velocity tracking**: Detects swipe speed and direction
- **State management**: Tracks current gesture and item interactions

## 🎨 Customization

### Adding New Products

Edit the `createGroceryItems()` method in `main.js`:

```javascript
{
    name: '🥑 Avocado',
    color: 0x568203,
    pos: [x, y, z],
    shape: 'sphere',
    size: 0.15,
    price: '$2.99'
}
```

**Available shapes**: `'box'`, `'sphere'`, `'cylinder'`

### Adjusting Gesture Sensitivity

Modify thresholds in the `recognizeGesture()` method:

```javascript
// Pinch sensitivity (default: 0.05)
if (thumbIndexDist < 0.05) { ... }

// Swipe speed threshold (default: 0.3)
if (handVelocity.length() > 0.3) { ... }
```

### Changing Colors and Lighting

Edit the scene setup in `initThreeJS()`:

```javascript
// Background color
this.scene.background = new THREE.Color(0xf0f0f0);

// Ambient light intensity
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
```

## 🐛 Troubleshooting

### Camera Not Working
- **Check permissions**: Ensure browser has webcam access
- **HTTPS required**: Use HTTPS or localhost
- **Close other apps**: Make sure no other app is using the camera

### Hand Not Detected
- **Lighting**: Improve room lighting
- **Distance**: Move closer to camera (1-3 feet optimal)
- **Background**: Use plain, contrasting background
- **Hand visibility**: Keep entire hand in frame

### Poor Performance
- **Close tabs**: Free up browser resources
- **Update drivers**: Ensure graphics drivers are current
- **Lower quality**: Reduce `modelComplexity` in hand tracking options
- **Browser**: Try Chrome/Edge for best performance

### Items Not Responding
- **Gesture clarity**: Make distinct hand shapes
- **Distance**: Get closer to items (within hover range)
- **Refresh**: Reload the page to reset physics

## 🔧 Advanced Configuration

### Physics Tweaking
Adjust physics parameters in `initPhysics()`:

```javascript
// Gravity strength
this.world.gravity.set(0, -9.82, 0);

// Friction and bounce
this.world.defaultContactMaterial.friction = 0.3;
this.world.defaultContactMaterial.restitution = 0.4;
```

### Hand Tracking Optimization

Modify MediaPipe settings:

```javascript
this.hands.setOptions({
    maxNumHands: 2,              // Number of hands to track
    modelComplexity: 1,           // 0=lite, 1=full (accuracy vs speed)
    minDetectionConfidence: 0.5,  // Lower = more sensitive
    minTrackingConfidence: 0.5    // Lower = less jitter
});
```

## 📱 Browser Compatibility

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome 90+ | ✅ Excellent | Recommended |
| Edge 90+ | ✅ Excellent | Recommended |
| Firefox 88+ | ✅ Good | May need HTTPS |
| Safari 14+ | ⚠️ Limited | WebRTC limitations |
| Mobile | ❌ Not optimized | Desktop only |

## 🚀 Future Enhancements

- [ ] Two-hand support for advanced gestures
- [ ] Voice commands for product search
- [ ] Barcode scanning integration
- [ ] Checkout and payment simulation
- [ ] Multi-aisle store expansion
- [ ] Product recommendations
- [ ] Gesture training mode
- [ ] VR/AR headset support
- [ ] Multiplayer shopping

## 📄 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

- **MediaPipe** by Google for hand tracking technology
- **Three.js** for powerful 3D graphics
- **Cannon.js** for physics simulation
- **WebRTC** for camera access

## 📧 Support

For issues, questions, or suggestions, please open an issue on the repository.

---

**Built with ❤️ using hand tracking and 3D graphics**

**Ready to shop? Just wave your hand! 👋🛒**