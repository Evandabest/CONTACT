'use client';

import { useState, useEffect } from 'react';
import { Search, MapPin, Thermometer, Droplets, Wind, Eye, Sunrise, Sunset, Navigation, Mic, MicOff } from 'lucide-react';
import Link from 'next/link';
import { useWebSocket } from './hooks/useWebSocket';
import { useAudioRecorder } from './hooks/useAudioRecorder';

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

  // WebSocket and Audio Recording hooks
  const {
    isConnected,
    isRecording,
    transcription,
    error: wsError,
    sendAudioData,
    startRecording: wsStartRecording,
    stopRecording: wsStopRecording,
    clearTranscription,
  } = useWebSocket();

  const {
    isRecording: isAudioRecording,
    isSupported: isAudioSupported,
    hasPermission: hasAudioPermission,
    error: audioError,
    startRecording: audioStartRecording,
    stopRecording: audioStopRecording,
    requestPermission: requestAudioPermission,
  } = useAudioRecorder(sendAudioData);

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
      const response = await fetch(
        `/api/weather?lat=${lat}&lon=${lon}`
      );
      
      console.log('API Response status:', response.status);
      
      const data = await response.json();
      console.log('Weather data received:', data);
      setWeather(data);
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

  const handleSunriseTap = () => {
    const newTapCount = sunriseTapCount + 1;
    setSunriseTapCount(newTapCount);
    
    if (newTapCount === 3) {
      // Start recording
      if (!isRecording) {
        setShowToast(true);
        setSunriseTapCount(0); // Reset counter
        
        // Start recording automatically after a short delay
        setTimeout(async () => {
          if (!hasAudioPermission) {
            const granted = await requestAudioPermission();
            if (!granted) return;
          }
          
          wsStartRecording();
          audioStartRecording();
        }, 1000);
        
        // Hide toast after 3 seconds
        setTimeout(() => {
          setShowToast(false);
        }, 3000);
      } else {
        // Already recording, just reset counter
        setSunriseTapCount(0);
      }
    }
    
    // Reset counter if too much time passes between taps
    setTimeout(() => {
      setSunriseTapCount(0);
    }, 2000);
  };

  const handleSunsetTap = () => {
    const newTapCount = sunsetTapCount + 1;
    setSunsetTapCount(newTapCount);
    
    if (newTapCount === 3) {
      // Stop recording
      if (isRecording) {
        setShowToast(true);
        setSunsetTapCount(0); // Reset counter
        
        // Stop recording
        audioStopRecording();
        wsStopRecording();
        clearTranscription();
        
        // Hide toast after 3 seconds
        setTimeout(() => {
          setShowToast(false);
        }, 3000);
      } else {
        // Not recording, just reset counter
        setSunsetTapCount(0);
      }
    }
    
    // Reset counter if too much time passes between taps
    setTimeout(() => {
      setSunsetTapCount(0);
    }, 2000);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 to-blue-600 p-4">
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg animate-bounce">
          <div className="flex items-center">
            <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
            Emergency service triggered
          </div>
        </div>
      )}

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

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
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
            <div className="flex items-center justify-center mb-4">
              <MapPin className="w-5 h-5 mr-2" />
              <h2 className="text-2xl font-bold">{weather.name}</h2>
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

            {/* Sunrise/Sunset with Secret Trigger */}
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div 
                className="bg-white/20 rounded-lg p-4 backdrop-blur-sm cursor-pointer hover:bg-white/30 transition-colors"
                onClick={handleSunriseTap}
              >
                <div className="flex items-center mb-2">
                  <Sunrise className="w-4 h-4 mr-2" />
                  <span className="text-sm font-medium">Sunrise</span>
                </div>
                <p className="text-lg font-bold">{formatTime(weather.sys.sunrise)}</p>
              </div>

              <div 
                className="bg-white/20 rounded-lg p-4 backdrop-blur-sm cursor-pointer hover:bg-white/30 transition-colors"
                onClick={handleSunsetTap}
              >
                <div className="flex items-center mb-2">
                  <Sunset className="w-4 h-4 mr-2" />
                  <span className="text-sm font-medium">Sunset</span>
                </div>
                <p className="text-lg font-bold">{formatTime(weather.sys.sunset)}</p>
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
          </div>
        )}
      </div>
    </div>
  );
}
