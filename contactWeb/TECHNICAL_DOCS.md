# Technical Documentation - Audio Transcription System

## Overview

This document provides comprehensive technical details about the audio transcription system implemented in the weather app, including API endpoints, React hooks, and their integration patterns.

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React App     │    │   Audio Hooks    │    │   API Routes    │
│                 │    │                  │    │                 │
│ - Page.tsx      │◄──►│ - useAudioRecorder│◄──►│ - /api/transcribe│
│ - Dual Triggers │    │ - useWebSocket   │    │ - /api/socket   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │  OpenAI Whisper │
                       │     API         │
                       └─────────────────┘
```

## API Endpoints

### 1. `/api/transcribe` (POST)

**Purpose**: Transcribes audio data using OpenAI Whisper API

**Request Body**:
```typescript
{
  audioData: string;    // Base64 encoded audio data
  format: string;       // Audio format: 'webm', 'mp4', 'ogg', 'wav'
}
```

**Response**:
```typescript
// Success
{
  success: true;
  transcription: string;
  timestamp: number;
}

// Error
{
  success: false;
  error: string;
  details?: string;
  reason?: string;
}
```

**Features**:
- Audio format validation and MIME type mapping
- Size validation (2KB minimum, 50MB maximum)
- Automatic format detection for combined audio chunks
- Comprehensive error handling with specific messages

**Error Codes**:
- `400`: Invalid audio data or format
- `500`: OpenAI API errors or server issues

### 2. `/api/socket` (WebSocket)

**Purpose**: Real-time audio streaming for production deployment

**Message Types**:
```typescript
// Client to Server
{
  type: 'audioData';
  data: string;  // Base64 encoded audio
}

// Server to Client
{
  type: 'transcriptionUpdate';
  text: string;  // Transcribed text
}
```

**Features**:
- Edge Runtime compatible for Vercel deployment
- Automatic reconnection handling
- Real-time transcription streaming

## React Hooks

### 1. `useAudioRecorder`

**Purpose**: Manages audio recording with intelligent batching and speech detection

**Signature**:
```typescript
const useAudioRecorder = (onAudioData: (data: Blob) => void) => {
  // Returns state and methods
}
```

**State**:
```typescript
interface AudioRecorderState {
  isRecording: boolean;
  isSupported: boolean;
  hasPermission: boolean;
  error: string | null;
}
```

**Methods**:
```typescript
{
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  requestPermission: () => Promise<boolean>;
  cleanup: () => void;
}
```

**Key Features**:

#### Audio Content Detection
```typescript
const hasAudioContent = (audioData: Blob): Promise<boolean> => {
  // Analyzes audio using Web Audio API
  // Calculates RMS (Root Mean Square) for speech detection
  // Returns true if RMS > 0.01 threshold
}
```

#### Chunk Batching System
- Collects 7 audio chunks (21 seconds total)
- Only sends batches containing meaningful speech
- Automatic batch reset after sending
- Final batch handling on stop

#### Continuous Recording
- 3-second chunk intervals
- Automatic chunk continuation
- Error recovery with restart mechanism
- Stream reuse for efficiency

**Internal State Management**:
```typescript
const audioChunksRef = useRef<Blob[]>([]);
const chunkCountRef = useRef(0);
const hasSpeechInBatchRef = useRef(false);
const BATCH_SIZE = 7; // 21 seconds total
```

### 2. `useWebSocket`

**Purpose**: Manages WebSocket connection and transcription data flow

**Signature**:
```typescript
const useWebSocket = () => {
  // Returns state and methods
}
```

**State**:
```typescript
interface WebSocketState {
  isConnected: boolean;
  isRecording: boolean;
  transcription: string;
  error: string | null;
  isDevelopment: boolean;
}
```

**Methods**:
```typescript
{
  connect: () => void;
  disconnect: () => void;
  sendAudioData: (audioData: ArrayBuffer | Blob) => void;
  startRecording: () => void;
  stopRecording: () => void;
  clearTranscription: () => void;
}
```

**Key Features**:

#### Development Mode
- Simulates WebSocket functionality
- Direct API calls to `/api/transcribe`
- Automatic format detection from Blob MIME type
- Comprehensive logging for debugging

#### Production Mode
- Real WebSocket connection to `/api/socket`
- Base64 encoding for audio transmission
- Automatic reconnection on connection loss
- Error handling with retry logic

## Integration Patterns

### 1. Dual Trigger System

**Implementation**:
```typescript
// Separate tap counters for each icon
const [sunriseTapCount, setSunriseTapCount] = useState(0);
const [sunsetTapCount, setSunsetTapCount] = useState(0);

// Sunrise handler - Start recording
const handleSunriseTap = () => {
  // 3-tap logic for starting recording
};

// Sunset handler - Stop recording
const handleSunsetTap = () => {
  // 3-tap logic for stopping recording
};
```

**Features**:
- Independent tap counters
- 2-second timeout for tap sequences
- Visual feedback with toast notifications
- State validation (can't start if already recording)

### 2. Audio Data Flow

```typescript
// 1. Audio recording starts
audioStartRecording();

// 2. Chunks are processed
mediaRecorder.ondataavailable = async (event) => {
  const hasContent = await hasAudioContent(event.data);
  if (hasContent) {
    audioChunksRef.current.push(event.data);
    // Check if batch is ready
  }
};

// 3. Batch is sent to transcription
const sendBatchToTranscription = async () => {
  const combinedBlob = new Blob(audioChunksRef.current, { type: mimeType });
  onAudioData(combinedBlob); // Calls useWebSocket.sendAudioData
};

// 4. WebSocket sends to API
sendAudioData(combinedBlob); // Development: direct API call, Production: WebSocket
```

### 3. Error Handling

**Audio Recording Errors**:
- Permission denied handling
- Stream initialization failures
- MediaRecorder state errors
- Automatic recovery mechanisms

**API Errors**:
- Rate limiting (429) handling
- Format validation errors
- Network connectivity issues
- Graceful degradation

**WebSocket Errors**:
- Connection failures
- Message parsing errors
- Automatic reconnection
- Fallback to development mode

## Configuration

### Environment Variables

```env
# Required for transcription
NEXT_ANON_OPENAI_KEY=your_openai_api_key

# Optional for production
VERCEL_URL=https://your-app.vercel.app
```

### Audio Settings

```typescript
// MediaRecorder configuration
const audioConfig = {
  echoCancellation: true,
  noiseSuppression: true,
  sampleRate: 16000,
  channelCount: 1,
};

// Supported MIME types (in order of preference)
const mimeTypes = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/mp4',
  'audio/ogg;codecs=opus',
  'audio/wav'
];
```

### Batching Configuration

```typescript
const BATCH_SIZE = 7;           // Number of chunks per batch
const CHUNK_DURATION = 3000;    // Milliseconds per chunk
const SPEECH_THRESHOLD = 0.01;  // RMS threshold for speech detection
const MIN_AUDIO_SIZE = 2000;    // Minimum bytes for transcription
const MAX_AUDIO_SIZE = 50000000; // Maximum bytes for transcription
```

## Performance Optimizations

### 1. Audio Processing
- RMS calculation for efficient speech detection
- Blob combination for reduced API calls
- Stream reuse to minimize resource usage
- Automatic cleanup on component unmount

### 2. API Efficiency
- 21-second batching reduces API calls by ~85%
- Speech-only filtering eliminates wasted calls
- Base64 encoding optimization
- Error recovery without data loss

### 3. Memory Management
- Automatic garbage collection of audio contexts
- Stream track cleanup
- Blob disposal after processing
- Reference cleanup on unmount

## Development vs Production

### Development Mode
```typescript
if (process.env.NODE_ENV === 'development') {
  // Simulate WebSocket
  // Direct API calls
  // Enhanced logging
  // No real-time streaming
}
```

### Production Mode
```typescript
// Real WebSocket connection
// Edge Runtime compatibility
// Real-time transcription
// Optimized for Vercel deployment
```

## Troubleshooting

### Common Issues

1. **"Audio recording is not supported"**
   - Check browser compatibility
   - Ensure HTTPS in production
   - Verify microphone permissions

2. **"Failed to transcribe audio"**
   - Check OpenAI API key
   - Verify audio format compatibility
   - Check rate limiting status

3. **"WebSocket connection failed"**
   - Development: Normal (simulated)
   - Production: Check Vercel deployment
   - Verify Edge Runtime configuration

### Debug Logging

Enable detailed logging by checking browser console:
```
🎵 Audio analysis - RMS: 0.023456 Threshold: 0.01 Has content: true
📦 Batch progress: 3/7 chunks (has speech)
📤 Sending batch to transcription (21 seconds of audio with speech)
🎤 DEVELOPMENT TRANSCRIPTION RECEIVED: Hello, this is a test
```

## Security Considerations

1. **API Key Protection**
   - Server-side only usage
   - Environment variable storage
   - No client-side exposure

2. **Audio Data**
   - Base64 encoding for transmission
   - Temporary storage only
   - Automatic cleanup

3. **Permissions**
   - Explicit user consent required
   - Graceful permission denial handling
   - Clear permission request messaging

## Future Enhancements

1. **Advanced Speech Detection**
   - Machine learning-based detection
   - Noise reduction algorithms
   - Speaker identification

2. **Real-time Features**
   - Live transcription display
   - Multiple language support
   - Custom vocabulary training

3. **Performance Improvements**
   - WebAssembly audio processing
   - Service Worker caching
   - Progressive Web App features 