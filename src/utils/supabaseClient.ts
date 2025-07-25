// src/utils/supabaseClient.js
import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  import.meta.env.VITE_API_BASE_URL,
  import.meta.env.VITE_API_SUPABASE_KEY
);
