'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Droplets, Thermometer, Wind, Eye, Sunrise, Sunset, MapPin, Wifi, Signal, Battery } from 'lucide-react';
import Link from 'next/link';

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

export default function HumidityPage() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

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

  const getHumidityLevel = (humidity: number) => {
    if (humidity < 30) return { level: 'Low', color: 'text-orange-400', bg: 'bg-orange-400/20' };
    if (humidity < 60) return { level: 'Moderate', color: 'text-blue-400', bg: 'bg-blue-400/20' };
    return { level: 'High', color: 'text-purple-400', bg: 'bg-purple-400/20' };
  };

  const getHumidityDescription = (humidity: number) => {
    if (humidity < 30) return 'Dry air - may cause skin irritation and static electricity';
    if (humidity < 60) return 'Comfortable humidity level - ideal for most activities';
    return 'High humidity - may feel muggy and uncomfortable';
  };

  useEffect(() => {
    // Simulate loading delay for mock data
    const timer = setTimeout(() => {
      // Mock weather data
      const mockWeatherData: WeatherData = {
        name: "New York",
        main: {
          temp: 78,
          feels_like: 82,
          humidity: 72,
          pressure: 1013
        },
        weather: [
          {
            main: "Clouds",
            description: "scattered clouds",
            icon: "03d"
          }
        ],
        wind: {
          speed: 12.5
        },
        visibility: 10000,
        sys: {
          sunrise: Math.floor(Date.now() / 1000) - 21600, // 6 hours ago
          sunset: Math.floor(Date.now() / 1000) + 21600   // 6 hours from now
        }
      };
      
      setWeather(mockWeatherData);
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading humidity data...</p>
        </div>
      </div>
    );
  }

  if (!weather) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
        <div className="text-white text-center">
          <p>Unable to load weather data</p>
          <Link href="/" className="text-blue-200 underline mt-2 block">
            Return to main page
          </Link>
        </div>
      </div>
    );
  }

  const humidityInfo = getHumidityLevel(weather.main.humidity);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 to-blue-600">
      {/* Header */}
      <div className="p-4">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between mb-6 pt-8">
            <Link 
              href="/"
              className="flex items-center text-white hover:text-blue-200 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Weather
            </Link>
            <h1 className="text-2xl font-bold text-white">Humidity Details</h1>
          </div>

          {/* Location */}
          <div className="flex items-center justify-center mb-6">
            <MapPin className="w-5 h-5 mr-2 text-white" />
            <h2 className="text-xl font-bold text-white">{weather.name}</h2>
          </div>

          {/* Main Humidity Display */}
          <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 mb-6 text-white">
            <div className="text-center mb-6">
              <div className="flex items-center justify-center mb-4">
                <Droplets className="w-16 h-16 text-blue-200" />
                <div className="text-5xl font-bold ml-4">
                  {weather.main.humidity}%
                </div>
              </div>
              <div className={`inline-block px-4 py-2 rounded-full ${humidityInfo.bg} ${humidityInfo.color} font-medium`}>
                {humidityInfo.level} Humidity
              </div>
            </div>

            <div className="bg-white/10 rounded-lg p-4 mb-4">
              <p className="text-center text-blue-100">
                {getHumidityDescription(weather.main.humidity)}
              </p>
            </div>

            {/* Humidity Bar */}
            <div className="mb-6">
              <div className="flex justify-between text-sm text-blue-200 mb-2">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-orange-400 via-blue-400 to-purple-400 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${weather.main.humidity}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Related Weather Info */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 text-white">
              <div className="flex items-center mb-2">
                <Thermometer className="w-4 h-4 mr-2" />
                <span className="text-sm font-medium">Temperature</span>
              </div>
              <p className="text-lg font-bold">{Math.round(weather.main.temp)}°F</p>
            </div>

            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 text-white">
              <div className="flex items-center mb-2">
                <Wind className="w-4 h-4 mr-2" />
                <span className="text-sm font-medium">Wind Speed</span>
              </div>
              <p className="text-lg font-bold">{weather.wind.speed} m/s</p>
            </div>
          </div>

          {/* Humidity Tips */}
          <div className="bg-white/20 backdrop-blur-sm mb-6 rounded-2xl p-6 text-white">
            <h3 className="text-lg font-bold mb-4 text-center">Humidity Tips</h3>
            <div className="space-y-3 text-sm">
              {weather.main.humidity < 30 && (
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-orange-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <p>Use a humidifier to add moisture to the air</p>
                </div>
              )}
              {weather.main.humidity < 30 && (
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-orange-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <p>Stay hydrated and moisturize your skin</p>
                </div>
              )}
              {weather.main.humidity >= 30 && weather.main.humidity < 60 && (
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <p>Perfect humidity level for comfort and health</p>
                </div>
              )}
              {weather.main.humidity >= 60 && (
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <p>Consider using a dehumidifier or air conditioning</p>
                </div>
              )}
              {weather.main.humidity >= 60 && (
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <p>High humidity can make it feel warmer than it actually is</p>
                </div>
              )}
            </div>
          </div>

            {/* Live Status Section */}
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 mb-6 text-white">
            <h3 className="text-lg font-bold mb-4 text-center">Live Status</h3>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="flex items-center justify-center">
                <Wifi className="w-6 h-6 text-green-400 mr-2" />
                <span className="text-sm font-medium">Connected</span>
              </div>
              <div className="flex items-center justify-center">
                <Signal className="w-6 h-6 text-green-400 mr-2" />
                <span className="text-sm font-medium">Online</span>
              </div>
              <div className="flex items-center justify-center">
                <Battery className="w-6 h-6 text-green-400 mr-2" />
                <span className="text-sm font-medium">Active</span>
              </div>
            </div>
            <div className="bg-white/10 rounded-lg p-4 min-h-[80px] flex items-center justify-center">
              <p className="text-blue-100 text-center">
                Real-time humidity monitoring system is active and collecting data
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 