# 📱 Mobile App Documentation - MSHack Mobile Frontend

## 📋 Overview

The mobile app is a React Native application built with Expo that provides:
- **Weather Display** - Beautiful, gradient-based weather interface
- **Secret Audio Recording** - Discrete background audio recording and transcription
- **Real-time Communication** - WebSocket connection to backend server
- **Location Services** - GPS-based weather data and manual city search
- **Cross-platform Support** - iOS and Android compatibility

## 🏗️ Architecture

### Technology Stack
- **Framework**: React Native 0.79+
- **Development Platform**: Expo SDK 53
- **Language**: TypeScript
- **Real-time**: Socket.IO Client 4.8+
- **Audio**: Expo AV for recording
- **Location**: Expo Location for GPS
- **UI**: Linear Gradient for backgrounds
- **Icons**: Expo Vector Icons

### Project Structure
```
weather-app/
├── App.tsx                    # Main application component
├── index.ts                   # Entry point
├── app.json                   # Expo configuration
├── tsconfig.json             # TypeScript configuration
├── package.json              # Dependencies and scripts
├── hooks/                    # Custom React hooks
│   ├── useAudioRecording.ts  # Audio recording logic
│   ├── useWeatherData.ts     # Weather data fetching
│   └── useTapCounter.ts      # Secret trigger mechanism
├── assets/                   # App icons and images
│   ├── icon.png
│   ├── splash-icon.png
│   ├── adaptive-icon.png
│   └── favicon.png
└── .expo/                    # Expo cache and settings
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm 8+
- Expo CLI (`npm install -g @expo/cli`)
- iOS Simulator or Android Emulator (optional)
- Physical device for testing

### Installation
```bash
cd weather-app
npm install
```

### Development
```bash
# Start Expo development server
npm start

# Run on specific platform
npm run android    # Android
npm run ios        # iOS
npm run web        # Web browser
```

### Building
```bash
# Build for production
expo build:android  # Android APK
expo build:ios      # iOS IPA
```

## 🎯 Core Features

### Weather Display
- **Current Conditions**: Temperature, humidity, wind speed, visibility
- **Visual Design**: Dynamic gradient backgrounds based on weather
- **Location Support**: GPS-based and manual city search
- **Real-time Updates**: Automatic refresh every 5 minutes
- **Responsive UI**: Adapts to different screen sizes

### Secret Audio Recording
- **Discrete Trigger**: 3 taps on sunrise/sunset icons
- **Background Recording**: Continues while using other app features
- **Smart Processing**: Only records meaningful audio (filters silence)
- **Real-time Transcription**: Live transcription via WebSocket
- **Format Support**: Multiple audio formats (webm, m4a, etc.)

### User Interface
- **Modern Design**: Clean, gradient-based interface
- **Intuitive Navigation**: Simple, single-screen layout
- **Error Handling**: Graceful error states and loading indicators
- **Accessibility**: Screen reader support and proper contrast
- **Cross-platform**: Consistent experience on iOS and Android

## 🔧 Custom Hooks

### useAudioRecording

Manages audio recording functionality with WebSocket communication.

**Location**: `hooks/useAudioRecording.ts`

**Features:**
- Microphone permission handling
- High-quality audio recording
- Real-time WebSocket communication
- Audio format detection and conversion
- Error handling and cleanup

**Usage:**
```typescript
const { isRecording, startRecording, stopRecording } = useAudioRecording();

// Start recording
await startRecording();

// Stop recording (automatically sends to server)
await stopRecording();
```

**Key Methods:**
- `startRecording()`: Request permissions and start recording
- `stopRecording()`: Stop recording and send to server
- `isRecording`: Boolean state of recording status

### useWeatherData

Manages weather data fetching and caching.

**Location**: `hooks/useWeatherData.ts`

**Features:**
- Location-based weather fetching
- Manual city search
- Automatic refresh every 5 minutes
- Error handling and loading states
- TypeScript interfaces for weather data

**Usage:**
```typescript
const { weatherData, loading, error, fetchWeatherByCity } = useWeatherData(location);

// Fetch weather for specific city
await fetchWeatherByCity('New York');

// Access weather data
if (weatherData) {
  console.log(weatherData.main.temp);
}
```

**Weather Data Interface:**
```typescript
interface WeatherData {
  name: string;
  main: {
    temp: number;
    feels_like: number;
    humidity: number;
    pressure: number;
  };
  weather: Array<{
    main: string;
    description: string;
    icon: string;
  }>;
  wind: { speed: number };
  visibility: number;
  sys: {
    sunrise: number;
    sunset: number;
  };
}
```

### useTapCounter

Manages the secret trigger mechanism for audio recording.

**Location**: `hooks/useTapCounter.ts`

**Features:**
- Separate counters for sunrise and sunset icons
- Reset functionality after trigger activation
- Simple state management for tap counting

**Usage:**
```typescript
const { 
  sunriseTaps, 
  sunsetTaps, 
  incrementSunriseTaps, 
  incrementSunsetTaps,
  resetSunriseTaps,
  resetSunsetTaps 
} = useTapCounter();

// Handle sunrise tap
const handleSunriseTap = () => {
  incrementSunriseTaps();
  if (sunriseTaps === 2) { // 3rd tap
    // Trigger recording start
    resetSunriseTaps();
  }
};
```

## 🎨 UI Components

### Main App Component (`App.tsx`)

The main application component that orchestrates all features.

**Key Sections:**
1. **Status Bar**: Light content style for better visibility
2. **Search Interface**: City search with autocomplete
3. **Weather Display**: Current conditions and details
4. **Sunrise/Sunset Cards**: Weather info with secret triggers
5. **Toast Notifications**: Discrete recording status alerts

**State Management:**
```typescript
// Core states
const [location, setLocation] = useState<Location.LocationObject | null>(null);
const [socket, setSocket] = useState<Socket | null>(null);
const [transcription, setTranscription] = useState<string>('');
const [isConnected, setIsConnected] = useState(false);
const [city, setCity] = useState('');
const [showLocationPrompt, setShowLocationPrompt] = useState(false);
const [showToast, setShowToast] = useState(false);
```

### Weather Display Components

**Weather Card:**
- Current temperature with weather icon
- Feels like temperature
- Weather description
- Location information

**Details Grid:**
- Temperature, humidity, wind speed, visibility
- Organized in responsive grid layout
- Icons for each weather metric

**Sunrise/Sunset Cards:**
- Time display for sunrise and sunset
- Secret trigger functionality
- Visual feedback for taps

### Search Interface

**Search Input:**
- City name input with placeholder
- Search button with loading state
- Error handling for invalid cities

**Location Permission:**
- Permission request overlay
- Manual location access
- Fallback to city search

## 🔌 WebSocket Integration

### Connection Management

**Initialization:**
```typescript
const newSocket = io('http://localhost:3001', {
  transports: ['websocket'],
  timeout: 20000,
});
```

**Event Handlers:**
```typescript
// Connection events
newSocket.on('connect', () => {
  console.log('🔌 Connected to server');
  setIsConnected(true);
});

newSocket.on('disconnect', () => {
  console.log('🔌 Disconnected from server');
  setIsConnected(false);
});

// Transcription events
newSocket.on('transcriptionUpdate', (data) => {
  if (data.success) {
    setTranscription(data.text);
    Alert.alert('🎤 Transcription', data.text);
  } else {
    console.log('❌ Transcription failed:', data.error || data.reason);
  }
});
```

### Audio Data Transmission

**Sending Audio:**
```typescript
// Convert blob to base64
const reader = new FileReader();
reader.onload = () => {
  const base64Data = reader.result as string;
  const base64Audio = base64Data.split(',')[1];
  
  // Send to server
  socketRef.current?.emit('audioData', {
    audioData: base64Audio,
    format: format
  });
};
reader.readAsDataURL(blob);
```

## 🎤 Audio Recording Process

### Recording Workflow

1. **Permission Request**
   ```typescript
   const permission = await Audio.requestPermissionsAsync();
   if (permission.status !== 'granted') {
     console.error('Permission denied');
     return;
   }
   ```

2. **Audio Configuration**
   ```typescript
   await Audio.setAudioModeAsync({
     allowsRecordingIOS: true,
     playsInSilentModeIOS: true,
     staysActiveInBackground: true,
     shouldDuckAndroid: true,
     playThroughEarpieceAndroid: false,
   });
   ```

3. **Start Recording**
   ```typescript
   const { recording } = await Audio.Recording.createAsync(
     Audio.RecordingOptionsPresets.HIGH_QUALITY
   );
   ```

4. **Stop and Process**
   ```typescript
   await recording.stopAndUnloadAsync();
   const uri = recording.getURI();
   // Convert to blob and send to server
   ```

### Audio Format Detection

**Supported Formats:**
- **webm**: WebM audio format
- **m4a**: MPEG-4 audio format
- **wav**: WAV audio format
- **mp3**: MP3 audio format

**Format Detection:**
```typescript
let format = 'm4a';
if (blob.type.includes('webm')) {
  format = 'webm';
} else if (blob.type.includes('wav')) {
  format = 'wav';
} else if (blob.type.includes('mp4') || blob.type.includes('m4a')) {
  format = 'm4a';
}
```

## 📍 Location Services

### GPS Integration

**Permission Handling:**
```typescript
let { status } = await Location.requestForegroundPermissionsAsync();
if (status !== 'granted') {
  setLocationPermission('denied');
  setErrorMsg('Permission to access location was denied');
  return;
}
```

**Location Fetching:**
```typescript
let location = await Location.getCurrentPositionAsync({});
setLocation(location);
```

**Weather API Call:**
```typescript
const response = await fetch(
  `http://localhost:3001/api/weather?lat=${location.coords.latitude}&lon=${location.coords.longitude}`
);
```

### Manual City Search

**Search Function:**
```typescript
const fetchWeatherByCity = async (cityName: string) => {
  const response = await fetch(
    `http://localhost:3001/api/weather?city=${encodeURIComponent(cityName)}`
  );
  const data = await response.json();
  setWeatherData(data);
};
```

## 🎨 UI/UX Design

### Color Scheme

**Dynamic Gradients:**
```typescript
const getWeatherBackground = (weatherMain: string): [string, string] => {
  switch (weatherMain.toLowerCase()) {
    case 'clear': return ['#60A5FA', '#2563EB'];
    case 'clouds': return ['#9CA3AF', '#4B5563'];
    case 'rain': return ['#3B82F6', '#4B5563'];
    case 'snow': return ['#BFDBFE', '#FFFFFF'];
    case 'thunderstorm': return ['#7C3AED', '#1F2937'];
    default: return ['#60A5FA', '#2563EB'];
  }
};
```

### Responsive Design

**Screen Dimensions:**
```typescript
const { width, height } = Dimensions.get('window');
```

**Flexible Layouts:**
```typescript
detailCard: {
  flex: 1,
  minWidth: (width - 64) / 2 - 8,
  backgroundColor: 'rgba(255, 255, 255, 0.2)',
  borderRadius: 8,
  padding: 16,
}
```

### Animation and Feedback

**Vibration Feedback:**
```typescript
Vibration.vibrate(500); // Trigger feedback
```

**Toast Notifications:**
```typescript
{showToast && (
  <View style={styles.toastContainer}>
    <Text style={styles.toastText}>Emergency service triggered</Text>
  </View>
)}
```

## ⚙️ Configuration

### Expo Configuration (`app.json`)

```json
{
  "expo": {
    "name": "weather-app",
    "slug": "weather-app",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "newArchEnabled": true,
    "splash": {
      "image": "./assets/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "ios": {
      "supportsTablet": true
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "edgeToEdgeEnabled": true
    }
  }
}
```

### TypeScript Configuration (`tsconfig.json`)

```json
{
  "compilerOptions": {
    "target": "esnext",
    "module": "commonjs",
    "lib": ["es6"],
    "allowJs": true,
    "jsx": "react-native",
    "noEmit": true,
    "isolatedModules": true,
    "strict": true,
    "moduleResolution": "node",
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "exclude": [
    "node_modules",
    "babel.config.js",
    "metro.config.js"
  ]
}
```

## 🔒 Security & Privacy

### Permission Management

**Required Permissions:**
- **Microphone**: For audio recording
- **Location**: For GPS-based weather
- **Network**: For API communication

**Permission Handling:**
```typescript
// Request microphone permission
const permission = await Audio.requestPermissionsAsync();

// Request location permission
const { status } = await Location.requestForegroundPermissionsAsync();
```

### Data Privacy

**Audio Data:**
- Temporary storage only
- Automatic cleanup after processing
- No persistent storage on device

**Location Data:**
- Used only for weather API calls
- Not stored or transmitted elsewhere
- User can disable location services

## 🐛 Troubleshooting

### Common Issues

1. **Audio Recording Not Working**
   ```bash
   # Check microphone permissions
   # Ensure server is running
   # Verify WebSocket connection
   ```

2. **Weather Data Not Loading**
   ```bash
   # Check internet connection
   # Verify location permissions
   # Try manual city search
   ```

3. **App Crashes on Startup**
   ```bash
   # Clear Expo cache
   expo r -c
   
   # Reset Metro bundler
   npm start -- --reset-cache
   ```

### Debug Mode

**Enable Debug Logging:**
```typescript
// Add console logs for debugging
console.log('🔌 Connected to server');
console.log('🎤 Recording started');
console.log('🎵 Audio blob:', { size: blob.size, type: blob.type });
```

**React Native Debugger:**
```bash
# Install React Native Debugger
npm install -g react-native-debugger

# Start debugger
react-native-debugger
```

## 🚀 Performance Optimization

### Memory Management

**Component Cleanup:**
```typescript
useEffect(() => {
  // Setup
  return () => {
    // Cleanup
    if (recording) {
      recording.stopAndUnloadAsync();
    }
  };
}, []);
```

**Image Optimization:**
- Use appropriate image sizes
- Implement lazy loading
- Optimize asset formats

### Network Optimization

**API Caching:**
- Weather data caching
- Connection pooling
- Request deduplication

**WebSocket Management:**
- Connection reuse
- Automatic reconnection
- Error recovery

## 📱 Platform-Specific Features

### iOS

**Audio Configuration:**
```typescript
allowsRecordingIOS: true,
playsInSilentModeIOS: true,
staysActiveInBackground: true,
```

**UI Adaptations:**
- Safe area handling
- iOS-specific styling
- Haptic feedback

### Android

**Audio Configuration:**
```typescript
shouldDuckAndroid: true,
playThroughEarpieceAndroid: false,
```

**UI Adaptations:**
- Edge-to-edge display
- Android-specific icons
- Material Design principles

## 🔄 Updates & Maintenance

### Dependency Updates

**Regular Updates:**
```bash
# Update Expo SDK
expo upgrade

# Update dependencies
npm update

# Check for security vulnerabilities
npm audit
```

### Code Maintenance

**TypeScript Strict Mode:**
- Enable strict type checking
- Fix type errors
- Maintain type safety

**Code Quality:**
- ESLint configuration
- Prettier formatting
- Code review process

---

**⚠️ Important**: This app includes audio recording capabilities. Ensure compliance with local privacy laws and regulations when using this feature. 