# CONTACT
*A Fully Covert Safety Application Disguised as a Weather App*


## 🌦️ What It Appears To Be

CONTACT presents itself as a beautiful, fully-functional weather application across multiple platforms:
- **Mobile App** (React Native/Expo): Real-time weather with location services
- **Web App** (Next.js): Responsive weather dashboard with modern UI
- **Operator Dashboard** (React/Vite): "Weather monitoring system"

The cover is perfect - users see legitimate weather data, location services, and intuitive weather interfaces that provide actual value as weather apps.

## 🚨 What It Actually Is

CONTACT is a sophisticated **covert emergency response system** designed to provide discrete safety services when users are in distress situations. The system operates three distinct but interconnected platforms:

### 📱 Mobile App (`contactMobile/`)
*Emergency communication system disguised as a weather app for mobile devices*

**Cover Story**: Beautiful React Native weather app with location-based forecasts
**Hidden Function**: Covert emergency communication and media capture system

**Unique Mobile Capabilities**:
- **Photo Capture**: Takes photo 1 second after activation  
- **Video Recording**: Begins video recording 2 seconds after activation
- **Location Tracking**: GPS coordinates transmitted with all media
- **Background Operation**: Continues recording while maintaining weather app appearance
- **Native Mobile Features**: Camera, microphone, and location services integration

### 💻 Web App (`contactWeb/`)
*Emergency communication system disguised as a weather dashboard for web platforms*

**Cover Story**: Professional weather monitoring web application  
**Hidden Function**: Covert emergency communication and analysis system

**Unique Web Capabilities**:
- **AI-Powered Analysis**: Real-time emergency situation assessment with reasoning
- **Emergency Call Integration**: Automatic Twilio-based emergency calling
- **Advanced Transcription**: Enhanced OpenAI Whisper integration with intelligent processing
- **Reasoning Analysis**: AI determines emergency level (none/low/medium/high/critical)
- **Cross-Platform Access**: Works on any device with a web browser

### Shared Core Features (Both Mobile & Web)
**Identical Covert Activation**:
- **Emergency Mode**: 3 taps on sunrise icon (☀️) activates full emergency protocol
- **Stop Mode**: 3 taps on sunset icon (🌙) deactivates emergency systems

**Common Emergency Capabilities**:
- **Immediate Audio Recording**: Starts continuous high-quality audio capture
- **Live Audio Streaming**: Real-time audio transmission to monitoring center
- **Real-time Transcription**: Audio converted to text using OpenAI Whisper
- **WebSocket Communication**: Both connect to the same backend server
- **Perfect Weather App Disguise**: Fully functional weather interface on both platforms

### 🎛️ Operator Dashboard (`operatorWeb/`)
*Emergency monitoring center disguised as weather operations dashboard*

**Cover Story**: Weather monitoring and forecasting operations center
**Hidden Function**: Real-time emergency response command center

**Monitoring Capabilities**:
- **Live Media Feeds**: Real-time video and audio from emergency devices
- **Emergency Transcription Display**: Live speech-to-text monitoring
- **Media History Browser**: Access to all emergency photos, videos, and audio
- **Multi-Device Monitoring**: Track multiple emergency situations simultaneously
- **Instant Response**: Real-time notification of emergency activations

## 🏗️ System Architecture

```
Emergency Clients (Alternative Platforms)
┌─────────────────────┬─────────────────────┐
│                     │                     │
▼                     ▼                     ▼
📱 Mobile App        💻 Web App           🎛️ Operator Dashboard
├── Weather Cover    ├── Weather Cover    ├── Weather Ops Cover
├── 3-Tap Activation ├── 3-Tap Activation ├── Live Media Feeds
├── Audio Recording  ├── Audio Recording  ├── Real-time Monitoring
├── Photo/Video      ├── AI Analysis      ├── Emergency Alerts
└── Live Streaming   └── Emergency Calls  └── Multi-Device Tracking
         │                    │                     │
         └────────────────────┼─────────────────────┘
                              ▼
                   🖥️ Backend Server (Node.js)
                   ├── WebSocket Communication
                   ├── OpenAI Whisper Integration  
                   ├── Media Processing & Storage
                   ├── LangGraph Agent Implementation
                   ├── Emergency Call Routing (Twilio)
                   ├── AI Reasoning Analysis
                   └── Multi-Platform Data Distribution
                              │
                              ▼
                   📞 Emergency Services Integration
```

## 🔐 Security & Covert Operation Features

### **Perfect Cover**
- Fully functional weather applications on all platforms
- Real location services and accurate weather data
- Normal app store appearance and behavior
- No visible emergency features in standard operation

### **Discrete Activation**
- No emergency buttons or obvious safety features
- Standard weather app interface maintained during operation
- Silent background recording with no visual indicators
- Continuous operation while using other app features

### **Intelligent Processing**
- Speech detection filters out silence and background noise
- Smart audio batching (21-second chunks) for efficient processing
- Real-time AI analysis of emergency situations
- Automatic escalation for critical situations

### **Secure Communication**
- Encrypted data transmission via WebSocket
- Base64 audio encoding for secure transfer
- Real-time streaming without local storage
- Multi-platform redundancy

## 🚀 Quick Setup

### Prerequisites
- Node.js 18+
- OpenAI API key (for transcription)
- Twilio Account (for emergency calling)
- Expo CLI (for mobile development)

### Environment Setup
```bash
# Clone the repository
git clone [repository-url]
cd contact

# Set up environment variables
cp contactMobile/server/env.example contactMobile/server/.env
# Add your OpenAI API key to the .env file
```

### Launch All Systems
```bash
# Start the mobile app and backend
cd contactMobile
npm run install:all
npm run dev

# Start the web interface
cd ../contactWeb
npm install
npm run dev

# Start the operator dashboard
cd ../operatorWeb
npm install
npm run dev
```

## 📋 Emergency Operation Protocol

### **Activation Sequence**
1. **User in distress opens weather app** (appears completely normal)
2. **3 taps on sunrise icon** - activates emergency mode
3. **Audio recording starts immediately** (no visible indication)
4. **Photo captured after 1 second** 
5. **Video recording begins after 2 seconds**
6. **All data streams live to monitoring center**

### **Monitoring Center Response**
1. **Operator dashboard receives real-time alerts**
2. **Live audio transcription appears immediately**
3. **AI analyzes situation and determines emergency level**
4. **Photos and video provide visual context**
5. **Emergency services contacted if critical**

### **Deactivation**
- **3 taps on sunset icon** - safely ends emergency mode
- **All recording stops**
- **Returns to normal weather app operation**

## 🔧 Technical Capabilities

### **Audio Processing**
- High-quality audio recording with noise suppression
- Real-time speech-to-text using OpenAI Whisper
- Smart audio content detection (filters silence)
- Continuous 3-second chunk processing
- Multiple audio format support (webm, mp4, wav, m4a)

### **Visual Intelligence**
- Automatic photo capture during emergencies
- High-definition video recording (720p)
- Live video streaming to monitoring center
- Photo and video history with timestamps

### **AI Analysis**
- **LangGraph Agent Implementation**: Sophisticated multi-step reasoning workflows
- Real-time emergency situation assessment using intelligent agent chains
- Sentiment analysis of audio transcriptions with contextual understanding
- Confidence scoring for emergency classifications through agent evaluation
- Automatic emergency service integration with intelligent decision-making

### **Communication Systems**
- WebSocket real-time data streaming
- Twilio emergency calling integration
- Multi-platform data synchronization
- Encrypted data transmission

## 🌍 Platform Coverage

### **Mobile Platforms**
- **iOS**: Full native support via Expo
- **Android**: Complete Android compatibility
- **Cross-platform**: Shared codebase with platform-specific optimizations

### **Web Platforms**
- **Desktop**: Full-featured web application
- **Mobile Web**: Responsive design for emergency web access
- **Operator Dashboard**: Professional monitoring interface

### **Deployment Options**
- **Local Development**: Complete local testing environment
- **Cloud Deployment**: Vercel-ready with edge runtime support
- **Production Scaling**: Docker and cloud-native architecture

## ⚠️ Legal and Ethical Considerations

This system is designed for legitimate emergency and safety purposes. Users should:

- **Comply with local privacy laws** regarding audio recording
- **Obtain proper consent** when required by jurisdiction
- **Use only for genuine emergency situations**
- **Ensure operator personnel are properly trained**
- **Implement appropriate data retention policies**
- **Consider legal requirements** for emergency service integration

## 🛡️ Privacy and Data Protection

- **Temporary Processing**: Audio data processed and deleted immediately
- **No Persistent Storage**: Media files stored only during active emergencies
- **Encrypted Transmission**: All data encrypted during transmission
- **Access Controls**: Operator dashboard requires authentication (production)
- **Audit Logging**: Complete activity logs for compliance

## 📞 Emergency Services Integration

The system can integrate with:
- **Local Emergency Services** (911, 311, etc.)
- **Private Security Services**
- **Corporate Safety Departments**
- **Family Emergency Contacts**
- **Medical Alert Services**

## 🔄 Continuous Operation

CONTACT is designed for:
- **24/7 Reliability**: Continuous monitoring capability
- **Instant Response**: Sub-second activation and response times
- **Multi-Device Support**: Monitor multiple emergency devices simultaneously
- **Redundant Systems**: Multiple communication channels for reliability
- **Automatic Recovery**: Self-healing system architecture

---

**CONTACT provides life-saving emergency response capabilities while maintaining perfect operational security through its weather app disguise. The system enables discrete emergency communication when traditional emergency services may not be accessible or safe to contact directly.**

*For technical documentation, see the README files in each component directory.*