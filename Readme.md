# WebRTC Video Meeting App

This is a simple WebRTC-based video conferencing application using **Express.js** and **WebSockets** (`ws`). The app allows users to create or join a meeting, enabling real-time audio and video communication.

## Features
- Single-page interface (index.html)
- Users must grant media permissions before proceeding
- Ability to create or join a meeting
- Peer-to-peer video and audio sharing
- Supports multiple participants
- In-memory meeting and participant management
- Echo cancellation and noise suppression for better audio quality
- Users can leave a meeting anytime

## Installation & Setup
### 1. Clone the Repository
```sh
git clone https://github.com/vasudeogaichor/webrtc-demo.git
cd webrtc-demo
```

### 2. Install Dependencies
```sh
npm install
```

### 3. Run the Server
```sh
node server.js
```

The server will start on `http://localhost:3000`

## How It Works
1. **Open the app** in your browser (`localhost:3000`).
2. Grant access to your camera and microphone.
3. Click **"Create Meeting"** to start a new meeting or enter a **Meeting ID** and click **"Join Meeting"**.
4. Share the **Meeting ID** with others.
5. When participants join, their video streams will appear.
6. Click **"Leave Meeting"** to exit.

## WebRTC Implementation
- **Media Access:** Uses `navigator.mediaDevices.getUserMedia()`
- **WebSocket Communication:** Handles signaling between peers
- **Peer Connection:** Uses `RTCPeerConnection` to establish direct media streams
- **ICE Candidate Handling:** Ensures reliable peer-to-peer connections
- **Echo Cancellation:** Enabled in `getUserMedia` to prevent audio feedback

<!-- ## Echo Issue Fixes
To prevent voice echoing:
- Local video is **muted** (`localVideoMeeting.muted = true`)
- Enabled `echoCancellation`, `noiseSuppression`, and `autoGainControl` in `getUserMedia`
- Prevented duplicate audio streams
- **Use headphones** for best results -->

<!-- ## Future Improvements
- Implement a signaling server for better scalability
- Add a chat feature for text communication
- Support for screen sharing -->

## License
This project is open-source under the **MIT License**.

---
Developed with ❤️ using WebRTC and WebSockets 🚀

