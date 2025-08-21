import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Database types for better TypeScript support
export interface GameParticipant {
  id?: string;
  game_id: string;
  user_id: string;
  joined_at?: string;
  total_score?: number;
  total_time?: number;
}

export interface DatabaseError {
  message: string;
  details?: string;
} 