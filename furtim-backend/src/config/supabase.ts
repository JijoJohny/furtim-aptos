import { createClient } from '@supabase/supabase-js';

// Debug: Log environment variables (remove in production)
console.log('Environment check:', {
  SUPABASE_URL: process.env.SUPABASE_URL ? 'SET' : 'MISSING',
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ? 'SET' : 'MISSING',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'MISSING',
  NODE_ENV: process.env.NODE_ENV
});

const supabaseUrl = process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'placeholder-anon-key';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-key';

// In production mode, require real values
if (process.env.NODE_ENV === 'production' && 
    (supabaseUrl === 'https://placeholder.supabase.co' || 
     supabaseAnonKey === 'placeholder-anon-key' || 
     supabaseServiceKey === 'placeholder-service-key')) {
  throw new Error('Missing Supabase environment variables for production');
}

// Client for user operations (uses anon key)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client for server-side operations (uses service role key)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export default supabase;
