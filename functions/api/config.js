import { json } from "../_supabase.js";

// GET /api/config -> public settings for the page (Turnstile site key, if configured)
export function onRequestGet({ env }) {
  return json({ turnstileSiteKey: env.TURNSTILE_SITE_KEY || null });
}
