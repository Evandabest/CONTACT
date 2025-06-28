# 🌤️ MSHack Mobile - Weather App with Secret Audio Recording

A React Native weather application built with Expo that features a **secret audio recording and transcription capability**. The app appears as a normal weather app but includes a hidden feature that allows continuous audio recording and real-time transcription using OpenAI Whisper.

## 🎯 Project Overview

This is a monorepo containing:
- **`weather-app/`** - React Native/Expo mobile application
- **`server/`** - Node.js backend with Socket.IO and OpenAI integration

### 🚨 Secret Feature
The app includes a discrete audio recording feature triggered by:
- **3 taps on the sunrise icon** → Start recording
- **3 taps on the sunset icon** → Stop recording

The recording happens silently in the background with real-time transcription sent to your server.

## 🏗️ Architecture

### Frontend (React Native/Expo)
- **React Native** with **Expo SDK 53**
- **TypeScript** for type safety
- **Socket.IO Client** for real-time communication
- **Expo AV** for audio recording
- **Expo Location** for GPS weather data
- **Linear Gradient** for beautiful UI backgrounds

### Backend (Node.js)
- **Express.js** REST API
- **Socket.IO** for real-time WebSocket communication
- **OpenAI Whisper** for audio transcription
- **FFmpeg** for audio format conversion
- **Multer** for file upload handling
- **TypeScript** for type safety

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm 8+
- Expo CLI (`npm install -g @expo/cli`)
- OpenAI API key
- iOS Simulator or Android Emulator (optional)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd mshack-mobile
   ```

2. **Install all dependencies**
   ```bash
   npm run install:all
   ```

3. **Set up environment variables**
   ```bash
   # Copy server environment template
   cp server/env.example server/.env
   
   # Edit server/.env and add your OpenAI API key
   OPENAI_API_KEY=your_openai_api_key_here
   ```

4. **Start the development environment**
   ```bash
   # Start both server and mobile app
   npm run dev
   
   # Or start them separately:
   npm run server    # Backend only
   npm run start     # Mobile app only
   ```

## 📱 Mobile App Features

### Weather Display
- Current weather conditions with beautiful gradients
- Temperature, humidity, wind speed, visibility
- Sunrise and sunset times
- Location-based weather (GPS or manual city search)
- Responsive design with smooth animations

### Secret Audio Recording
- **Discrete recording**: No visible UI indicators
- **Continuous listening**: Records in 3-second chunks
- **Smart filtering**: Only processes meaningful audio (filters silence)
- **Real-time transcription**: Live transcription via WebSocket
- **Background operation**: Continues recording while using other app features

### User Interface
- Modern, gradient-based design
- Intuitive weather cards and details
- Location permission handling
- Error states and loading indicators
- Cross-platform compatibility (iOS/Android)

## 🔌 Backend API

### Weather Endpoints
- `GET /api/weather?city=<city>` - Get weather by city name
- `GET /api/weather?lat=<lat>&lon=<lon>` - Get weather by coordinates

### Transcription Endpoints
- `POST /api/transcribe/file` - Upload audio file for transcription
- `POST /api/transcribe/base64` - Send base64 audio data

### WebSocket Events
- `audioData` - Client sends audio data
- `transcriptionUpdate` - Server sends transcription results

### Health Check
- `GET /health` - Server status and uptime

## 🎤 Audio Processing

### Recording Process
1. **Trigger**: 3 taps on sunrise/sunset icons
2. **Chunking**: Audio recorded in 3-second segments
3. **Analysis**: RMS analysis to detect meaningful audio
4. **Batching**: 7 chunks (21 seconds) collected before processing
5. **Transmission**: Audio sent to server via WebSocket
6. **Transcription**: OpenAI Whisper processes the audio
7. **Response**: Transcription sent back to client

### Supported Audio Formats
- **Input**: webm, mp4, ogg, wav, m4a
- **Processing**: Automatic conversion to MP3 if needed
- **Size Limits**: 2KB minimum, 50MB maximum

## 🛠️ Development

### Available Scripts

#### Root Level
```bash
npm run dev              # Start both server and mobile app
npm run install:all      # Install dependencies for all packages
npm run start            # Start mobile app only
npm run server           # Start backend server only
npm run android          # Run on Android
npm run ios              # Run on iOS
npm run web              # Run on web
npm run build            # Build mobile app
npm run test             # Run tests
```

#### Weather App
```bash
cd weather-app
npm start                # Start Expo development server
npm run android          # Run on Android
npm run ios              # Run on iOS
npm run web              # Run on web
```

#### Server
```bash
cd server
npm run dev              # Start with nodemon (development)
npm run build            # Build TypeScript
npm start                # Start production server
```

### Project Structure
```
mshack-mobile/
├── weather-app/                 # React Native/Expo app
│   ├── App.tsx                 # Main app component
│   ├── hooks/                  # Custom React hooks
│   │   ├── useAudioRecording.ts
│   │   ├── useWeatherData.ts
│   │   └── useTapCounter.ts
│   ├── assets/                 # App icons and images
│   └── .expo/                  # Expo cache
├── server/                     # Node.js backend
│   ├── src/
│   │   ├── index.ts           # Main server file
│   │   └── routes/            # API routes
│   │       ├── weather.ts
│   │       └── transcribe.ts
│   ├── dist/                  # Built JavaScript
│   ├── temp/                  # Temporary audio files
│   └── env.example           # Environment template
├── package.json               # Root package.json
└── .gitignore                # Git ignore rules
```

## 🔧 Configuration

### Environment Variables

#### Server (.env)
```bash
# Server Configuration
PORT=3001
NODE_ENV=development

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Weather API (optional)
WEATHER_API_KEY=your_weather_api_key_here
```

### Audio Processing Settings
- **Chunk Duration**: 3 seconds
- **Batch Size**: 7 chunks (21 seconds)
- **Min Audio Size**: 2KB
- **Max Audio Size**: 50MB
- **Supported Formats**: webm, mp4, ogg, wav, mp3

## 🚀 Deployment

### Mobile App
```bash
# Build for production
cd weather-app
expo build:android  # or expo build:ios
```

### Server
```bash
# Build and start production server
cd server
npm run build
npm start
```

## 🔒 Security Considerations

- **Audio Data**: Temporary files are automatically cleaned up
- **API Keys**: Never commit `.env` files to version control
- **Input Validation**: All audio data is validated before processing
- **Rate Limiting**: Built-in protection against OpenAI rate limits
- **Error Handling**: Graceful error responses and logging

## 🐛 Troubleshooting

### Common Issues

1. **Audio Recording Not Working**
   - Check microphone permissions
   - Ensure server is running
   - Verify WebSocket connection

2. **Transcription Fails**
   - Check OpenAI API key
   - Verify audio file size and format
   - Check server logs for errors

3. **Weather Data Not Loading**
   - Check internet connection
   - Verify location permissions
   - Try manual city search

### Debug Mode
```bash
# Enable detailed logging
NODE_ENV=development npm run dev
```

## 📄 License

MIT License - see LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For issues and questions:
- Check the troubleshooting section
- Review server logs
- Open an issue on GitHub

---

**⚠️ Important**: This app includes audio recording capabilities. Ensure compliance with local privacy laws and regulations when using this feature. 