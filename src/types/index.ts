// ─── Navigation Param Lists ────────────────────────────────────────────────────
export type RootTabParamList = {
  SearchRide: undefined;
  PublishRide: undefined;
};

export type RootStackParamList = {
  Main: undefined;
  RideSuccess: { rideId: string; driverName: string; fromLocation: string; toLocation: string };
  MyRides: undefined;
  Login: undefined;
  Register: undefined;
};

// ─── Core Data Types ───────────────────────────────────────────────────────────
export interface Ride {
  id: string;
  driverName: string;
  phoneNumber: string;
  vehicleNumber?: string | null;
  vehicleName?: string | null;
  callCount?: number;
  allowReverse?: boolean;
  fromLocation: string;
  fromLat?: number | null;
  fromLng?: number | null;
  toLocation: string;
  toLat?: number | null;
  toLng?: number | null;
  travelDate: string;
  travelTime: string;
  bookingFrequency: 'today_only' | 'every_day' | 'week_days' | 'specific_date';
  weekdays?: string[] | null;
  specificDate?: string | null;
  price?: number | null;
  priceMode: 'fixed' | 'negotiable';
  maxLuggage: 'none' | 'small' | 'medium' | 'large';
  rideType?: 'sharing' | 'personal';
  status: 'active' | 'inactive' | 'completed' | 'cancelled';
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface User {
  id: string;
  name: string;
  mobile: string;
  role: 'driver' | 'rider';
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoggedIn: boolean;
}

export interface TravelerProfile {
  phoneNumber: string;
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  errors?: { field: string; message: string }[];
}

// ─── Form Types ────────────────────────────────────────────────────────────────
export interface PublishRidePayload {
  driverName: string;
  phoneNumber: string;
  vehicleNumber?: string;
  vehicleName?: string;
  fromLocation: string;
  fromLat?: number | null;
  fromLng?: number | null;
  toLocation: string;
  toLat?: number | null;
  toLng?: number | null;
  travelDate: string;
  travelTime: string;
  bookingFrequency: 'today_only' | 'every_day' | 'week_days' | 'specific_date';
  weekdays?: string[];
  specificDate?: string;
  price?: string;
  priceMode: 'fixed' | 'negotiable';
  maxLuggage: 'none' | 'small' | 'medium' | 'large';
  rideType?: 'sharing' | 'personal';
  allowReverse?: boolean;
}
