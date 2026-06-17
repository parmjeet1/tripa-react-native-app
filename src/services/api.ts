import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../constants/theme';
import { ApiResponse, Ride, User, PublishRidePayload } from '../types';

const AUTH_TOKEN_KEY = '@tripa_auth_token';
const AUTH_USER_KEY = '@tripa_auth_user';

// ─── Token Helpers ─────────────────────────────────────────────────────────────
export const getStoredToken = async (): Promise<string | null> => {
  return AsyncStorage.getItem(AUTH_TOKEN_KEY);
};

export const storeAuthData = async (token: string, user: User) => {
  await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
  await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
};

export const clearAuthData = async () => {
  await AsyncStorage.multiRemove([AUTH_TOKEN_KEY, AUTH_USER_KEY]);
};

export const getStoredUser = async (): Promise<User | null> => {
  const json = await AsyncStorage.getItem(AUTH_USER_KEY);
  return json ? JSON.parse(json) : null;
};

// ─── Response Processor ────────────────────────────────────────────────────────
const processResponse = (data: any, statusCode: number) => {
  if (!data) return { success: false, message: 'Network error' };

  let rawMessage = data.message;

  // Extract specific validation error messages if they exist from express-validator
  if (data.errors && Array.isArray(data.errors) && data.errors.length > 0) {
    rawMessage = data.errors[0].message;
  } else if (Array.isArray(rawMessage)) {
    rawMessage = rawMessage[0];
  }

  const success = data.success !== undefined ? data.success : (statusCode >= 200 && statusCode < 300);

  return {
    success,
    message: String(rawMessage || (success ? 'Success' : 'Something went wrong')),
    data: data.data || data,
    pagination: data.pagination
  };
};

// ─── Base Fetch ────────────────────────────────────────────────────────────────
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = await getStoredToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  // Add timeout via AbortController (10s)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  const url = `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const rawJson = await response.json();
    const processedJson = processResponse(rawJson, response.status);

    if (!response.ok && response.status === 401) {
      // Token expired — clear stored auth
      await clearAuthData();
    }

    return processedJson as ApiResponse<T>;
  } catch (error: any) {
    clearTimeout(timeoutId);
    console.error(`[API Fetch] Error fetching ${url}:`, error);
    if (error.name === 'AbortError') {
      return { success: false, message: 'Request timed out. Check your connection.' } as ApiResponse<T>;
    }
    return { success: false, message: `Network error: unreachable (${error.message || error})` } as ApiResponse<T>;
  }
}

// ─── Auth API ─────────────────────────────────────────────────────────────────
export const authApi = {
  register: (name: string, mobile: string, password: string, role: 'driver' | 'rider' = 'driver') =>
    apiFetch<{ token: string; user: User }>('/api/trip-api/register', {
      method: 'POST',
      body: JSON.stringify({ name, mobile, password, role }),
    }),

  login: (mobile: string, password: string) =>
    apiFetch<{ token: string; user: User }>('/api/trip-api/login', {
      method: 'POST',
      body: JSON.stringify({ mobile, password }),
    }),

  me: () => apiFetch<{ user: User }>('/api/trip-api/me'),
};

// ─── Rides API ────────────────────────────────────────────────────────────────
export const ridesApi = {
  list: (params?: {
    fromLocation?: string;
    toLocation?: string;
    travelDate?: string;
    userLat?: number;
    userLng?: number;
    rideType?: 'sharing' | 'personal';
    page?: number;
    limit?: number;
  }) => {
    const qs = new URLSearchParams();
    if (params?.fromLocation) qs.set('fromLocation', params.fromLocation);
    if (params?.toLocation) qs.set('toLocation', params.toLocation);
    if (params?.travelDate) qs.set('travelDate', params.travelDate);
    if (params?.userLat !== undefined) qs.set('userLat', String(params.userLat));
    if (params?.userLng !== undefined) qs.set('userLng', String(params.userLng));
    if (params?.rideType) qs.set('rideType', params.rideType);
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    const query = qs.toString() ? `?${qs.toString()}` : '';
    return apiFetch<Ride[]>(`/api/trip-api/rides${query}`);
  },

  locations: (query?: string) => apiFetch<string[]>(`/api/trip-api/rides/locations${query ? `?q=${encodeURIComponent(query)}` : ''}`),

  getOne: (id: string) => apiFetch<Ride>(`/api/trip-api/rides/${id}`),

  create: (payload: PublishRidePayload) =>
    apiFetch<Ride>('/api/trip-api/rides', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  update: (id: string, data: Partial<PublishRidePayload & { status: string }>) =>
    apiFetch<Ride>(`/api/trip-api/rides/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  remove: (id: string) =>
    apiFetch<null>(`/api/trip-api/rides/${id}`, { method: 'DELETE' }),

  incrementCallCount: (id: string) =>
    apiFetch<{ success: boolean }>(`/api/trip-api/rides/${id}/call`, { method: 'POST' }),
};

// ─── Driver API ───────────────────────────────────────────────────────────────
export const driverApi = {
  myRides: (page = 1) => apiFetch<Ride[]>(`/api/trip-api/my-rides?page=${page}`),

  profile: () => apiFetch<{ user: User; stats: any }>('/api/trip-api/profile'),

  callMeta: (rideId: string) =>
    apiFetch<{
      rideId: string;
      driverName: string;
      phoneNumber: string;
      vehicleNumber: string;
      fromLocation: string;
      toLocation: string;
    }>(`/api/trip-api/call-meta/${rideId}`),
};
