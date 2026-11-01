import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  try {
    const token = (req.headers.get("authorization") || "").replace("Bearer ", "");
    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    const { data: { user } } = await sb.auth.getUser(token);
    if (!user) return Response.json({ error: "Non connecté" }, { status: 401 });

    const { sessionId } = await req.json();
    const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ["subscription"] });
    if (session.client_reference_id !== user.id || !session.subscription)
      return Response.json({ error: "Session invalide" }, { status: 403 });

    const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    await admin.from("subscriptions").upsert({
      user_id: user.id,
      status: session.subscription.status,
      stripe_customer_id: session.customer,
      updated_at: new Date().toISOString(),
    });
    return Response.json({ status: session.subscription.status });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}