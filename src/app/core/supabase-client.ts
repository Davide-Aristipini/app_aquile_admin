import { createClient } from '@supabase/supabase-js';

import { environment } from '../../environments/environment';

const supabaseUrl = environment.supabaseUrl?.trim();
const supabaseAnonKey = environment.supabaseAnonKey?.trim();

function isValidHttpUrl(value: string | undefined): boolean {
  if (!value) return false;
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export const isSupabaseConfigured = Boolean(
  isValidHttpUrl(supabaseUrl) && supabaseAnonKey
);

if (!isSupabaseConfigured) {
  console.warn('Missing or invalid Supabase env variables.');
}

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl as string, supabaseAnonKey as string)
  : null;
