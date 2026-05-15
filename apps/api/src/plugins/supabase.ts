import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "../env.js";

let adminClient: SupabaseClient | null = null;

export function getSupabaseAdmin() {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  }

  if (!adminClient) {
    adminClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
  }

  return adminClient;
}

export function isSupabaseConfigured() {
  return Boolean(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY);
}
