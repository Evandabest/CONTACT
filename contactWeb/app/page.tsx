'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Thermometer, Droplets, Wind, Eye, Sunrise, Sunset, Navigation, Mic, MicOff, Phone, Video, VideoOff, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { usePusher } from './hooks/usePusher';
import { useAudioRecorder } from './hooks/useAudioRecorder';
import { useCamera } from './hooks/useCamera';
import { useReverseGeocode, formatAddressForDisplay } from './hooks/useReverseGeocode';

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

interface LocationData {
  lat: number;
  lon: number;
  timestamp: number;
}

export default function WeatherApp() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [locationPermission, setLocationPermission] = useState<'granted' | 'denied' | 'prompt' | null>(null);
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);
  const [tapCount, setTapCount] = useState(0);
  const [sunriseTapCount, setSunriseTapCount] = useState(0);
  const [sunsetTapCount, setSunsetTapCount] = useState(0);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');

  // Pusher and Audio Recording hooks
  const {
    isConnected,
    isRecording,
    transcription,
    analysis,
    emergencyCall: emergencyCallResult,
    error: pusherError,
    sendAudioData,
    startRecording: pusherStartRecording,
    stopRecording: pusherStopRecording,
    clearTranscription,
    initiateEmergencyCall,
    isStreamingVideo,
    remoteStream,
    startVideoCall,
    stopVideoCall,
  } = usePusher();

  const {
    isRecording: isAudioRecording,
    isSupported: isAudioSupported,
    hasPermission: hasAudioPermission,
    error: audioError,
    startRecording: audioStartRecording,
    stopRecording: audioStopRecording,
    requestPermission: requestAudioPermission,
  } = useAudioRecorder(sendAudioData);

  // Camera hook
  const {
    stream: localStream,
    error: cameraError,
    isStreaming: isCameraStreaming,
    requestPermission: requestCameraPermission,
    startStreaming: startCameraStreaming,
    stopStreaming: stopCameraStreaming,
  } = useCamera();

  // Reverse Geocoding hook
  const {
    address,
    loading: geocodeLoading,
    error: geocodeError,
    geocodeLocation,
    clearAddress,
  } = useReverseGeocode();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const getWeatherIcon = (iconCode: string) => {
    return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const setLocationCookie = (lat: number, lon: number) => {
    const locationData: LocationData = {
      lat,
      lon,
      timestamp: Date.now()
    };
    const cookieValue = encodeURIComponent(JSON.stringify(locationData));
    document.cookie = `weatherLocation=${cookieValue}; max-age=2592000; path=/`; // 30 days
  };

  const getLocationCookie = (): LocationData | null => {
    const cookies = document.cookie.split(';');
    const locationCookie = cookies.find(cookie => cookie.trim().startsWith('weatherLocation='));
    
    if (locationCookie) {
      try {
        const cookieValue = locationCookie.split('=')[1];
        const locationData: LocationData = JSON.parse(decodeURIComponent(cookieValue));
        
        // Check if cookie is less than 30 days old
        const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
        if (locationData.timestamp > thirtyDaysAgo) {
          return locationData;
        }
      } catch (error) {
        console.error('Error parsing location cookie:', error);
      }
    }
    return null;
  };

  const clearLocationCookie = () => {
    document.cookie = 'weatherLocation=; max-age=0; path=/';
  };

  const fetchWeatherByCoords = async (lat: number, lon: number) => {
    setLoading(true);
    setError('');
    
    try {
      // Fetch weather data and reverse geocode simultaneously
      const [weatherResponse, geocodePromise] = await Promise.allSettled([
        fetch(`/api/weather?lat=${lat}&lon=${lon}`),
        geocodeLocation(lat, lon)
      ]);
      
      if (weatherResponse.status === 'fulfilled' && weatherResponse.value.ok) {
        const data = await weatherResponse.value.json();
        console.log('Weather data received:', data);
        setWeather(data);
      } else {
        throw new Error('Failed to fetch weather data');
      }
      
      // Geocoding is handled by the hook, no need to handle the promise here
      
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Failed to fetch weather data. Please try searching for a city.');
    } finally {
      setLoading(false);
    }
  };

  const fetchWeather = async (cityName: string) => {
    setLoading(true);
    setError('');
    
    // Clear previous address data when searching by city
    clearAddress();
    
    try {
      const response = await fetch(
        `/api/weather?city=${encodeURIComponent(cityName)}`
      );
      
      console.log('API Response status:', response.status);
      
      const data = await response.json();
      console.log('Weather data received:', data);
      setWeather(data);
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Failed to fetch weather data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }

    setLoading(true);
    setError('');
    
    // Clear previous address data when getting new location
    clearAddress();

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocationPermission('granted');
        setLocationCookie(latitude, longitude);
        fetchWeatherByCoords(latitude, longitude);
      },
      (error) => {
        setLocationPermission('denied');
        setLoading(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setError('Location access denied. Please search for a city manually.');
            break;
          case error.POSITION_UNAVAILABLE:
            setError('Location information unavailable. Please search for a city manually.');
            break;
          case error.TIMEOUT:
            setError('Location request timed out. Please search for a city manually.');
            break;
          default:
            setError('An unknown error occurred. Please search for a city manually.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (city.trim()) {
      fetchWeather(city.trim());
    }
  };

  const getWeatherBackground = (weatherMain: string) => {
    switch (weatherMain.toLowerCase()) {
      case 'clear':
        return 'bg-gradient-to-br from-blue-400 to-blue-600';
      case 'clouds':
        return 'bg-gradient-to-br from-gray-400 to-gray-600';
      case 'rain':
      case 'drizzle':
        return 'bg-gradient-to-br from-blue-500 to-gray-600';
      case 'snow':
        return 'bg-gradient-to-br from-blue-200 to-white';
      case 'thunderstorm':
        return 'bg-gradient-to-br from-purple-600 to-gray-800';
      case 'mist':
      case 'fog':
        return 'bg-gradient-to-br from-gray-300 to-gray-500';
      default:
        return 'bg-gradient-to-br from-blue-400 to-blue-600';
    }
  };

  const showToastMessage = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleSunriseTap = async () => {
    const newSunriseTapCount = sunriseTapCount + 1;
    setSunriseTapCount(newSunriseTapCount);

    if (newSunriseTapCount === 1) {
      // First tap: Request audio permission
      if (!hasAudioPermission) {
        showToastMessage('Requesting audio permission...', 'info');
        try {
          await requestAudioPermission();
          showToastMessage('Audio permission granted! Tap again for video permission.', 'success');
        } catch (error) {
          showToastMessage('Audio permission denied. Please enable in browser settings.', 'error');
        }
      } else {
        showToastMessage('Audio permission already granted! Tap again for video permission.', 'info');
      }
    } else if (newSunriseTapCount === 2) {
      // Second tap: Request video permission
      if (!localStream) {
        showToastMessage('Requesting camera permission...', 'info');
        try {
          await requestCameraPermission();
          showToastMessage('Camera permission granted! Tap once more to start recording.', 'success');
        } catch (error) {
          showToastMessage('Camera permission denied. Please enable in browser settings.', 'error');
        }
      } else {
        showToastMessage('Camera permission already granted! Tap once more to start recording.', 'info');
      }
    } else if (newSunriseTapCount === 3) {
      // Third tap: Start recording and video
      if (isRecording) {
        showToastMessage('Already recording!', 'error');
        setSunriseTapCount(0);
        return;
      }
      
      if (!hasAudioPermission) {
        showToastMessage('Audio permission required. Please tap to request permissions first.', 'error');
        setSunriseTapCount(0);
        return;
      }
      
      showToastMessage('Starting recording and video stream...', 'success');
      setSunriseTapCount(0); // Reset count after triggering
      
      // Start recording and video with a slight delay
      setTimeout(async () => {
        pusherStartRecording();
        audioStartRecording();
        
        // Start camera and video call if we have camera permission
        if (localStream) {
          startVideoCall(localStream);
        } else {
          // Try to start camera if we don't have stream yet
          const stream = await startCameraStreaming();
          if (stream) {
            startVideoCall(stream);
          }
        }
      }, 1000);
    }

    // Reset tap count after a delay
    setTimeout(() => {
      setSunriseTapCount(currentCount => currentCount === newSunriseTapCount ? 0 : currentCount);
    }, 3000); // Reset after 3 seconds
  };

  const handleSunsetTap = () => {
    // Only allow if weather data is loaded
    if (!weather) return;

    setSunsetTapCount(prev => prev + 1);
    
    // Reset tap count after 2 seconds
    setTimeout(() => setSunsetTapCount(0), 2000);
    
    // Stop recording on 3 taps
    if (sunsetTapCount === 2) {
      if (!isRecording) {
        showToastMessage("Not currently recording!", 'error');
        return;
      }
      
      showToastMessage("Stopping recording & video stream...", 'info');
      
      // Stop recording
      audioStopRecording();
      pusherStopRecording();
      clearTranscription();

      // Stop camera and video call
      stopVideoCall();
      stopCameraStreaming();
    } else {
      showToastMessage(`Tapped sunset ${sunsetTapCount + 1}/3 times. Tap ${2 - sunsetTapCount} more to stop recording.`, 'info');
    }
  };

  useEffect(() => {
    const initializeWeather = async () => {
      // First, check if we have a stored location cookie
      const storedLocation = getLocationCookie();
      
      if (storedLocation) {
        console.log('Using stored location from cookie:', storedLocation);
        setLocationPermission('granted');
        await fetchWeatherByCoords(storedLocation.lat, storedLocation.lon);
        return;
      }

      // If no stored location, check if geolocation is supported
      if (navigator.geolocation) {
        setShowLocationPrompt(true);
      }
    };

    initializeWeather();
  }, []);

  // Monitor for automatic emergency calls
  useEffect(() => {
    if (emergencyCallResult && emergencyCallResult.success && emergencyCallResult.callSid) {
      showToastMessage(
        `🚨 Emergency call initiated automatically! Call ID: ${emergencyCallResult.callSid}`, 
        'error'
      );
    } else if (emergencyCallResult && !emergencyCallResult.success) {
      showToastMessage(
        `❌ Emergency call failed: ${emergencyCallResult.error}`, 
        'error'
      );
    }
  }, [emergencyCallResult]);

  return (
    <div className={`min-h-screen transition-colors duration-500 ${getWeatherBackground(weather?.weather[0].main || 'clear')}`}>
      <div className="max-w-md mx-auto">
        {/* Search Form - Moved to top */}
        {(!showLocationPrompt || weather || locationPermission === 'denied') && (
          <form onSubmit={handleSubmit} className="mb-6 pt-8">
            <div className="relative">
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Enter city name..."
                className="w-full px-4 py-3 pl-12 pr-20 rounded-full bg-white/90 backdrop-blur-sm border-0 focus:ring-2 focus:ring-blue-300 focus:outline-none text-gray-800 placeholder-gray-500"
              />
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <button
                type="submit"
                disabled={loading}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors"
              >
                {loading ? '...' : 'Search'}
              </button>
            </div>
          </form>
        )}

        {/* Location Permission Prompt */}
        {showLocationPrompt && !weather && !loading && locationPermission !== 'denied' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-blue-400 to-blue-600">
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 text-white w-full max-w-sm mx-auto">
              <div className="text-center">
                <Navigation className="w-12 h-12 mx-auto mb-4 text-blue-200" />
                <h3 className="text-xl font-bold mb-2">Get Weather for Your Location</h3>
                <p className="text-blue-100 mb-4">
                  Allow location access to see weather for your current location
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={requestLocation}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-full font-medium transition-colors"
                  >
                    Allow Location
                  </button>
                  <button
                    onClick={() => setShowLocationPrompt(false)}
                    className="flex-1 bg-white/20 hover:bg-white/30 text-white px-4 py-3 rounded-full font-medium transition-colors"
                  >
                    Search City
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Video Display - Only show when streaming */}
        {(localStream || remoteStream) && (
          <div className="grid grid-cols-2 gap-4 mb-6">
            {localStream && (
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-3">
                <h4 className="text-sm font-bold text-white mb-2">Local Video</h4>
                <video ref={localVideoRef} autoPlay muted playsInline className="w-full rounded-lg"></video>
              </div>
            )}
            {remoteStream && (
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-3">
                <h4 className="text-sm font-bold text-white mb-2">Remote Video</h4>
                <video ref={remoteVideoRef} autoPlay playsInline className="w-full rounded-lg"></video>
              </div>
            )}
          </div>
        )}

        {/* Transcription Display */}
        {transcription && (
          <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 mb-6 text-white">
            <h3 className="text-lg font-bold mb-3">Live Transcription</h3>
            <div className="bg-white/10 rounded-lg p-3">
              <p className="text-sm">{transcription}</p>
            </div>
          </div>
        )}

        {/* Analysis Display */}
        {analysis && (
          <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 mb-6 text-white">
            <h3 className="text-lg font-bold mb-3">Audio Analysis</h3>
            <div className="bg-white/10 rounded-lg p-3 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span>Emergency Level:</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  analysis.emergencyLevel === 'critical' ? 'bg-red-500 text-white' :
                  analysis.emergencyLevel === 'high' ? 'bg-orange-500 text-white' :
                  analysis.emergencyLevel === 'medium' ? 'bg-yellow-500 text-black' :
                  analysis.emergencyLevel === 'low' ? 'bg-blue-500 text-white' :
                  'bg-green-500 text-white'
                }`}>
                  {analysis.emergencyLevel}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Sentiment:</span>
                <span className="text-blue-200">{analysis.sentiment}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Confidence:</span>
                <span className="text-blue-200">{(analysis.confidence * 100).toFixed(1)}%</span>
              </div>
              {analysis.actionRequired && (
                <div className="mt-2 p-2 bg-yellow-500/20 border border-yellow-400/30 rounded-lg">
                  <div className="flex items-center">
                    <AlertTriangle className="h-3 w-3 text-yellow-400 mr-2" />
                    <span className="text-yellow-200 text-xs">Action Required</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* System Errors Display */}
        {(pusherError || audioError || cameraError) && (
          <div className="bg-red-500/20 border border-red-400/30 rounded-lg p-4 mb-6">
            <h4 className="text-red-200 font-bold mb-2 text-sm">System Errors</h4>
            {pusherError && (
              <div className="flex items-center mb-1">
                <XCircle className="h-3 w-3 text-red-400 mr-2" />
                <span className="text-red-200 text-xs">Pusher: {pusherError}</span>
              </div>
            )}
            {audioError && (
              <div className="flex items-center mb-1">
                <XCircle className="h-3 w-3 text-red-400 mr-2" />
                <span className="text-red-200 text-xs">Audio: {audioError}</span>
              </div>
            )}
            {cameraError && (
              <div className="flex items-center">
                <XCircle className="h-3 w-3 text-red-400 mr-2" />
                <span className="text-red-200 text-xs">Camera: {cameraError}</span>
              </div>
            )}
          </div>
        )}

        {/* Weather Display */}
        {weather && (
          <div className={`${getWeatherBackground(weather.weather[0].main)} rounded-2xl p-6 text-white shadow-xl backdrop-blur-sm`}>
            {/* Current Location Label */}
            <div className="text-center mb-4">
              <h2 className="text-lg font-medium text-blue-100">Current Location</h2>
            </div>

            {/* Location */}
            <div className="text-center mb-4">
              <div className="flex items-center justify-center mb-2">
                <MapPin className="w-5 h-5 mr-2" />
                <h2 className="text-2xl font-bold">{weather.name}</h2>
              </div>
              
              {/* Street Address from Mapbox */}
              {address && (
                <div className="text-sm text-blue-100 max-w-xs mx-auto">
                  <p className="truncate" title={formatAddressForDisplay(address)}>
                    📍 {formatAddressForDisplay(address)}
                  </p>
                </div>
              )}
              
              {/* Loading state for geocoding */}
              {geocodeLoading && (
                <div className="text-xs text-blue-200 mt-1">
                  Getting street address...
                </div>
              )}
              
              {/* Geocoding error (optional - only show if wanted) */}
              {geocodeError && !address && (
                <div className="text-xs text-blue-200 mt-1">
                  Street address unavailable
                </div>
              )}
            </div>

            {/* Main Weather */}
            <div className="text-center mb-6">
              <div className="flex items-center justify-center mb-2">
                <img
                  src={getWeatherIcon(weather.weather[0].icon)}
                  alt={weather.weather[0].description}
                  className="w-16 h-16"
                />
                <div className="text-4xl font-bold ml-2">
                  {Math.round(weather.main.temp)}°F
                </div>
              </div>
              <p className="text-lg capitalize text-blue-100">
                {weather.weather[0].description}
              </p>
              <p className="text-sm text-blue-200">
                Feels like {Math.round(weather.main.feels_like)}°F
              </p>
            </div>

            {/* Weather Details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/20 rounded-lg p-4 backdrop-blur-sm">
                <div className="flex items-center mb-2">
                  <Thermometer className="w-4 h-4 mr-2" />
                  <span className="text-sm font-medium">Temperature</span>
                </div>
                <p className="text-lg font-bold">{Math.round(weather.main.temp)}°F</p>
              </div>

              <div className="bg-white/20 rounded-lg p-4 backdrop-blur-sm hover:bg-white/30 transition-colors cursor-pointer">
                <Link href="/humidity" className="block">
                  <div className="flex items-center mb-2">
                    <Droplets className="w-4 h-4 mr-2" />
                    <span className="text-sm font-medium">Humidity</span>
                  </div>
                  <p className="text-lg font-bold">{weather.main.humidity}%</p>
                </Link>
              </div>

              <div className="bg-white/20 rounded-lg p-4 backdrop-blur-sm">
                <div className="flex items-center mb-2">
                  <Wind className="w-4 h-4 mr-2" />
                  <span className="text-sm font-medium">Wind Speed</span>
                </div>
                <p className="text-lg font-bold">{weather.wind.speed} m/s</p>
              </div>

              <div className="bg-white/20 rounded-lg p-4 backdrop-blur-sm">
                <div className="flex items-center mb-2">
                  <Eye className="w-4 h-4 mr-2" />
                  <span className="text-sm font-medium">Visibility</span>
                </div>
                <p className="text-lg font-bold">{(weather.visibility / 1000).toFixed(1)} km</p>
              </div>
            </div>

            {/* Sunrise/Sunset with Recording Controls */}
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div 
                className="bg-white/20 rounded-lg p-4 backdrop-blur-sm cursor-pointer hover:bg-white/30 transition-colors"
                onClick={handleSunriseTap}
              >
                <div className="flex items-center mb-2">
                  <Sunrise className="w-4 h-4 mr-2" />
                  <span className="text-sm font-medium">Sunrise</span>
                  {sunriseTapCount > 0 && (
                    <span className="ml-2 text-xs bg-blue-500 px-2 py-1 rounded">
                      {sunriseTapCount}/3
                    </span>
                  )}
                </div>
                <p className="text-lg font-bold">{formatTime(weather.sys.sunrise)}</p>
                <p className="text-xs text-blue-200 mt-1">
                  {!hasAudioPermission 
                    ? "Tap for audio permission" 
                    : !localStream 
                    ? "Tap for camera permission" 
                    : "Tap to start recording"
                  }
                </p>
              </div>

              <div 
                className="bg-white/20 rounded-lg p-4 backdrop-blur-sm cursor-pointer hover:bg-white/30 transition-colors"
                onClick={handleSunsetTap}
              >
                <div className="flex items-center mb-2">
                  <Sunset className="w-4 h-4 mr-2" />
                  <span className="text-sm font-medium">Sunset</span>
                  {sunsetTapCount > 0 && (
                    <span className="ml-2 text-xs bg-red-500 px-2 py-1 rounded">
                      {sunsetTapCount + 1}/3
                    </span>
                  )}
                </div>
                <p className="text-lg font-bold">{formatTime(weather.sys.sunset)}</p>
                <p className="text-xs text-blue-200 mt-1">Tap 3x to stop recording</p>
              </div>
            </div>

            {/* Refresh Location Button */}
            {locationPermission === 'granted' && (
              <div className="mt-6">
                <button
                  onClick={requestLocation}
                  disabled={loading}
                  className="w-full bg-white/20 hover:bg-white/30 disabled:bg-white/10 text-white px-4 py-3 rounded-full font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Navigation className="w-4 h-4" />
                  {loading ? 'Updating...' : 'Refresh Location Weather'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Instructions */}
        {!weather && !loading && !showLocationPrompt && (
          <div className="text-center text-white/80 mt-8">
            <p className="text-lg mb-2">Enter a city name to get started</p>
            <p className="text-sm">Try: London, New York, Tokyo, Paris...</p>
            <div className="mt-4">
              <Link 
                href="/test-pusher" 
                className="inline-block bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Test Pusher Implementation
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Live status bar */}
      {isRecording && (
        <div className="fixed bottom-0 left-0 right-0 bg-red-600 text-white p-2 text-center text-sm font-bold z-40 flex items-center justify-center">
          <Mic className="h-4 w-4 mr-2 animate-pulse" />
          <span>RECORDING AUDIO</span>
          {isCameraStreaming && (
            <>
              <span className="mx-2">|</span>
              <Video className="h-4 w-4 mr-2 animate-pulse" />
              <span>STREAMING VIDEO</span>
            </>
          )}
        </div>
      )}

      {/* Toast Notification */}
      {showToast && (
        <div className={`fixed top-4 right-4 p-3 rounded-lg shadow-lg z-50 ${
          toastType === 'success' ? 'bg-green-500 text-white' :
          toastType === 'error' ? 'bg-red-500 text-white' :
          'bg-blue-500 text-white'
        }`}>
          <p className="text-sm font-medium">{toastMessage}</p>
        </div>
      )}
    </div>
  );
}
