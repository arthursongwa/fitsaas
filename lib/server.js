// SERVEUR uniquement (routes /api).
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
export const stripe = () => new Stripe(process.env.STRIPE_SECRET_KEY);
export const admin = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
export const siteUrl = (req) => process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin;
export async function userFrom(req) {
  const token = (req.headers.get("authorization") || "").replace("Bearer ", "");
  if (!token) return null;
  const { data } = await admin().auth.getUser(token);
  return data?.user || null;
}
const periodEnd = (s) => { const t = s.current_period_end ?? s.items?.data?.[0]?.current_period_end; return t ? new Date(t * 1000).toISOString() : null; };
export const subRow = (userId, s) => ({
  user_id: userId, status: s.status,
  stripe_customer_id: typeof s.customer === "string" ? s.customer : s.customer?.id,
  stripe_subscription_id: s.id, current_period_end: periodEnd(s),
  cancel_at_period_end: !!s.cancel_at_period_end, updated_at: new Date().toISOString(),
});
