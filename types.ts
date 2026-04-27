
export enum ShipStatus {
  OPERATING = 'BEROPERASI',
  CANCELLED = 'TIDAK BEROPERASI',
  DELAYED = 'TERTUNDA'
}

export enum WeatherStatus {
  SUNNY = 'Cerah',
  RAIN = 'Hujan',
  ROUGH_WAVES = 'Berombak Besar'
}

export enum LoadStatus {
  AVAILABLE = 'Muatan Masih Tersedia',
  FULL = 'PENUH'
}

export enum TripPhase {
  NOT_STARTED = 'Belum Berangkat',
  IN_TRANSIT = 'Dalam Perjalanan',
  DOCKING = 'Sedang Bersandar',
  COMPLETED = 'Perjalanan Selesai'
}

export interface Checkpoint {
  id: string;
  name: string;
  order: number;
}

export interface RouteSegment {
  fromId: string;
  toId: string;
  distanceKm: number;
  standardTimeMinutes: number;
}

export interface PassengerRecord {
  id: string;
  name: string;
  villageId: string;
  timestamp: string;
}

export interface UserProfile {
  id: string;
  name: string;
  isLoggedIn: boolean;
}

export interface AppState {
  currentStatus: ShipStatus;
  tripPhase: TripPhase;
  currentCheckpointId: string | null;
  nextCheckpointId: string | null;
  currentWeather: WeatherStatus;
  currentLoad: LoadStatus;
  delayReason: string;
  delayMinutes: number;
  announcement: string;
  shipName: string;
  departureTime: string;
  cancellationReason: string;
  cancellationDetails: string;
  weatherWarning?: {
    isDangerous: boolean;
    message: string;
    windSpeed: number;
    description: string;
    temperature: number;
  };
  maxPassengers: number;
  registeredPassengers: PassengerRecord[];
}

export type UserRole = 'USER' | 'CAPTAIN' | 'ADMIN';

export interface ActivityLog {
  id: string;
  timestamp: string;
  action: string;
  user: string;
}
