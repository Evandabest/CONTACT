# Operator Dashboard

A real-time emergency response and monitoring system that displays live video and audio streams from mobile devices.

## Features

- **Real-time Media Streaming**: Live video and audio feeds from emergency mobile devices
- **Photo Capture**: Instant photo capture and display during emergency situations
- **Audio Transcription**: Real-time speech-to-text conversion of emergency audio
- **Media History**: Browse and review past emergency media files
- **Server Configuration**: Easy connection management to the backend server
- **Responsive Design**: Works on desktop and mobile devices

## Prerequisites

- Node.js (v16 or higher)
- The backend server running (see server documentation)

## Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser to `http://localhost:5173`

## Server Integration

The dashboard connects to a Node.js server that handles:
- WebSocket connections for real-time media streaming
- Media file storage and retrieval
- Audio transcription using OpenAI Whisper
- Emergency trigger system from mobile devices

### Server Configuration

1. Click the "⚙️ Server Configuration" button in the top-right corner
2. Enter your server URL (default: `http://localhost:3001`)
3. Click "Connect" to establish the connection
4. Monitor connection status and server health

### Real-time Features

- **Live Feed**: Displays the most recent emergency media as it's received
- **Transcription**: Shows real-time audio transcription from emergency calls
- **Media History**: Browse recent photos and videos from emergency situations

## Emergency Flow

1. **Mobile App Trigger**: 3 taps on Sunrise button activates emergency mode
2. **Audio Recording**: Starts immediately and streams to server
3. **Photo Capture**: Takes photo after 1 second delay
4. **Video Recording**: Starts after 2 seconds delay
5. **Real-time Display**: All media appears instantly on the operator dashboard
6. **Transcription**: Audio is converted to text in real-time

## API Endpoints

The dashboard communicates with the server via:

- **WebSocket Events**:
  - `photoData`: Receives emergency photos
  - `videoData`: Receives emergency videos
  - `audioData`: Receives emergency audio
  - `transcriptionUpdate`: Receives audio transcription results

- **REST Endpoints**:
  - `GET /api/media/photos`: List stored photos
  - `GET /api/media/videos`: List stored videos
  - `GET /media/photos/{filename}`: Serve photo files
  - `GET /media/videos/{filename}`: Serve video files
  - `GET /health`: Server health check

## Development

### Project Structure

```
src/
├── components/
│   ├── LiveFeed.jsx          # Main media display component
│   ├── LiveFeed.css          # LiveFeed styles
│   ├── ServerConfig.jsx      # Server configuration component
│   └── ServerConfig.css      # ServerConfig styles
├── services/
│   ├── socketService.js      # WebSocket connection management
│   └── mediaService.js       # Media API communication
├── App.jsx                   # Main application component
└── App.css                   # Application styles
```

### Key Components

- **LiveFeed**: Handles real-time media display and transcription
- **ServerConfig**: Manages server connection and configuration
- **socketService**: WebSocket communication with the server
- **mediaService**: REST API communication for media files

## Troubleshooting

### Connection Issues

1. Ensure the backend server is running on the correct port
2. Check the server URL in the configuration panel
3. Verify CORS settings on the server
4. Check browser console for error messages

### Media Not Displaying

1. Verify server media storage directories exist
2. Check file permissions on the server
3. Ensure media files are being saved correctly
4. Check network connectivity between frontend and server

### Audio Transcription Issues

1. Verify OpenAI API key is configured on the server
2. Check audio file format compatibility
3. Ensure audio data is being sent correctly from mobile app

## Production Deployment

1. Build the application:
```bash
npm run build
```

2. Deploy the `dist` folder to your web server
3. Configure the server URL for production
4. Set up proper CORS and security headers
5. Consider implementing authentication for production use

## Security Considerations

- Media files are stored locally on the server
- No authentication is implemented (for development)
- Consider implementing user authentication for production
- Secure WebSocket connections with proper validation
- Implement rate limiting for media uploads
