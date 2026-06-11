import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ride } from '../types';
import { supabase, isSupabaseConfigured } from './supabaseClient';

const STORAGE_KEY = '@tripa_rides';

export interface DatabaseService {
  publishRide(rideData: Omit<Ride, 'id' | 'createdAt'>): Promise<Ride>;
  getRides(): Promise<Ride[]>;
  findRides(fromLocation: string, toLocation: string): Promise<Ride[]>;
  clearAllRides(): Promise<void>;
  getLocations(): Promise<string[]>;
}

// Helper to map PostgreSQL columns to TypeScript camelCase structure
const mapPostgresToRide = (r: any): Ride => ({
  id: r.id,
  driverName: r.driver_name,
  phoneNumber: r.phone_number,
  vehicleNumber: r.vehicle_number,
  fromLocation: r.from_location,
  toLocation: r.to_location,
  travelDate: r.travel_date,
  bookingNeed: r.booking_need,
  price: r.price || undefined,
  priceType: r.price_type || 'fixed',
  maxLuggage: Number(r.max_luggage) || 0,
  createdAt: r.created_at,
});

export const dbService: DatabaseService = {
  /**
   * Publishes a new ride or updates an existing one if the phone number is already listed.
   * Connects to PostgreSQL (Supabase) if credentials are set, else falls back to AsyncStorage.
   */
  async publishRide(rideData: Omit<Ride, 'id' | 'createdAt'>): Promise<Ride> {
    if (isSupabaseConfigured) {
      try {
        // Check if driver already has an active listing in PostgreSQL (phone number is unique key)
        const { data: existing, error: fetchError } = await supabase
          .from('rides')
          .select('id')
          .eq('phone_number', rideData.phoneNumber.trim())
          .maybeSingle();

        if (fetchError) throw fetchError;

        const payload = {
          driver_name: rideData.driverName.trim(),
          phone_number: rideData.phoneNumber.trim(),
          vehicle_number: rideData.vehicleNumber.trim().toUpperCase(),
          from_location: rideData.fromLocation.trim(),
          to_location: rideData.toLocation.trim(),
          travel_date: rideData.travelDate.trim(),
          booking_need: rideData.bookingNeed,
          price: rideData.price?.trim() || null,
          price_type: rideData.priceType,
          max_luggage: rideData.maxLuggage,
        };

        let result;
        if (existing) {
          // Update the existing PostgreSQL row
          const { data, error } = await supabase
            .from('rides')
            .update(payload)
            .eq('id', existing.id)
            .select()
            .single();

          if (error) throw error;
          result = data;
        } else {
          // Insert a new PostgreSQL row
          const { data, error } = await supabase
            .from('rides')
            .insert(payload)
            .select()
            .single();

          if (error) throw error;
          result = data;
        }

        return mapPostgresToRide(result);
      } catch (error) {
        console.error('Error publishing ride in PostgreSQL:', error);
        throw new Error('Failed to publish ride in database.');
      }
    }

    // Fallback: local AsyncStorage implementation
    try {
      const existingRidesJson = await AsyncStorage.getItem(STORAGE_KEY);
      let rides: Ride[] = existingRidesJson ? JSON.parse(existingRidesJson) : [];

      const existingIndex = rides.findIndex(
        (r) => r.phoneNumber.trim() === rideData.phoneNumber.trim()
      );

      const newRide: Ride = {
        ...rideData,
        id: existingIndex >= 0 ? rides[existingIndex].id : Math.random().toString(36).substring(2, 9),
        createdAt: new Date().toISOString(),
      };

      if (existingIndex >= 0) {
        rides[existingIndex] = newRide;
      } else {
        rides.push(newRide);
      }

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(rides));
      return newRide;
    } catch (error) {
      console.error('Error publishing ride in local storage:', error);
      throw new Error('Failed to publish ride.');
    }
  },

  /**
   * Retrieves all published rides.
   * Connects to PostgreSQL (Supabase) if credentials are set, else falls back to AsyncStorage.
   */
  async getRides(): Promise<Ride[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('rides')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        if (!data || data.length === 0) {
          return [];
        }

        return data.map(mapPostgresToRide);
      } catch (error) {
        console.error('Error loading rides from PostgreSQL:', error);
        return [];
      }
    }

    // Fallback: local AsyncStorage implementation (starts empty, no more rides.json seeding)
    try {
      const ridesJson = await AsyncStorage.getItem(STORAGE_KEY);
      return ridesJson ? JSON.parse(ridesJson) : [];
    } catch (error) {
      console.error('Error getting rides from local storage:', error);
      return [];
    }
  },

  /**
   * Filters rides by match in 'From' and 'To' locations.
   * Connects to PostgreSQL (Supabase) if credentials are set, else falls back to AsyncStorage.
   */
  async findRides(fromLocation: string, toLocation: string): Promise<Ride[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('rides')
          .select('*')
          .ilike('from_location', `%${fromLocation.trim()}%`)
          .ilike('to_location', `%${toLocation.trim()}%`)
          .order('created_at', { ascending: false });

        if (error) throw error;
        return data ? data.map(mapPostgresToRide) : [];
      } catch (error) {
        console.error('Error querying rides in PostgreSQL:', error);
        return [];
      }
    }

    // Fallback: local AsyncStorage implementation
    try {
      const rides = await this.getRides();
      const cleanFrom = fromLocation.trim().toLowerCase();
      const cleanTo = toLocation.trim().toLowerCase();

      return rides.filter((ride) => {
        const matchesFrom = ride.fromLocation.toLowerCase().includes(cleanFrom);
        const matchesTo = ride.toLocation.toLowerCase().includes(cleanTo);
        return matchesFrom && matchesTo;
      });
    } catch (error) {
      console.error('Error filtering rides:', error);
      return [];
    }
  },

  /**
   * Clears all rides for testing/admin purposes.
   */
  async clearAllRides(): Promise<void> {
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('rides').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (error) throw error;
      } catch (error) {
        console.error('Error clearing rides in PostgreSQL:', error);
      }
      return;
    }

    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing rides:', error);
    }
  },

  /**
   * Fetches allowed fixed locations from the database, or returns a fallback set of locations.
   */
  async getLocations(): Promise<string[]> {
    const DEFAULT_LOCATIONS = [
      'Airport T3',
      'New Delhi Station',
      'Connaught Place',
      'Noida Sector 62',
      'Gurgaon Cyber City',
      'Dwarka Sector 21',
      'Ghaziabad'
    ];

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('locations')
          .select('name')
          .order('name', { ascending: true });

        if (error) throw error;
        if (data && data.length > 0) {
          return data.map((l: any) => l.name);
        }
      } catch (error) {
        console.error('Error loading locations from PostgreSQL:', error);
      }
    }
    
    return DEFAULT_LOCATIONS;
  }
};
