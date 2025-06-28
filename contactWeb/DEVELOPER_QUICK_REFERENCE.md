# Developer Quick Reference - Audio Transcription System

## Quick Start

### 1. Setup Environment
```bash
# Install dependencies
npm install

# Set environment variable
echo "NEXT_ANON_OPENAI_KEY=your_openai_api_key" > .env.local

# Start development server
npm run dev
```

### 2. Test the Secret Feature
1. Open the weather app
2. Search for any city to load weather data
3. **Start Recording**: Tap sunrise icon 3 times quickly
4. **Speak**: Talk into your microphone
5. **Stop Recording**: Tap sunset icon 3 times quickly
6. **Check Console**: View transcription results

## File Structure

```
app/
├── hooks/
│   ├── useAudioRecorder.ts    # Audio recording & batching
│   └── useWebSocket.ts        # WebSocket & transcription
├── api/
│   ├── transcribe/
│   │   └── route.ts          # OpenAI Whisper API
│   └── socket/
│       └── route.ts          # WebSocket endpoint
└── page.tsx                  # Main app with dual triggers
```

## Key Components

### Audio Recording Hook
```typescript
// Usage
const {
  isRecording,
  startRecording,
  stopRecording,
  requestPermission
} = useAudioRecorder(sendAudioData);

// Features
- 3-second chunk recording
- Speech content detection
- 7-chunk batching (21 seconds)
- Automatic cleanup
```

### WebSocket Hook
```typescript
// Usage
const {
  isConnected,
  transcription,
  sendAudioData,
  startRecording,
  stopRecording
} = useWebSocket();

// Features
- Development: Direct API calls
- Production: WebSocket streaming
- Automatic reconnection
- Format detection
```

### Dual Trigger System
```typescript
// Sunrise - Start Recording
const handleSunriseTap = () => {
  // 3-tap logic
  // Start audio recording
  // Show toast notification
};

// Sunset - Stop Recording
const handleSunsetTap = () => {
  // 3-tap logic
  // Stop audio recording
  // Send final batch
};
```

## API Endpoints

### POST `/api/transcribe`
```typescript
// Request
{
  audioData: "base64_encoded_audio",
  format: "webm"
}

// Response
{
  success: true,
  transcription: "Hello, this is a test",
  timestamp: 1234567890
}
```

### WebSocket `/api/socket`
```typescript
// Client → Server
{ type: "audioData", data: "base64_audio" }

// Server → Client
{ type: "transcriptionUpdate", text: "transcribed_text" }
```

## Configuration Options

### Audio Settings
```typescript
// In useAudioRecorder.ts
const audioConfig = {
  echoCancellation: true,
  noiseSuppression: true,
  sampleRate: 16000,
  channelCount: 1,
};
```

### Batching Settings
```typescript
// In useAudioRecorder.ts
const BATCH_SIZE = 7;           // Chunks per batch
const CHUNK_DURATION = 3000;    // ms per chunk
const SPEECH_THRESHOLD = 0.01;  // RMS threshold
```

### MIME Types (Priority Order)
```typescript
const mimeTypes = [
  'audio/webm;codecs=opus',  // Preferred
  'audio/webm',
  'audio/mp4',
  'audio/ogg;codecs=opus',
  'audio/wav'
];
```

## Common Modifications

### Change Batch Size
```typescript
// In useAudioRecorder.ts, line ~20
const BATCH_SIZE = 10; // Change from 7 to 10 chunks
```

### Adjust Speech Threshold
```typescript
// In useAudioRecorder.ts, line ~85
const threshold = 0.005; // More sensitive (was 0.01)
```

### Modify Chunk Duration
```typescript
// In useAudioRecorder.ts, line ~200
mediaRecorder.start(5000); // 5 seconds instead of 3
```

### Add New Audio Format
```typescript
// In useAudioRecorder.ts, getSupportedMimeType()
const types = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/mp4',
  'audio/ogg;codecs=opus',
  'audio/wav',
  'audio/mpeg'  // Add new format
];
```

## Debug Logging

### Enable Verbose Logging
```typescript
// Add to any hook or component
console.log('🔍 Debug:', { variable, state, data });
```

### Common Log Messages
```
🔄 Starting new recording session
🎵 Audio analysis - RMS: 0.023456
📦 Batch progress: 3/7 chunks (has speech)
📤 Sending batch to transcription
🎤 TRANSCRIPTION RECEIVED: Hello world
```

## Error Handling

### Common Errors & Solutions

1. **"Audio recording is not supported"**
   ```typescript
   // Check browser compatibility
   if (!navigator.mediaDevices || !window.MediaRecorder) {
     // Handle unsupported browser
   }
   ```

2. **"Failed to transcribe audio"**
   ```typescript
   // Check API key and format
   if (!process.env.NEXT_ANON_OPENAI_KEY) {
     // Handle missing API key
   }
   ```

3. **"WebSocket connection failed"**
   ```typescript
   // Development mode is normal
   // Production: Check Vercel deployment
   ```

## Performance Tips

### Optimize Audio Processing
```typescript
// Use Web Workers for heavy processing
const worker = new Worker('/audio-worker.js');
worker.postMessage({ audioData });
```

### Reduce API Calls
```typescript
// Increase batch size for fewer calls
const BATCH_SIZE = 10; // More chunks per batch
```

### Memory Management
```typescript
// Clean up audio contexts
useEffect(() => {
  return () => {
    audioContext?.close();
    stream?.getTracks().forEach(track => track.stop());
  };
}, []);
```

## Testing

### Manual Testing
1. Test dual trigger system
2. Verify speech detection
3. Check batching behavior
4. Test error scenarios

### Automated Testing
```typescript
// Example test structure
describe('Audio Recording', () => {
  it('should start recording on sunrise tap', () => {
    // Test implementation
  });
  
  it('should stop recording on sunset tap', () => {
    // Test implementation
  });
});
```

## Deployment Checklist

- [ ] Set `NEXT_ANON_OPENAI_KEY` environment variable
- [ ] Verify Vercel Edge Runtime configuration
- [ ] Test WebSocket functionality in production
- [ ] Check rate limiting compliance
- [ ] Verify audio format compatibility

## Troubleshooting

### Development Issues
- Check browser console for errors
- Verify microphone permissions
- Test with different audio formats
- Check API key configuration

### Production Issues
- Verify Vercel deployment
- Check environment variables
- Test WebSocket connectivity
- Monitor API rate limits

## Resources

- [OpenAI Whisper API](https://platform.openai.com/docs/guides/speech-to-text)
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [MediaRecorder API](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder)
- [Next.js Edge Runtime](https://nextjs.org/docs/app/building-your-application/rendering/edge-and-nodejs-runtimes) 