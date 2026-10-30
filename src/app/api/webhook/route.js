import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  const body = await req.text();
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      req.headers.get("stripe-signature"),
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (e) {
    return new Response("Signature invalide", { status: 400 });
  }

  if (["customer.subscription.updated", "customer.subscription.deleted"].includes(event.type)) {
    const sub = event.data.object;
    const userId = sub.metadata?.user_id;
    if (userId) {
      const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
      await admin.from("subscriptions").upsert({
        user_id: userId,
        status: sub.status,
        stripe_customer_id: sub.customer,
        updated_at: new Date().toISOString(),
      });
    }
  }
  return new Response("ok");
}