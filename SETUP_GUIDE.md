# Weather App Mobile - Setup Guide

Complete setup guide for the React Native weather app with secret audio transcription features.

## 🎯 Project Overview

This project recreates the original Next.js weather app as a React Native mobile application with:
- **Weather Display**: Real-time weather based on device location
- **Secret Audio Recording**: Hidden feature triggered by tapping sunrise/sunset icons
- **Live Audio Streaming**: Continuous audio capture and streaming to Node.js server
- **OpenAI Whisper Integration**: Real-time audio transcription

## 🏗️ Architecture

### Frontend (React Native + Expo)
- **Location Services**: Expo Location for GPS coordinates
- **Audio Recording**: Expo AV for microphone access
- **Real-time Communication**: Socket.IO client for WebSocket connections
- **State Management**: Custom React hooks for weather, audio, and tap counting

### Backend (Node.js + Express)
- **REST API**: Weather and transcription endpoints
- **WebSocket Server**: Socket.IO for real-time audio streaming
- **OpenAI Integration**: Whisper API for audio transcription
- **File Processing**: Multer for audio file uploads

## 🚀 Quick Setup

### Prerequisites
- Node.js 18+
- Expo CLI (`npm install -g @expo/cli`)
- iOS Simulator (Xcode) or Android Emulator (Android Studio)
- OpenAI API key

### Step 1: Install Dependencies

```bash
# Install all dependencies (client and server)
npm run install:all
```

### Step 2: Configure Environment

```bash
# Copy environment template
cp server/env.example server/.env

# Edit the .env file and add your OpenAI API key
# OPENAI_API_KEY=your_openai_api_key_here
```

### Step 3: Start Development

```bash
# Start both server and client simultaneously
npm run dev
```

### Step 4: Run on Device/Simulator

- Press `i` for iOS simulator
- Press `a` for Android emulator
- Scan QR code with Expo Go app on physical device

## 🎯 How to Use

### Weather Features
1. Grant location permissions when prompted
2. View current weather conditions
3. Weather data refreshes automatically every 5 minutes

### Secret Audio Transcription
1. **Start Recording**: Tap the sunrise (☀️) icon 3 times quickly
2. **Stop Recording**: Tap the sunset (🌙) icon 3 times quickly
3. **View Transcription**: Transcriptions appear as alerts and in the app

## 📁 Project Structure

```
mshack-mobile/
├── package.json              # Root package with scripts
├── README.md                 # Main project documentation
├── SETUP_GUIDE.md           # This setup guide
├── .gitignore               # Git ignore rules
├── weather-app/             # React Native Expo app
│   ├── App.tsx              # Main app component
│   ├── app.json             # Expo configuration
│   ├── package.json         # Frontend dependencies
│   ├── README.md            # Frontend documentation
│   └── hooks/               # Custom React hooks
│       ├── useWeatherData.ts
│       ├── useAudioRecording.ts
│       └── useTapCounter.ts
└── server/                  # Node.js backend
    ├── src/
    │   ├── index.ts         # Main server file
    │   └── routes/          # API routes
    ├── package.json         # Backend dependencies
    ├── README.md            # Server documentation
    ├── tsconfig.json        # TypeScript config
    ├── nodemon.json         # Development config
    └── env.example          # Environment template
```

## 🔧 Configuration

### Server Configuration
- **Port**: Default 3001 (configurable via `PORT` env var)
- **Environment**: Development/Production modes
- **Audio Limits**: 50MB max file size, 2KB minimum

### App Configuration
- **Location Permissions**: Required for weather data
- **Microphone Permissions**: Required for audio recording
- **Network**: Requires connection to backend server

## 📱 Platform Support

- ✅ **iOS**: Full support (Simulator & Device)
- ✅ **Android**: Full support (Emulator & Device)
- ⚠️ **Web**: Limited audio support

## 🔒 Security & Privacy

- **Audio Data**: Streamed directly to server, not stored locally
- **Location Data**: Used only for weather API calls
- **API Keys**: Stored securely in environment variables
- **Permissions**: Minimal required permissions requested

## 🐛 Troubleshooting

### Common Issues

1. **Server Connection Failed**
   ```bash
   # Check if server is running
   curl http://localhost:3001/health
   
   # Restart server
   npm run server
   ```

2. **Audio Recording Not Working**
   - Grant microphone permissions in device settings
   - Check device microphone functionality
   - Ensure stable internet connection

3. **Location Not Working**
   - Grant location permissions in device settings
   - Enable location services on device
   - Check GPS signal

4. **Transcription Errors**
   - Verify OpenAI API key is valid
   - Check API usage limits
   - Ensure audio quality is sufficient

### Debug Mode
Enable debug logging by setting `NODE_ENV=development` in server environment.

### Logs
- **Server**: Check terminal where server is running
- **Client**: Check Expo development tools
- **Network**: Use browser dev tools for WebSocket debugging

## 📊 Development Commands

```bash
# Install all dependencies
npm run install:all

# Start development (both server and client)
npm run dev

# Start server only
npm run server

# Start client only
npm run client
```

## 🔄 Development Workflow

1. **Make Changes**: Edit files in `weather-app/` or `server/`
2. **Auto-reload**: Both server and client auto-reload on changes
3. **Test**: Use device/simulator to test functionality
4. **Debug**: Check logs in respective terminals

## 📄 Documentation

- [Main README](./README.md) - Project overview and features
- [Frontend README](./weather-app/README.md) - Detailed frontend documentation
- [Server README](./server/README.md) - Backend API documentation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For issues and questions:
- Check the troubleshooting section
- Review the documentation
- Open an issue on GitHub

## 📄 License

MIT License - see LICENSE file for details 