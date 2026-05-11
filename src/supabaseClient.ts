import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  'https://xfmlyphdpeulitdotmrn.supabase.co';
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'sb_publishable_AUrulib_3TyTazSeOvfaOw_qrE87lSP';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
