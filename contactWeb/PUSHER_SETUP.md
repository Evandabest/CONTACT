# Pusher Setup Guide

This guide explains how to set up Pusher for real-time audio transcription in the contact web app.

## Prerequisites

1. A Pusher account (sign up at [pusher.com](https://pusher.com))
2. An OpenAI API key for transcription

## Environment Variables

Create a `.env.local` file in the `contactWeb` directory with the following variables:

```bash
# OpenAI API Key for transcription
NEXT_ANON_OPENAI_KEY=your_openai_api_key_here

# Pusher Configuration
PUSHER_APP_ID=your_pusher_app_id
NEXT_PUBLIC_PUSHER_KEY=your_pusher_key
PUSHER_SECRET=your_pusher_secret
NEXT_PUBLIC_PUSHER_CLUSTER=your_pusher_cluster

# Weather API Key (if needed)
OPENWEATHER_API_KEY=your_openweather_api_key

# Twilio Configuration (if using Twilio)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number
```

## Pusher Setup Steps

1. **Create a Pusher App**:
   - Go to [pusher.com](https://pusher.com) and create an account
   - Create a new Channels app
   - Choose your preferred cluster (e.g., `us2`, `eu`, `ap1`)

2. **Get Your Credentials**:
   - In your Pusher app dashboard, go to "App Keys"
   - Copy the following values:
     - App ID
     - Key
     - Secret
     - Cluster

3. **Update Environment Variables**:
   - Replace the placeholder values in your `.env.local` file with your actual Pusher credentials

## How It Works

### Architecture
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React App     │    │   Pusher Client  │    │   Pusher Server │
│                 │    │                  │    │                 │
│ - usePusher     │◄──►│ - Real-time      │◄──►│ - Channels      │
│ - Audio Recorder│    │   Events         │    │ - Webhooks      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │  API Routes     │
                       │                 │
                       │ - /api/pusher/  │
                       │   audio         │
                       └─────────────────┘
```

### Flow
1. **Audio Recording**: User records audio using the dual-trigger system
2. **Audio Processing**: Audio data is sent to `/api/pusher/audio`
3. **Transcription**: OpenAI Whisper transcribes the audio
4. **Real-time Broadcast**: Transcription results are sent via Pusher
5. **Client Update**: All connected clients receive the transcription in real-time

## Features

- **Real-time Communication**: Uses Pusher Channels for instant updates
- **Cross-platform**: Works in both development and production
- **Automatic Reconnection**: Handles connection drops gracefully
- **Error Handling**: Comprehensive error handling and logging
- **Audio Format Detection**: Automatically detects audio format from MIME type

## Testing

1. **Start the development server**:
   ```bash
   npm run dev
   ```

2. **Test the audio feature**:
   - Open the weather app
   - Search for any city to load weather data
   - **Start Recording**: Tap sunrise icon 3 times quickly
   - **Speak**: Talk into your microphone
   - **Stop Recording**: Tap sunset icon 3 times quickly
   - **Check Console**: View transcription results

## Troubleshooting

### Common Issues

1. **"Failed to connect to audio service"**:
   - Check your Pusher credentials in `.env.local`
   - Ensure all environment variables are set correctly
   - Verify your Pusher app is active

2. **"Transcription failed"**:
   - Check your OpenAI API key
   - Ensure you have sufficient OpenAI credits
   - Verify the audio format is supported

3. **No real-time updates**:
   - Check browser console for Pusher connection errors
   - Verify your cluster setting matches your Pusher app
   - Ensure you're not behind a restrictive firewall

### Debug Mode

Enable debug logging by adding this to your browser console:
```javascript
localStorage.setItem('pusher:log', 'true');
```

## Migration from WebSocket

This implementation replaces the previous WebSocket-based system with the following improvements:

- **Better Reliability**: Pusher handles connection management
- **Cross-browser Compatibility**: Works consistently across browsers
- **Scalability**: Pusher infrastructure handles scaling
- **Development Support**: Works in both development and production environments

## Security Notes

- Keep your Pusher secret key secure and never expose it in client-side code
- Use environment variables for all sensitive configuration
- Consider implementing authentication for production use
- Monitor your Pusher usage to stay within limits 