import express from 'express';
import OpenAI from 'openai';

const router = express.Router();

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

// Mock weather data for development
const getMockWeatherData = (cityName: string): WeatherData => {
  const now = Math.floor(Date.now() / 1000);
  return {
    name: cityName,
    main: {
      temp: 72,
      feels_like: 74,
      humidity: 65,
      pressure: 1013,
    },
    weather: [
      {
        main: 'Clear',
        description: 'clear sky',
        icon: '01d',
      },
    ],
    wind: {
      speed: 5.2,
    },
    visibility: 10000,
    sys: {
      sunrise: now - 21600, // 6 hours ago
      sunset: now + 21600,  // 6 hours from now
    },
  };
};

// Get weather by city name
router.get('/', async (req, res) => {
  try {
    const { city, lat, lon } = req.query;

    if (!city && !lat && !lon) {
      return res.status(400).json({ error: 'City name or coordinates required' });
    }

    let weatherData: WeatherData;

    if (process.env.NODE_ENV === 'development') {
      // Use mock data in development
      weatherData = getMockWeatherData(city as string || 'New York');
    } else {
      // In production, you would call a real weather API
      // For now, using mock data
      weatherData = getMockWeatherData(city as string || 'New York');
    }

    console.log('🌤️ Weather data requested:', { city, lat, lon });
    console.log('🌤️ Returning weather data for:', weatherData.name);

    res.json(weatherData);
  } catch (error) {
    console.error('❌ Weather API error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch weather data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export { router as weatherRouter }; 