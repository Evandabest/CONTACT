# Weather App Server

Node.js backend server for the weather app with audio transcription capabilities.

## 🏗️ Architecture

- **Express.js**: REST API framework
- **Socket.IO**: Real-time WebSocket communication
- **OpenAI Whisper**: Audio transcription service
- **Multer**: File upload handling
- **TypeScript**: Type-safe development

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- OpenAI API key

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp env.example .env
   # Edit .env and add your OpenAI API key
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Build for production**
   ```bash
   npm run build
   npm start
   ```

## 📡 API Endpoints

### Weather API

#### GET `/api/weather`
Get weather data for a location.

**Query Parameters:**
- `city` (string): City name
- `lat` (number): Latitude
- `lon` (number): Longitude

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

### Transcription API

#### POST `/api/transcribe/file`
Transcribe an uploaded audio file.

**Request:**
- Content-Type: `multipart/form-data`
- Body: `audio` file

**Response:**
```json
{
  "success": true,
  "text": "Transcribed audio content",
  "timestamp": 1640995200000
}
```

#### POST `/api/transcribe/base64`
Transcribe base64-encoded audio data.

**Request Body:**
```json
{
  "audioData": "base64_encoded_audio",
  "format": "webm"
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

## 🔌 WebSocket Events

### Client to Server

#### `audioData`
Send audio data for transcription.

**Payload:**
```json
{
  "audioData": "base64_encoded_audio",
  "format": "webm"
}
```

### Server to Client

#### `transcriptionUpdate`
Receive transcription results.

**Payload:**
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

## ⚙️ Configuration

### Environment Variables

```bash
# Server Configuration
PORT=3001
NODE_ENV=development

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Weather API (optional - for production)
WEATHER_API_KEY=your_weather_api_key_here
```

### Audio Processing Settings

- **Max File Size**: 50MB
- **Min File Size**: 2KB
- **Supported Formats**: webm, mp4, ogg, wav, mp3
- **Chunk Size**: 3 seconds
- **Batch Size**: 7 chunks (21 seconds)

## 🔒 Security

### Input Validation
- File size limits
- MIME type validation
- Audio format verification
- Base64 data validation

### Error Handling
- Graceful error responses
- Detailed error logging
- Rate limiting protection
- Input sanitization

## 📊 Monitoring

### Health Check
- **Endpoint**: `GET /health`
- **Response**: Server status and uptime

### Logging
- Connection events
- Audio processing status
- Transcription results
- Error tracking

## 🐛 Troubleshooting

### Common Issues

1. **OpenAI API Errors**
   - Verify API key is valid
   - Check API usage limits
   - Ensure audio format is supported

2. **File Upload Issues**
   - Check file size limits
   - Verify MIME type
   - Ensure proper multipart encoding

3. **WebSocket Connection**
   - Check CORS settings
   - Verify client connection
   - Monitor network connectivity

4. **Audio Processing**
   - Validate audio quality
   - Check chunk size settings
   - Monitor memory usage

### Debug Mode
Enable detailed logging by setting `NODE_ENV=development`.

## 📈 Performance

### Optimization Features
- Audio chunking for large files
- Batch processing for efficiency
- Memory-efficient file handling
- Connection pooling

### Monitoring
- Request/response times
- Memory usage tracking
- Error rate monitoring
- Connection statistics

## 🔄 Development

### Scripts
- `npm run dev`: Start development server with hot reload
- `npm run build`: Build TypeScript to JavaScript
- `npm start`: Start production server
- `npm test`: Run tests

### Code Structure
```
src/
├── index.ts              # Main server file
├── routes/               # API route handlers
│   ├── weather.ts        # Weather API endpoints
│   └── transcribe.ts     # Transcription API endpoints
└── types/                # TypeScript type definitions
```

## 📄 License

MIT License - see LICENSE file for details 