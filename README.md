# 🛒 3D VR Grocery Store - Hand Tracking Experience

An immersive, fully 3D virtual grocery store interface with VR aesthetics, controlled entirely via webcam hand tracking. Reach out, grab, inspect, and toss realistic grocery items into your cart using natural hand gestures!

## ✨ Features

### 🎮 Gesture Controls
- **👊 Grab**: Close your fist to grab items from shelves
- **🤚 Release**: Open your hand to release items
- **👌 Pinch**: Pinch with thumb and index to rotate and inspect items
- **💨 Swipe**: Fast hand movements to toss items (swipe left towards cart to add to cart)

### 🎨 Immersive VR Experience
- **3D Environment**: Spacious grocery store with shelves, floor, walls, and atmospheric lighting
- **Realistic Physics**: Items roll, bounce, and wobble with real-world physics simulation
- **Hand Visualization**: Your hands appear in 3D with glowing effects and motion trails
- **Visual Feedback**: Particle effects, motion trails, and on-screen messages for all interactions
- **VR Aesthetics**: Cyberpunk-inspired neon lighting, glow effects, and futuristic design

### 🛍️ Interactive Shopping
- **9 Different Items**: Cans, boxes, bottles, and fresh produce with unique physics properties
- **Shopping Cart**: Toss items into your cart with satisfying physics
- **Item Labels**: Hover to see item names in floating 3D labels
- **Real-time Counter**: Track how many items you've added to your cart

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- A webcam
- Modern web browser (Chrome, Firefox, or Edge recommended)

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### First Launch

1. When the app loads, **allow webcam access** when prompted
2. Position yourself so your hands are visible in the small webcam preview (top-right corner)
3. Wait for "Hand tracking initialized" status
4. Start interacting with items on the shelves!

## 🎯 How to Use

### Getting Started
1. **Hand Detection**: Make sure your hands are clearly visible to the webcam
2. **Lighting**: Ensure good lighting for better hand tracking accuracy
3. **Distance**: Stay about 1-2 feet away from the camera for optimal tracking

### Grabbing Items
1. Move your hand near an item on a shelf
2. Make a **closed fist** gesture
3. The item will highlight with a cyan glow when grabbed
4. Move your hand while keeping the fist closed to move the item

### Inspecting Items
1. While holding an item, make a **pinch gesture** (thumb and index finger together)
2. Rotate your hand to spin and inspect the item from all angles
3. Item labels will always face you for easy reading

### Adding to Cart
1. Grab an item
2. Make a **fast swiping motion to the left** (towards the cart)
3. The item will arc through the air and land in the orange cart
4. You'll see a "Added to Cart! 🛒" message and particle effects
5. The cart counter will update

### Just Playing Around
- You can toss items anywhere by making fast swipe gestures in any direction
- Released items will fall naturally with realistic physics
- Spherical items (fruits) will roll, boxes will tumble, cans will bounce

## 🛠️ Technical Details

### Technology Stack
- **Three.js**: 3D rendering and graphics
- **MediaPipe Hands**: Real-time hand tracking
- **Cannon.js**: Physics simulation
- **Vite**: Build tool and development server

### Architecture
```
src/
├── main.js          # Application entry point and orchestration
├── scene.js         # Three.js scene setup and lighting
├── handTracking.js  # MediaPipe webcam hand tracking
├── gestures.js      # Gesture recognition (grab, pinch, swipe)
├── physics.js       # Physics world and collision detection
├── groceryStore.js  # Store environment (shelves, floor, cart)
├── items.js         # Grocery item models and interactions
├── hands3D.js       # 3D hand visualization with glow effects
└── feedback.js      # Visual feedback system (particles, trails)
```

### Performance
- Optimized for 60 FPS on modern hardware
- Adaptive physics timestep for smooth simulation
- Efficient hand tracking at 30 FPS
- Shadow mapping and post-processing for visual quality

## 🎨 Customization

### Adding New Items
Edit `src/items.js` to add new item types:

```javascript
const itemTypes = [
    { type: 'can', name: 'Your Item', color: 0xff0000, shelf: 0 },
    // Add more items...
];
```

### Changing Colors
Modify the color scheme in `style.css` and the material colors in scene files.

### Adjusting Physics
Tweak physics parameters in `src/physics.js`:
- Gravity strength
- Friction and restitution values
- Object masses

## 🐛 Troubleshooting

### Hand tracking not working
- Check webcam permissions in browser settings
- Ensure good lighting conditions
- Try refreshing the page
- Check the webcam preview in the top-right corner

### Poor performance
- Close other browser tabs
- Reduce browser window size
- Check if hardware acceleration is enabled in browser settings

### Items not responding
- Make sure hands are clearly visible
- Try making more deliberate gestures
- Check the hand status indicator (should be green)

## 📝 License

MIT License - Feel free to use and modify!

## 🎉 Credits

Built with:
- [Three.js](https://threejs.org/)
- [MediaPipe](https://google.github.io/mediapipe/)
- [Cannon.js](https://schteppe.github.io/cannon.js/)
- [Vite](https://vitejs.dev/)

---

**Enjoy your virtual shopping experience! 🛒✨**