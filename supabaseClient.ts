import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xfmlyphdpeulitdotmrn.supabase.co';
const supabaseAnonKey = 'sb_publishable_AUrulib_3TyTazSeOvfaOw_qrE87lSP';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
