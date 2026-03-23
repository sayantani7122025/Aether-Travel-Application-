export interface Trip {
  id: string;
  destination: string;
  startDate: string;
  duration: number;
  vibe: 'Chill' | 'Adventure' | 'Social' | 'Food' | 'Culture' | 'Relaxation';
  budget: 'Economic' | 'Standard' | 'Luxury';
  currency: string;
  itinerary: DayPlan[];
  packingList: PackingItem[];
  weather: WeatherInfo;
  tips: string[];
  essentials: string[];
  transportation: TransportationInfo;
  hotels: HotelInfo[];
  createdAt: number;
  uid: string;
}

export interface TransportationInfo {
  airports: Airport[];
  trainStations: TrainStation[];
  howToReach: string;
  flights: FlightOption[];
  trains: TrainOption[];
}

export interface Airport {
  name: string;
  code: string;
  distance: string;
}

export interface TrainStation {
  name: string;
  distance: string;
}

export interface FlightOption {
  airline: string;
  estimatedPrice: number;
  googleSearchUrl: string;
}

export interface TrainOption {
  name: string;
  estimatedPrice: number;
  googleSearchUrl: string;
}

export interface HotelInfo {
  name: string;
  estimatedPricePerNight: number;
  rating: string;
  description: string;
  googleSearchUrl: string;
}

export interface DayPlan {
  day: number;
  date: string;
  activities: Activity[];
}

export interface Activity {
  id: string;
  time: string;
  title: string;
  description: string;
  location: string;
  type: 'Sightseeing' | 'Food' | 'Activity' | 'Relaxation';
  cost?: number;
}

export interface PackingItem {
  id: string;
  item: string;
  category: string;
  checked: boolean;
}

export interface WeatherInfo {
  temp: string;
  condition: string;
  icon: string;
}

export interface Blog {
  id: string;
  title: string;
  content: string;
  destination: string;
  imageUrl: string;
  createdAt: number;
  uid: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  location?: string;
  username?: string;
  password?: string;
  createdAt?: number;
}
