import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  try {
    const token = (req.headers.get("authorization") || "").replace("Bearer ", "");
    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    const { data: { user } } = await sb.auth.getUser(token);
    if (!user) return Response.json({ error: "Non connecté" }, { status: 401 });

    const site = process.env.NEXT_PUBLIC_SITE_URL;
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
      client_reference_id: user.id,
      customer_email: user.email,
      subscription_data: { trial_period_days: 7, metadata: { user_id: user.id } },
      success_url: `${site}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${site}/workouts`,
    });
    return Response.json({ url: session.url });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}