import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  StatusBar,
  SafeAreaView,
  Dimensions,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Vibration,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { Audio } from 'expo-av';
import { io, Socket } from 'socket.io-client';
import { useWeatherData } from './hooks/useWeatherData';
import { useAudioRecording } from './hooks/useAudioRecording';
import { useCameraRecording } from './hooks/useCameraRecording';
import { useTapCounter } from './hooks/useTapCounter';
import { usePermissions } from './hooks/usePermissions';
import { PermissionsScreen } from './components/PermissionsScreen';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

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
  wind: {
    speed: number;
  };
  visibility: number;
  sys: {
    sunrise: number;
    sunset: number;
  };
}

export default function App() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [transcription, setTranscription] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  const [city, setCity] = useState('');
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);
  const [showToast, setShowToast] = useState(false);

  // Custom hooks
  const { weatherData, loading, error, fetchWeatherByCity } = useWeatherData(location);
  const { isRecording, startRecording, stopRecording } = useAudioRecording();
  const { 
    isRecording: isCameraRecording, 
    startRecording: startCameraRecording, 
    stopRecording: stopCameraRecording,
    capturePhoto,
    startVideoRecording,
    setCamera 
  } = useCameraRecording();
  const { 
    sunriseTaps, 
    sunsetTaps, 
    incrementSunriseTaps, 
    incrementSunsetTaps,
    resetSunriseTaps,
    resetSunsetTaps 
  } = useTapCounter();
  
  // Permission management
  const {
    permissionStatus,
    permissionChoices,
    isFirstLaunch,
    isLoading: permissionsLoading,
    savePermissionChoices,
    requestLocationPermission,
    requestMicrophonePermission,
    requestCameraPermission,
    checkCurrentPermissions,
  } = usePermissions();

  // Initialize location based on permission status
  useEffect(() => {
    if (permissionStatus.location === 'granted' && !location) {
      (async () => {
        try {
          let location = await Location.getCurrentPositionAsync({});
          setLocation(location);
        } catch (error) {
          console.error('Error getting location:', error);
          setErrorMsg('Failed to get current location');
        }
      })();
    }
  }, [permissionStatus.location, location]);

  // Initialize Socket.IO connection
  useEffect(() => {
    const newSocket = io('http://localhost:3001', {
      transports: ['websocket'],
      timeout: 20000,
    });

    newSocket.on('connect', () => {
      console.log('🔌 Connected to server');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('🔌 Disconnected from server');
      setIsConnected(false);
    });

    newSocket.on('transcriptionUpdate', (data) => {
      if (data.success) {
        setTranscription(data.text);
        Alert.alert('🎤 Transcription', data.text);
      } else {
        console.log('❌ Transcription failed:', data.error || data.reason);
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  // Handle permission choices completion
  const handlePermissionsComplete = async (choices: {
    location: boolean;
    microphone: boolean;
    camera: boolean;
  }) => {
    await savePermissionChoices(choices);
  };

  // Show loading screen while checking permissions
  if (permissionsLoading) {
    console.log('🔍 Loading permissions...');
    return (
      <LinearGradient
        colors={['#60A5FA', '#2563EB']}
        style={styles.container}
      >
        <StatusBar barStyle="light-content" />
        <SafeAreaView style={styles.container}>
          <View style={styles.loadingContainer}>
            <Ionicons name="cloud" size={64} color="#FFFFFF" />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // Show permissions screen on first launch
  if (isFirstLaunch) {
    console.log('🎯 First launch detected, showing permissions screen');
    return (
      <PermissionsScreen onComplete={handlePermissionsComplete} />
    );
  }

  // Fallback: if permission system is not working, show main app
  if (isFirstLaunch === null && !permissionsLoading) {
    console.log('⚠️ Permission system not initialized, showing main app');
  }

  console.log('📱 App ready, permission status:', permissionStatus);

  const getWeatherIcon = (iconCode: string) => {
    const iconMap: { [key: string]: keyof typeof Ionicons.glyphMap } = {
      '01d': 'sunny',
      '01n': 'moon',
      '02d': 'partly-sunny',
      '02n': 'partly-sunny',
      '03d': 'cloudy',
      '03n': 'cloudy',
      '04d': 'cloudy',
      '04n': 'cloudy',
      '09d': 'rainy',
      '09n': 'rainy',
      '10d': 'rainy',
      '10n': 'rainy',
      '11d': 'thunderstorm',
      '11n': 'thunderstorm',
      '13d': 'snow',
      '13n': 'snow',
      '50d': 'water',
      '50n': 'water',
    };
    return iconMap[iconCode] || 'partly-sunny';
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getWeatherBackground = (weatherMain: string): [string, string] => {
    switch (weatherMain.toLowerCase()) {
      case 'clear':
        return ['#60A5FA', '#2563EB'];
      case 'clouds':
        return ['#9CA3AF', '#4B5563'];
      case 'rain':
      case 'drizzle':
        return ['#3B82F6', '#4B5563'];
      case 'snow':
        return ['#BFDBFE', '#FFFFFF'];
      case 'thunderstorm':
        return ['#7C3AED', '#1F2937'];
      case 'mist':
      case 'fog':
        return ['#D1D5DB', '#6B7280'];
      default:
        return ['#60A5FA', '#2563EB'];
    }
  };

  const requestLocation = async () => {
    try {
      const status = await requestLocationPermission();
      if (status !== 'granted') {
        setErrorMsg('Location access denied. Please search for a city manually.');
        return;
      }

      setShowLocationPrompt(false);
      let location = await Location.getCurrentPositionAsync({});
      setLocation(location);
    } catch (error) {
      setErrorMsg('Failed to get location. Please search for a city manually.');
    }
  };

  const handleSubmit = () => {
    if (city.trim()) {
      fetchWeatherByCity(city.trim());
      setCity('');
    }
  };

  // Handle sunrise tap (start recording)
  const handleSunriseTap = () => {
    incrementSunriseTaps();
    
    if (sunriseTaps === 2) { // 3rd tap
      if (!isRecording && !isCameraRecording) {
        setShowToast(true);
        Vibration.vibrate(500);
        resetSunriseTaps();
        
        // Start both audio and camera recording automatically after a short delay
        setTimeout(async () => {
          try {
            // Start audio recording
            await startRecording();
            
            // Start camera recording
            await startCameraRecording();
            
            // Capture a photo immediately
            setTimeout(() => {
              capturePhoto();
            }, 1000);
            
            // Start video recording after photo
            setTimeout(() => {
              startVideoRecording();
            }, 2000);
            
          } catch (error) {
            console.error('Error starting emergency recording:', error);
          }
        }, 1000);
        
        // Hide toast after 3 seconds
        setTimeout(() => {
          setShowToast(false);
        }, 3000);
      } else {
        resetSunriseTaps();
      }
    }
  };

  // Handle sunset tap (stop recording)
  const handleSunsetTap = () => {
    incrementSunsetTaps();
    
    if (sunsetTaps === 2) { // 3rd tap
      if (isRecording || isCameraRecording) {
        setShowToast(true);
        Vibration.vibrate(500);
        resetSunsetTaps();
        
        // Stop both recordings
        setTimeout(async () => {
          try {
            // Stop audio recording
            if (isRecording) {
              await stopRecording();
            }
            
            // Stop camera recording
            if (isCameraRecording) {
              await stopCameraRecording();
            }
            
          } catch (error) {
            console.error('Error stopping emergency recording:', error);
          }
        }, 1000);
        
        // Hide toast after 3 seconds
        setTimeout(() => {
          setShowToast(false);
        }, 3000);
      } else {
        resetSunsetTaps();
      }
    }
  };

  if (errorMsg && !weatherData) {
    return (
      <LinearGradient
        colors={['#60A5FA', '#2563EB']}
        style={styles.container}
      >
        <StatusBar barStyle="light-content" />
        <SafeAreaView style={styles.container}>
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{errorMsg}</Text>
            <TouchableOpacity 
              style={styles.errorButton}
              onPress={() => setShowLocationPrompt(true)}
            >
              <Text style={styles.errorButtonText}>Search City</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={weatherData ? getWeatherBackground(weatherData.weather[0].main) : ['#60A5FA', '#2563EB']}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Toast Notification */}
            {showToast && (
              <View style={{
                position: 'absolute',
                top: 60,
                left: 0,
                right: 0,
                alignItems: 'center',
                zIndex: 100,
              }}>
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: '#EF4444',
                  paddingHorizontal: 24,
                  paddingVertical: 14,
                  borderRadius: 24,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.25,
                  shadowRadius: 3.84,
                  elevation: 5,
                }}>
                  <Ionicons name="alert-circle" size={24} color="#fff" style={{ marginRight: 10 }} />
                  <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>
                    Emergency service activated - Camera & Audio recording
                  </Text>
                </View>
              </View>
            )}

            {/* Search Form */}
            {(!showLocationPrompt || weatherData || permissionStatus.location === 'denied') && (
              <View style={styles.searchContainer}>
                <View style={styles.searchInputContainer}>
                  <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
                  <TextInput
                    style={styles.searchInput}
                    value={city}
                    onChangeText={setCity}
                    placeholder="Enter city name..."
                    placeholderTextColor="#9CA3AF"
                    onSubmitEditing={handleSubmit}
                  />
                  <TouchableOpacity 
                    style={styles.searchButton}
                    onPress={handleSubmit}
                    disabled={loading}
                  >
                    <Text style={styles.searchButtonText}>
                      {loading ? '...' : 'Search'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Location Permission Prompt */}
            {showLocationPrompt && !weatherData && !loading && permissionStatus.location !== 'denied' && (
              <View style={styles.permissionOverlay}>
                <View style={styles.permissionContainer}>
                  <Ionicons name="navigate" size={48} color="#BFDBFE" style={styles.permissionIcon} />
                  <Text style={styles.permissionTitle}>Get Weather for Your Location</Text>
                  <Text style={styles.permissionSubtitle}>
                    Allow location access to see weather for your current location
                  </Text>
                  <View style={styles.permissionButtons}>
                    <TouchableOpacity 
                      style={styles.permissionButtonPrimary}
                      onPress={requestLocation}
                    >
                      <Text style={styles.permissionButtonText}>Allow Location</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.permissionButtonSecondary}
                      onPress={() => setShowLocationPrompt(false)}
                    >
                      <Text style={styles.permissionButtonText}>Search City</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}

            {/* Error Message */}
            {error && (
              <View style={styles.errorMessageContainer}>
                <Text style={styles.errorMessageText}>{error}</Text>
              </View>
            )}

            {/* Weather Display */}
            {weatherData && (
              <View style={styles.weatherCard}>
                {/* Current Location Label */}
                <View style={styles.locationLabelContainer}>
                  <Text style={styles.locationLabel}>Current Location</Text>
                </View>

                {/* Location */}
                <View style={styles.locationContainer}>
                  <Ionicons name="location" size={20} color="#BFDBFE" />
                  <Text style={styles.locationText}>{weatherData.name}</Text>
                </View>

                {/* Main Weather */}
                <View style={styles.mainWeatherContainer}>
                  <View style={styles.temperatureContainer}>
                    <Ionicons 
                      name={getWeatherIcon(weatherData.weather[0].icon)} 
                      size={64} 
                      color="#FFD700" 
                    />
                    <Text style={styles.temperature}>
                      {Math.round(weatherData.main.temp)}°F
                    </Text>
                  </View>
                  <Text style={styles.description}>
                    {weatherData.weather[0].description}
                  </Text>
                  <Text style={styles.feelsLike}>
                    Feels like {Math.round(weatherData.main.feels_like)}°F
                  </Text>
                </View>

                {/* Weather Details Grid */}
                <View style={styles.detailsGrid}>
                  <View style={styles.detailCard}>
                    <View style={styles.detailHeader}>
                      <Ionicons name="thermometer" size={16} color="#BFDBFE" />
                      <Text style={styles.detailLabel}>Temperature</Text>
                    </View>
                    <Text style={styles.detailValue}>{Math.round(weatherData.main.temp)}°F</Text>
                  </View>

                  <View style={styles.detailCard}>
                    <View style={styles.detailHeader}>
                      <Ionicons name="water" size={16} color="#BFDBFE" />
                      <Text style={styles.detailLabel}>Humidity</Text>
                    </View>
                    <Text style={styles.detailValue}>{weatherData.main.humidity}%</Text>
                  </View>

                  <View style={styles.detailCard}>
                    <View style={styles.detailHeader}>
                      <Ionicons name="speedometer" size={16} color="#BFDBFE" />
                      <Text style={styles.detailLabel}>Wind Speed</Text>
                    </View>
                    <Text style={styles.detailValue}>{weatherData.wind.speed} m/s</Text>
                  </View>

                  <View style={styles.detailCard}>
                    <View style={styles.detailHeader}>
                      <Ionicons name="eye" size={16} color="#BFDBFE" />
                      <Text style={styles.detailLabel}>Visibility</Text>
                    </View>
                    <Text style={styles.detailValue}>{(weatherData.visibility / 1000).toFixed(1)} km</Text>
                  </View>
                </View>

                {/* Sunrise/Sunset with Secret Trigger */}
                <View style={styles.sunriseSunsetContainer}>
                  <TouchableOpacity 
                    style={styles.sunriseSunsetCard}
                    onPress={handleSunriseTap}
                    activeOpacity={0.7}
                  >
                    <View style={styles.sunriseSunsetHeader}>
                      <Ionicons name="sunny" size={16} color="#FFD700" />
                      <Text style={styles.sunriseSunsetLabel}>Sunrise</Text>
                    </View>
                    <Text style={styles.sunriseSunsetValue}>
                      {formatTime(weatherData.sys.sunrise)}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.sunriseSunsetCard}
                    onPress={handleSunsetTap}
                    activeOpacity={0.7}
                  >
                    <View style={styles.sunriseSunsetHeader}>
                      <Ionicons name="moon" size={16} color="#C0C0C0" />
                      <Text style={styles.sunriseSunsetLabel}>Sunset</Text>
                    </View>
                    <Text style={styles.sunriseSunsetValue}>
                      {formatTime(weatherData.sys.sunset)}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Refresh Location Button */}
                {permissionStatus.location === 'granted' && (
                  <TouchableOpacity 
                    style={styles.refreshButton}
                    onPress={requestLocation}
                    disabled={loading}
                  >
                    <Ionicons name="navigate" size={16} color="#FFFFFF" />
                    <Text style={styles.refreshButtonText}>
                      {loading ? 'Updating...' : 'Refresh Location Weather'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Instructions */}
            {!weatherData && !loading && !showLocationPrompt && (
              <View style={styles.instructionsContainer}>
                <Text style={styles.instructionsTitle}>Enter a city name to get started</Text>
                <Text style={styles.instructionsSubtitle}>Try: London, New York, Tokyo, Paris...</Text>
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 32,
    paddingBottom: 20,
  },
  toastContainer: {
    position: 'absolute',
    top: 16,
    left: '50%',
    transform: [{ translateX: -100 }],
    zIndex: 50,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toastDot: {
    width: 8,
    height: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
    marginRight: 8,
  },
  toastText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  searchContainer: {
    marginBottom: 24,
    paddingTop: 8,
  },
  searchInputContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    paddingRight: 80,
  },
  searchButton: {
    position: 'absolute',
    right: 4,
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  permissionOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(96, 165, 250, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  permissionContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    padding: 24,
    width: width - 32,
    alignItems: 'center',
  },
  permissionIcon: {
    marginBottom: 16,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  permissionSubtitle: {
    fontSize: 16,
    color: '#BFDBFE',
    marginBottom: 24,
    textAlign: 'center',
  },
  permissionButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  permissionButtonPrimary: {
    flex: 1,
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 25,
    alignItems: 'center',
  },
  permissionButtonSecondary: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 25,
    alignItems: 'center',
  },
  permissionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  errorMessageContainer: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#F87171',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  errorMessageText: {
    color: '#DC2626',
    fontSize: 16,
    textAlign: 'center',
  },
  weatherCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  locationLabelContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  locationLabel: {
    fontSize: 18,
    fontWeight: '500',
    color: '#BFDBFE',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  locationText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  mainWeatherContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  temperatureContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  temperature: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  description: {
    fontSize: 18,
    color: '#BFDBFE',
    textTransform: 'capitalize',
    marginBottom: 4,
  },
  feelsLike: {
    fontSize: 14,
    color: '#93C5FD',
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 24,
  },
  detailCard: {
    flex: 1,
    minWidth: (width - 64) / 2 - 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    padding: 16,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#BFDBFE',
    marginLeft: 8,
  },
  detailValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  sunriseSunsetContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  sunriseSunsetCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    padding: 16,
  },
  sunriseSunsetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sunriseSunsetLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#BFDBFE',
    marginLeft: 8,
  },
  sunriseSunsetValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  instructionsContainer: {
    alignItems: 'center',
    marginTop: 32,
  },
  instructionsTitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
  },
  instructionsSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#F87171',
    textAlign: 'center',
    marginBottom: 24,
  },
  errorButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
  },
  errorButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#FFFFFF',
    marginTop: 16,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 12,
    borderRadius: 25,
    marginTop: 24,
  },
  refreshButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
}); 