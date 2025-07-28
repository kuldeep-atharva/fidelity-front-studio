// src/utils/supabaseClient.ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_API_BASE_URL!;
const supabaseAnonKey = import.meta.env.VITE_API_SUPABASE_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
