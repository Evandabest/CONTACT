# AI Reasoning Analysis System

## Overview

The AI Reasoning Analysis system is a sophisticated layer that analyzes live transcriptions from OpenAI Whisper to provide real-time emergency response intelligence. This system is designed to work exclusively in the `contactweb` Next.js application.

## Features

### 🧠 Intelligent Analysis
- **Emergency Level Detection**: Automatically categorizes situations as none, low, medium, high, or critical
- **Sentiment Analysis**: Identifies emotional states (positive, neutral, negative, distressed)
- **Context Understanding**: Provides situational context and reasoning
- **Action Recommendations**: Suggests appropriate emergency responses
- **Confidence Scoring**: Indicates AI confidence in the analysis

### 🔄 Real-time Processing
- **Live Integration**: Works seamlessly with live audio transcription
- **WebSocket Support**: Real-time updates via WebSocket connections
- **Historical Context**: Maintains analysis history for better context
- **Automatic Triggering**: Analyzes every transcription automatically

## Architecture

### API Endpoints

#### `/api/reasoning` (POST)
Analyzes transcription text using OpenAI's reasoning capabilities.

**Request Body:**
```json
{
  "transcription": "Help! I need emergency assistance immediately.",
  "context": "Live emergency audio from connection 123",
  "previousAnalysis": { /* optional previous analysis for context */ }
}
```

**Response:**
```json
{
  "success": true,
  "analysis": {
    "emergencyLevel": "critical",
    "context": "Person requesting immediate emergency assistance",
    "keywords": ["help", "emergency", "assistance", "immediately"],
    "sentiment": "distressed",
    "actionRequired": true,
    "suggestedActions": [
      "Dispatch emergency services immediately",
      "Establish communication with caller",
      "Gather location information"
    ],
    "confidence": 0.95,
    "reasoning": "The use of 'help' and 'immediately' indicates urgent need for assistance..."
  },
  "timestamp": 1703123456789
}
```

### WebSocket Integration

The reasoning analysis is automatically triggered when transcriptions are received via WebSocket:

1. **Audio Data** → **Whisper Transcription** → **Reasoning Analysis** → **Real-time Display**
2. Analysis results are broadcast to all connected clients
3. Critical emergencies trigger additional logging and alerts

### Components

#### `ReasoningAnalysis.tsx`
A React component that displays analysis results with:
- Emergency level indicators with color coding
- Sentiment analysis with icons
- Confidence score visualization
- Action recommendations
- AI reasoning explanation
- Original transcription display

#### `useWebSocket.ts` (Enhanced)
Updated hook that handles:
- Analysis data from WebSocket messages
- Manual analysis requests
- Development mode analysis simulation

## Usage

### Live Emergency Response

1. **Start Recording**: Use the emergency recording feature
2. **Automatic Analysis**: Every transcription is automatically analyzed
3. **Real-time Display**: Analysis results appear immediately
4. **Action Alerts**: Critical situations trigger visual alerts

### Manual Testing

Visit `/test-reasoning` to:
- Test with sample emergency transcriptions
- Enter custom transcriptions
- View detailed analysis results
- Understand the reasoning process

### Development Mode

In development, the system:
- Simulates WebSocket functionality
- Calls reasoning API directly
- Provides detailed console logging
- Maintains full functionality for testing

## Emergency Levels

| Level | Description | Color | Action |
|-------|-------------|-------|--------|
| `none` | No emergency indicators | Green | Monitor |
| `low` | Minor concerns | Yellow | Monitor closely |
| `medium` | Moderate concerns | Orange | Attention needed |
| `high` | Serious concerns | Red | Immediate attention |
| `critical` | Life-threatening | Red (Pulsing) | Emergency response |

## Sentiment Analysis

| Sentiment | Description | Icon | Use Case |
|-----------|-------------|------|----------|
| `positive` | Calm, helpful | Trending Up | Normal communication |
| `neutral` | Standard | Activity | Routine updates |
| `negative` | Distressed, angry | Trending Down | Concerning situations |
| `distressed` | Panic, fear | Alert Triangle | Emergency situations |

## Configuration

### Environment Variables
```bash
NEXT_ANON_OPENAI_KEY=your_openai_api_key
```

### API Configuration
- **Model**: GPT-4o-mini for optimal reasoning
- **Temperature**: 0.3 for consistent analysis
- **Max Tokens**: 1000 for comprehensive responses
- **Response Format**: JSON for structured output

## Security Considerations

- All API calls use secure HTTPS
- OpenAI API key is stored securely
- No sensitive data is logged
- Analysis history is limited to last 10 entries
- WebSocket connections are authenticated

## Performance

- **Response Time**: ~2-3 seconds for analysis
- **Concurrent Users**: Supports multiple simultaneous connections
- **Memory Usage**: Minimal with analysis history cleanup
- **Scalability**: Designed for production deployment

## Monitoring

### Console Logging
- Transcription completion
- Analysis results
- Emergency level changes
- Critical situation alerts
- Error handling

### Real-time Indicators
- Connection status
- Live recording status
- Emergency level badges
- Confidence scores
- Action requirements

## Future Enhancements

- **Multi-language Support**: Analyze transcriptions in multiple languages
- **Voice Pattern Analysis**: Detect stress levels from voice characteristics
- **Location Integration**: Include GPS data in analysis
- **Emergency Service Integration**: Direct API calls to emergency services
- **Machine Learning**: Continuous improvement from analysis patterns

## Troubleshooting

### Common Issues

1. **Analysis Not Working**
   - Check OpenAI API key configuration
   - Verify network connectivity
   - Check browser console for errors

2. **WebSocket Connection Issues**
   - Ensure production deployment for WebSocket functionality
   - Check server logs for connection errors
   - Verify environment configuration

3. **Slow Response Times**
   - Check OpenAI API rate limits
   - Monitor network latency
   - Consider upgrading API tier

### Debug Mode

Enable detailed logging by checking browser console for:
- WebSocket connection status
- Transcription processing
- Analysis API calls
- Error messages

## Support

For technical support or feature requests, please refer to the main project documentation or create an issue in the repository. 