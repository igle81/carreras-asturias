import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const FALLBACK_URL = "https://fdpzepqhkdyfnorremce.supabase.co";
const FALLBACK_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZkcHplcHFoa2R5Zm5vcnJlbWNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc5NDgwNDMsImV4cCI6MjEwMzUyNDA0M30.lQSPP9hx0341BjkRPg2ag06FCJYAPqU7uJVHKOHYkwY";

export function getSupabaseUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_URL;
}

export function getSupabaseAnonKey() {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || FALLBACK_ANON_KEY;
}

let browserClient: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();

  if (typeof window === "undefined") {
    return createClient(url, key);
  }

  if (!browserClient) {
    browserClient = createClient(url, key);
  }

  return browserClient;
}
