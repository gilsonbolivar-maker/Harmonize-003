import { createClient } from '@supabase/supabase-js';
import { CLINICA } from './config';

export const supabase = createClient(CLINICA.supabaseUrl, CLINICA.supabaseChave, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
