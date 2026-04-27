
import { Checkpoint, RouteSegment, ShipStatus, WeatherStatus, LoadStatus, TripPhase, AppState } from './types';

export const CHECKPOINTS: Checkpoint[] = [
  { id: 'v1', name: 'Wandaeha', order: 0 },
  { id: 'v2', name: 'Woru-Woru', order: 1 },
  { id: 'v3', name: 'Tambeanga', order: 2 },
  { id: 'v4', name: 'Labotaone', order: 3 },
  { id: 'v5', name: 'Kendari', order: 4 },
];

export const ROUTE_SEGMENTS: RouteSegment[] = [
  { fromId: 'v1', toId: 'v2', distanceKm: 8, standardTimeMinutes: 30 },
  { fromId: 'v2', toId: 'v3', distanceKm: 12, standardTimeMinutes: 45 },
  { fromId: 'v3', toId: 'v4', distanceKm: 10, standardTimeMinutes: 35 },
  { fromId: 'v4', toId: 'v5', distanceKm: 15, standardTimeMinutes: 60 },
];

export const CANCELLATION_REASONS = [
  "Cuaca buruk",
  "Kerusakan kapal",
  "Masalah teknis mesin",
  "Faktor keselamatan",
  "Alasan operasional lainnya"
];

export const INITIAL_APP_STATE: AppState = {
  currentStatus: ShipStatus.OPERATING,
  tripPhase: TripPhase.NOT_STARTED,
  currentCheckpointId: null,
  nextCheckpointId: null,
  currentWeather: WeatherStatus.SUNNY,
  currentLoad: LoadStatus.AVAILABLE,
  delayReason: '',
  delayMinutes: 0,
  announcement: 'Info: Kapal hari ini berangkat tepat waktu. Harap penumpang datang 30 menit sebelum keberangkatan.',
  shipName: 'KMP Bahtera Pesisir',
  departureTime: '08:00 WITA',
  cancellationReason: '',
  cancellationDetails: '',
  weatherWarning: {
    isDangerous: false,
    message: '',
    windSpeed: 0,
    description: 'Sedang mengambil data cuaca...',
    temperature: 0
  },
  maxPassengers: 50,
  registeredPassengers: [],
};

export const WEATHER_CONFIG = {
  KENDARI_COORDS: { lat: -3.9723, lon: 122.5121 },
  LAONTI_COORDS: { lat: -4.18, lon: 122.75 },
  WIND_SPEED_THRESHOLD: 10, // m/s - speed where we start warning for small ships
  UPDATE_INTERVAL: 600000, // 10 minutes
};
