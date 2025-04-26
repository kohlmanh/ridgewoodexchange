import { createClient } from '@supabase/supabase-js';

// Replace these with your actual Supabase URL and anon key
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://pqtwndvhzzymgubvlmgr.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBxdHduZHZoenp5bWd1YnZsbWdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMyODU4NTMsImV4cCI6MjA1ODg2MTg1M30.phsEg4lPNTmK265PIXEz6ZWyMkjX3y-S-qLpkSmycuk';

// Create Supabase client with Realtime options enabled
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});