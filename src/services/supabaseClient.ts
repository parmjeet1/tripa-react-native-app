import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// Checks if the user has replaced the placeholder values with actual keys
export const isSupabaseConfigured = 
  !!supabaseUrl && 
  supabaseUrl !== 'https://your-project-id.supabase.co' && 
  !!supabaseAnonKey && 
  supabaseAnonKey !== 'your-anon-key-goes-here';

export const supabase = createClient(
  isSupabaseConfigured ? supabaseUrl : 'https://placeholder.supabase.co',
  isSupabaseConfigured ? supabaseAnonKey : 'placeholder'
);
