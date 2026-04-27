
import { WEATHER_CONFIG } from '../constants';

const API_KEY = import.meta.env.VITE_WEATHER_API_KEY;

export interface WeatherData {
  isDangerous: boolean;
  message: string;
  windSpeed: number;
  description: string;
  temperature: number;
}

export const fetchWeatherData = async (): Promise<WeatherData> => {
  if (!API_KEY) {
    console.warn('Weather API Key missing. Using demo weather data.');
    return mockWeatherData();
  }

  try {
    // We check Kendari as a proxy for the sea between Laonti and Kendari
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${WEATHER_CONFIG.KENDARI_COORDS.lat}&lon=${WEATHER_CONFIG.KENDARI_COORDS.lon}&appid=${API_KEY}&units=metric&lang=id`
    );

    if (!response.ok) throw new Error('Weather API Error');

    const data = await response.json();
    const windSpeed = data.wind.speed;
    const isDangerous = windSpeed > WEATHER_CONFIG.WIND_SPEED_THRESHOLD;
    
    let message = '';
    if (isDangerous) {
      message = `PERINGATAN: Angin kencang (${windSpeed.toFixed(1)} m/s). Waspada ombak tinggi di perairan Laonti-Kendari.`;
    } else if (windSpeed > 7) {
      message = `Info: Angin cukup kencang (${windSpeed.toFixed(1)} m/s). Kondisi laut mungkin sedikit bergelombang.`;
    }

    return {
      isDangerous,
      message,
      windSpeed,
      description: data.weather[0].description,
      temperature: data.main.temp,
    };
  } catch (error) {
    console.error('Failed to fetch weather:', error);
    return mockWeatherData(); // Fallback to mock if API fails
  }
};

const mockWeatherData = (): WeatherData => {
  // Rotate through some scenarios for demo purposes if no API key
  const hour = new Date().getHours();
  let windSpeed = 4.5;
  let isDangerous = false;
  let message = 'Kondisi cuaca terpantau normal dan aman untuk pelayaran.';
  let description = 'Cerah Berawan';

  if (hour >= 13 && hour <= 15) { // Simulate afternoon wind increase
    windSpeed = 12.4;
    isDangerous = true;
    message = 'PERINGATAN DINI: Angin kencang terpantau di perairan. Waspada gelombang tinggi!';
    description = 'Hujan Badai';
  }

  return {
    isDangerous,
    message,
    windSpeed,
    description,
    temperature: 29,
  };
};
