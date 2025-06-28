# Weather App with Secret Audio Transcription

A beautiful weather app built with Next.js 15 that includes a hidden audio transcription feature triggered by tapping the sunrise icon 3 times to start and sunset icon 3 times to stop.

## Features

- 🌤️ Real-time weather data
- 📍 Location-based weather
- 🎤 Secret audio recording (3 taps on sunrise to start, 3 taps on sunset to stop)
- 🤖 OpenAI Whisper transcription
- 📱 Responsive design
- 🌙 Dark mode support

## Secret Feature

The app includes a hidden audio transcription feature:

1. **Start Recording**: Tap the sunrise icon 3 times to start recording
2. **Stop Recording**: Tap the sunset icon 3 times to stop recording
3. **Transcription**: Audio is automatically transcribed using OpenAI Whisper
4. **Smart Batching**: 21-second audio chunks are batched to avoid rate limits
5. **Speech Detection**: Only sends audio with meaningful speech content

## Technical Details

### Audio Recording
- Continuous 3-second chunk recording
- Real-time speech content detection
- 7-chunk batching (21 seconds) for efficient API usage
- Automatic rate limit compliance

### Transcription
- OpenAI Whisper API integration
- Development mode with direct API calls
- Production mode with WebSocket streaming
- Smart filtering of silent audio chunks

## Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Set environment variables:
   ```
   NEXT_ANON_OPENAI_KEY=your_openai_api_key
   ```
4. Run development server: `npm run dev`

## Usage

1. **Weather**: Search for a city or allow location access
2. **Secret Recording**: 
   - Tap sunrise icon 3 times to start recording
   - Speak into microphone
   - Tap sunset icon 3 times to stop recording
   - View transcription results in console

## Environment Variables

- `NEXT_ANON_OPENAI_KEY`: Your OpenAI API key for Whisper transcription

## Deployment

The app is optimized for Vercel deployment with:
- Edge Runtime for WebSocket support
- Automatic environment variable handling
- Optimized build process

## Development vs Production

- **Development**: WebSocket is simulated, audio data is logged
- **Production**: Full WebSocket functionality with real-time transcription

## Architecture

- Next.js 15 App Router
- WebSocket for real-time audio streaming
- OpenAI Whisper for transcription
- Edge Runtime for production WebSocket

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
