# 🖥️ Server Documentation - MSHack Mobile Backend

## 📋 Overview

The server component is a Node.js backend built with Express.js and Socket.IO that provides:
- **Weather API** - Location-based weather data
- **Audio Transcription** - Real-time audio processing with OpenAI Whisper
- **WebSocket Communication** - Real-time bidirectional communication with mobile app
- **File Processing** - Audio format conversion and validation

## 🏗️ Architecture

### Technology Stack
- **Runtime**: Node.js 18+
- **Framework**: Express.js 4.18+
- **Real-time**: Socket.IO 4.7+
- **Audio Processing**: FFmpeg with fluent-ffmpeg
- **AI Integration**: OpenAI Whisper API
- **File Handling**: Multer for multipart uploads
- **Language**: TypeScript
- **Development**: Nodemon for hot reloading

### Project Structure
```
server/
├── src/
│   ├── index.ts              # Main server entry point
│   └── routes/
│       ├── weather.ts        # Weather API endpoints
│       └── transcribe.ts     # Audio transcription endpoints
├── dist/                     # Compiled JavaScript output
├── temp/                     # Temporary audio files (auto-cleaned)
├── package.json             # Dependencies and scripts
├── tsconfig.json           # TypeScript configuration
├── nodemon.json            # Development server config
├── env.example             # Environment variables template
└── README.md               # Server-specific documentation
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm 8+
- OpenAI API key
- FFmpeg (handled by @ffmpeg-installer/ffmpeg)

### Installation
```bash
cd server
npm install
cp env.example .env
# Edit .env with your OpenAI API key
```

### Development
```bash
npm run dev    # Start with nodemon (hot reload)
```

### Production
```bash
npm run build  # Compile TypeScript
npm start      # Start production server
```

## 🔌 API Endpoints

### Weather API

#### GET `/api/weather`
Get weather data for a location.

**Query Parameters:**
- `city` (string, optional): City name
- `lat` (number, optional): Latitude
- `lon` (number, optional): Longitude

**Request Examples:**
```bash
# By city name
GET /api/weather?city=New%20York

# By coordinates
GET /api/weather?lat=40.7128&lon=-74.0060
```

**Response:**
```json
{
  "name": "New York",
  "main": {
    "temp": 72,
    "feels_like": 74,
    "humidity": 65,
    "pressure": 1013
  },
  "weather": [
    {
      "main": "Clear",
      "description": "clear sky",
      "icon": "01d"
    }
  ],
  "wind": {
    "speed": 5.2
  },
  "visibility": 10000,
  "sys": {
    "sunrise": 1640995200,
    "sunset": 1641031200
  }
}
```

**Error Response:**
```json
{
  "error": "City name or coordinates required"
}
```

### Transcription API

#### POST `/api/transcribe/file`
Upload an audio file for transcription.

**Request:**
- Content-Type: `multipart/form-data`
- Body: `audio` file

**Request Example:**
```bash
curl -X POST http://localhost:3001/api/transcribe/file \
  -F "audio=@recording.webm"
```

**Response:**
```json
{
  "success": true,
  "text": "Hello, this is a test recording.",
  "timestamp": 1640995200000
}
```

#### POST `/api/transcribe/base64`
Send base64-encoded audio data for transcription.

**Request Body:**
```json
{
  "audioData": "UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT..."
}
```

**Response:**
```json
{
  "success": true,
  "text": "Transcribed audio content",
  "timestamp": 1640995200000
}
```

### Health Check

#### GET `/health`
Get server status and uptime information.

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "uptime": 3600.5
}
```

## 🔌 WebSocket Events

### Connection
```javascript
const socket = io('http://localhost:3001');
```

### Client to Server Events

#### `audioData`
Send audio data for real-time transcription.

**Payload:**
```json
{
  "audioData": "base64_encoded_audio_data",
  "format": "webm"
}
```

**Example:**
```javascript
socket.emit('audioData', {
  audioData: "UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT...",
  format: "webm"
});
```

### Server to Client Events

#### `transcriptionUpdate`
Receive transcription results or error messages.

**Success Payload:**
```json
{
  "success": true,
  "text": "Transcribed audio content",
  "timestamp": 1640995200000
}
```

**Error Payload:**
```json
{
  "success": false,
  "error": "Error message",
  "reason": "Reason for failure"
}
```

**Example:**
```javascript
socket.on('transcriptionUpdate', (data) => {
  if (data.success) {
    console.log('Transcription:', data.text);
  } else {
    console.error('Transcription failed:', data.error);
  }
});
```

## 🎤 Audio Processing

### Supported Formats
- **Input**: webm, mp4, ogg, wav, m4a, mp3
- **Processing**: Automatic conversion to MP3 if needed
- **Output**: Text transcription via OpenAI Whisper

### Processing Pipeline

1. **Validation**
   - File size check (2KB - 50MB)
   - MIME type validation
   - Format detection

2. **Storage**
   - Temporary file creation
   - Unique filename generation
   - Automatic cleanup

3. **Conversion**
   - FFmpeg-based format conversion
   - MP3 encoding for compatibility
   - Quality preservation

4. **Transcription**
   - OpenAI Whisper API call
   - English language detection
   - Text response format

5. **Cleanup**
   - Temporary file deletion
   - Memory cleanup
   - Error handling

### Audio Processing Settings

```javascript
// File size limits
const MIN_FILE_SIZE = 2000;        // 2KB
const MAX_FILE_SIZE = 50000000;    // 50MB

// Supported MIME types
const VALID_MIME_TYPES = [
  'audio/webm',
  'audio/mp4', 
  'audio/ogg',
  'audio/wav',
  'audio/mpeg',
  'audio/mp3'
];

// FFmpeg conversion settings
const FFMPEG_SETTINGS = {
  format: 'mp3',
  audioCodec: 'libmp3lame',
  audioBitrate: 128
};
```

## ⚙️ Configuration

### Environment Variables

Create a `.env` file based on `env.example`:

```bash
# Server Configuration
PORT=3001
NODE_ENV=development

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Weather API (optional - for production)
WEATHER_API_KEY=your_weather_api_key_here
```

### Development Configuration

#### nodemon.json
```json
{
  "watch": ["src"],
  "ext": "ts,js",
  "ignore": ["src/**/*.spec.ts"],
  "exec": "ts-node src/index.ts"
}
```

#### tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

## 🔒 Security & Validation

### Input Validation
- **File Size**: 2KB minimum, 50MB maximum
- **MIME Types**: Whitelist of supported audio formats
- **Base64 Data**: Validation and size checking
- **API Keys**: Environment variable protection

### Error Handling
```javascript
// Graceful error responses
res.status(500).json({
  success: false,
  error: error instanceof Error ? error.message : 'Unknown error'
});

// Input validation
if (!audioData) {
  return res.status(400).json({ error: 'No audio data provided' });
}
```

### Rate Limiting
- Built-in protection against OpenAI rate limits
- Request throttling for large files
- Connection timeout handling

## 📊 Monitoring & Logging

### Console Logging
```javascript
// Connection events
console.log('🔌 Client connected:', socket.id);
console.log('🔌 Client disconnected:', socket.id);

// Audio processing
console.log('🎵 Processing audio:', { size, format });
console.log('✅ Transcription successful:', text);

// Error logging
console.error('❌ Transcription error:', error);
```

### Health Monitoring
- Server uptime tracking
- Connection status monitoring
- Error rate monitoring
- Performance metrics

## 🚀 Deployment

### Production Build
```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Set environment variables
export NODE_ENV=production
export OPENAI_API_KEY=your_production_key

# Start server
npm start
```

### Docker Deployment
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist ./dist

EXPOSE 3001

CMD ["node", "dist/index.ts"]
```

### Environment Considerations
- **Memory**: Ensure sufficient RAM for audio processing
- **Storage**: Temporary file storage space
- **Network**: Stable connection for OpenAI API calls
- **CPU**: FFmpeg processing requirements

## 🐛 Troubleshooting

### Common Issues

1. **Audio Transcription Fails**
   ```bash
   # Check OpenAI API key
   echo $OPENAI_API_KEY
   
   # Check server logs
   npm run dev
   ```

2. **WebSocket Connection Issues**
   ```javascript
   // Check connection status
   socket.on('connect', () => console.log('Connected'));
   socket.on('disconnect', () => console.log('Disconnected'));
   ```

3. **File Upload Errors**
   ```bash
   # Check file size limits
   ls -la audio_file.webm
   
   # Check MIME type
   file --mime-type audio_file.webm
   ```

### Debug Mode
```bash
# Enable detailed logging
NODE_ENV=development DEBUG=* npm run dev
```

### Performance Optimization
- Audio chunking for large files
- Parallel processing for multiple requests
- Memory management for temporary files
- Connection pooling for database operations

## 📚 API Reference

### Weather Router (`/src/routes/weather.ts`)
- `GET /` - Get weather data by city or coordinates

### Transcription Router (`/src/routes/transcribe.ts`)
- `POST /file` - Upload audio file for transcription
- `POST /base64` - Send base64 audio data for transcription

### Main Server (`/src/index.ts`)
- WebSocket event handling
- Audio processing pipeline
- File cleanup and error handling

## 🔄 Updates & Maintenance

### Regular Maintenance
- Update dependencies: `npm update`
- Clean temporary files: `rm -rf temp/*`
- Monitor disk space usage
- Check OpenAI API usage limits

### Backup Strategy
- Environment variable backup
- Configuration file versioning
- Log file rotation
- Database backup (if applicable)

---

**⚠️ Important**: This server processes audio data and communicates with external APIs. Ensure proper security measures and compliance with data protection regulations. 