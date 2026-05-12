import { createClient } from '@supabase/supabase-js';

const env = (import.meta as any).env || {};
const supabaseUrl =
  env.VITE_SUPABASE_URL ||
  'https://xfmlyphdpeulitdotmrn.supabase.co';
const supabaseAnonKey =
  env.VITE_SUPABASE_ANON_KEY ||
  'sb_publishable_AUrulib_3TyTazSeOvfaOw_qrE87lSP';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
