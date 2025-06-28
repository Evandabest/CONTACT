import { useState, useEffect } from 'react';
import * as Location from 'expo-location';

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

export const useWeatherData = (location: Location.LocationObject | null) => {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWeatherByCity = async (cityName: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `http://localhost:3001/api/weather?city=${encodeURIComponent(cityName)}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setWeatherData(data);
    } catch (err) {
      console.error('Error fetching weather data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch weather data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!location) return;

    const fetchWeather = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `http://localhost:3001/api/weather?lat=${location.coords.latitude}&lon=${location.coords.longitude}`
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setWeatherData(data);
      } catch (err) {
        console.error('Error fetching weather data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch weather data');
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();

    // Refresh weather data every 5 minutes
    const interval = setInterval(fetchWeather, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [location]);

  return { weatherData, loading, error, fetchWeatherByCity };
}; 