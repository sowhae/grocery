# Troubleshooting Guide

## Quick Fix Checklist

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Dev Server
```bash
npm run dev
```

The app will open at `http://localhost:3000/`

### 3. Grant Webcam Permissions
- Your browser will ask for camera access
- Click "Allow" when prompted
- Make sure no other apps are using your webcam

## Common Issues

### "npm: command not found"
- Install Node.js from https://nodejs.org/ (v16 or higher)
- Restart your terminal after installing

### Webcam not working
- **Chrome**: Go to Settings → Privacy and security → Site Settings → Camera
- **Firefox**: Go to Preferences → Privacy & Security → Permissions → Camera
- **Make sure you're on HTTPS or localhost** (some browsers block webcam on HTTP)

### Black screen / Nothing loads
1. Open browser console (F12 or Ctrl+Shift+I)
2. Look for errors in the Console tab
3. Common fixes:
   - Refresh the page (Ctrl+R or Cmd+R)
   - Clear browser cache
   - Try a different browser (Chrome recommended)
   - Make sure hardware acceleration is enabled in browser settings

### "Hand tracking failed" error
- Check browser console for specific error
- Make sure you're using a modern browser (Chrome 90+, Firefox 88+, Edge 90+)
- Try refreshing the page
- Check if webcam works in other apps

### Items don't respond to hand gestures
- Make sure your hands are clearly visible in the webcam preview (top-right)
- Check the hand status indicator (should be green when hands detected)
- Ensure good lighting conditions
- Try moving your hands slower and making more deliberate gestures
- Make sure you're about 1-2 feet from the camera

### Poor performance / Laggy
- Close other browser tabs
- Close other applications
- Try reducing browser window size
- Check Task Manager - make sure GPU is being used
- Enable hardware acceleration:
  - Chrome: Settings → System → "Use hardware acceleration when available"
  - Firefox: Preferences → General → Performance → "Use hardware acceleration when available"

### MediaPipe loading errors
If you see errors about MediaPipe models not loading:
- Check your internet connection (models load from CDN)
- Try clearing browser cache
- Check browser console for specific 404 errors
- Make sure you're not behind a restrictive firewall

## Browser Compatibility

### Recommended:
- Chrome 90+ ✅
- Edge 90+ ✅

### Supported:
- Firefox 88+ ⚠️ (may have performance issues)

### Not Supported:
- Safari (WebGL and MediaPipe limitations)
- Internet Explorer (deprecated)
- Mobile browsers (hand tracking requires desktop webcam)

## Debug Mode

Open browser console (F12) and look for these messages:

**Good signs:**
```
Hand tracking initialized successfully
Loading VR Grocery Store...
```

**Bad signs:**
```
Failed to initialize hand tracking
MediaPipe error
WebGL not supported
```

## Still Not Working?

1. Check the browser console (F12) for errors
2. Try the minimal test:
   ```bash
   # In the project directory
   npm run build
   npm run preview
   ```

3. Make sure all files are present:
   ```bash
   ls -la src/
   # Should show: main.js, scene.js, handTracking.js, gestures.js,
   #              physics.js, groceryStore.js, items.js, hands3D.js, feedback.js
   ```

4. Check Node.js version:
   ```bash
   node --version  # Should be v16.0.0 or higher
   npm --version   # Should be 7.0.0 or higher
   ```

## Getting Help

If you're still stuck:
1. Note the exact error message from browser console
2. Note your OS, browser, and version
3. Check if webcam works in other apps
4. Try running on a different computer to isolate the issue
