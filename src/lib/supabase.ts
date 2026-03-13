import { createClient } from '@supabase/supabase-js';

// Public credentials — safe to hardcode (Vite VITE_ vars are always client-side)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  || 'https://xwtnkxvvxozgjddwrvon.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
  || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3dG5reHZ2eG96Z2pkZHdydm9uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwMzk4NDgsImV4cCI6MjA4ODYxNTg0OH0.GvQxippdZsDAvK_sdxOucSDodrmDO5Op0DSAXxbLi-I';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
