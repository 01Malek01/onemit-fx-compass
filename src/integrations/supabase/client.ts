
import { createClient } from '@supabase/supabase-js';
import { Database } from './types';

// Get Supabase URL and key from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;

// Defined types for better type checking
type SupabaseConfig = {
  autoRefreshToken?: boolean;
  persistSession?: boolean;
  detectSessionInUrl?: boolean;
};

// Default configuration for Supabase client
const defaultSupabaseConfig: SupabaseConfig = {
  autoRefreshToken: true,
  persistSession: true,
  detectSessionInUrl: true,
};

/**
 * Check if required environment variables are set
 */
function validateEnvironmentVariables(): void {
  if (!supabaseUrl || !supabaseKey) {
    console.warn('⚠️ Supabase credentials missing. Authentication features will not work.');
  }
}

// Run validation on import
validateEnvironmentVariables();

/**
 * Create and initialize the Supabase client
 */
function initSupabaseClient() {
  try {
    // Create supabase client with proper typing
    const client = createClient<Database>(
      supabaseUrl || 'https://placeholder-url.supabase.co',
      supabaseKey || 'placeholder-key',
      defaultSupabaseConfig
    );
    
    return client;
  } catch (error) {
    console.error('Failed to initialize Supabase client:', error);
    
    // Create a minimal mock client for development fallback
    // This should be replaced with proper mocking in a production environment
    return createClient<Database>(
      'https://placeholder-url.supabase.co',
      'placeholder-public-key',
      defaultSupabaseConfig
    );
  }
}

// Export the initialized client
export const supabaseClient = initSupabaseClient();
