import AsyncStorage from '@react-native-async-storage/async-storage';
import { TravelerProfile } from '../types';
import registeredCustomers from '../database/customers.json';
import { supabase, isSupabaseConfigured } from './supabaseClient';

const PROFILE_KEY = '@tripa_traveler_profile';
const LOCAL_DB_KEY = '@tripa_local_registered_customers';

export const travelerService = {
  /**
   * Checks if a phone number is listed in the registered customers database.
   */
  async isRegistered(phoneNumber: string): Promise<boolean> {
    const cleanInput = phoneNumber.replace(/\D/g, '');
    if (!cleanInput) return false;
    
    // 1. Check PostgreSQL (Supabase) if configured
    if (isSupabaseConfigured) {
      try {
        // Look up by exact phone number
        const { data: exactMatch } = await supabase
          .from('customers')
          .select('phone_number')
          .eq('phone_number', phoneNumber.trim())
          .maybeSingle();

        if (exactMatch) return true;

        // Try suffix matching for formatting variations (e.g. +91 9999988888 vs 9999988888)
        if (cleanInput.length >= 8) {
          const suffix = cleanInput.slice(-8);
          const { data: partialMatches } = await supabase
            .from('customers')
            .select('phone_number')
            .like('phone_number', `%${suffix}%`);

          if (partialMatches && partialMatches.length > 0) {
            const matched = partialMatches.some((c) => {
              const cleanReg = (c.phone_number || '').replace(/\D/g, '');
              return cleanReg === cleanInput;
            });
            if (matched) return true;
          }
        }
      } catch (error) {
        console.error('Error checking traveler in PostgreSQL:', error);
      }
    }

    // 2. Check static customers.json seed registry
    const inStatic = registeredCustomers.some((c) => {
      const cleanReg = c.phoneNumber.replace(/\D/g, '');
      return cleanReg === cleanInput;
    });
    if (inStatic) return true;

    // 3. Check local database for dynamically registered travelers
    try {
      const localDbJson = await AsyncStorage.getItem(LOCAL_DB_KEY);
      if (localDbJson) {
        const localDb: any[] = JSON.parse(localDbJson);
        return localDb.some((c) => {
          const cleanReg = c.phoneNumber.replace(/\D/g, '');
          return cleanReg === cleanInput;
        });
      }
    } catch (error) {
      console.error('Error reading local customer db:', error);
    }

    return false;
  },

  /**
   * Registers a new customer into the local AsyncStorage registry.
   */
  async registerCustomer(phoneNumber: string, name: string): Promise<void> {
    // 1. Register in PostgreSQL (Supabase) if configured
    if (isSupabaseConfigured) {
      try {
        const payload = {
          phone_number: phoneNumber.trim(),
          name: name.trim() || 'New Customer',
        };
        const { error } = await supabase
          .from('customers')
          .insert(payload);

        if (error) {
          // PostgreSQL unique violation is code 23505. Ignore if already exists.
          if (error.code !== '23505') {
            throw error;
          }
        }
      } catch (error) {
        console.error('Error registering customer in PostgreSQL:', error);
        throw new Error('Failed to register customer in database.');
      }
    }

    // 2. Fallback/Local DB sync: Save to local AsyncStorage registry
    try {
      const localDbJson = await AsyncStorage.getItem(LOCAL_DB_KEY);
      let localDb: any[] = localDbJson ? JSON.parse(localDbJson) : [];
      
      // Prevent duplicates in local database
      const cleanInput = phoneNumber.replace(/\D/g, '');
      const exists = localDb.some((c) => c.phoneNumber.replace(/\D/g, '') === cleanInput);
      if (exists) return;

      const newCustomer = {
        phoneNumber: phoneNumber.trim(),
        name: name.trim() || 'New Customer',
        createdAt: new Date().toISOString(),
      };
      
      localDb.push(newCustomer);
      await AsyncStorage.setItem(LOCAL_DB_KEY, JSON.stringify(localDb));
    } catch (error) {
      console.error('Error saving new customer:', error);
      throw new Error('Failed to register customer.');
    }
  },

  /**
   * Saves traveler profile data as a JSON object.
   */
  async saveProfile(phoneNumber: string): Promise<TravelerProfile> {
    try {
      const profile: TravelerProfile = {
        phoneNumber: phoneNumber.trim(),
        createdAt: new Date().toISOString(),
      };
      await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
      return profile;
    } catch (error) {
      console.error('Error saving traveler profile:', error);
      throw new Error('Failed to save profile.');
    }
  },

  /**
   * Retrieves traveler profile from local storage.
   */
  async getProfile(): Promise<TravelerProfile | null> {
    try {
      const profileJson = await AsyncStorage.getItem(PROFILE_KEY);
      if (!profileJson) return null;
      return JSON.parse(profileJson);
    } catch (error) {
      console.error('Error loading traveler profile:', error);
      return null;
    }
  },

  /**
   * Clears the traveler profile.
   */
  async clearProfile(): Promise<void> {
    try {
      await AsyncStorage.removeItem(PROFILE_KEY);
    } catch (error) {
      console.error('Error clearing traveler profile:', error);
    }
  }
};
