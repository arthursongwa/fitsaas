import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

export async function POST(req) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  // Vérification d'idempotence
  const { data: existing } = await db
    .from("stripe_events")
    .select("id")
    .eq("id", event.id)
    .single();

  if (existing) {
    return new Response(JSON.stringify({ received: true }), { status: 200 });
  }

  await db.from("stripe_events").insert({ id: event.id });

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const userId = session.metadata?.user_id;
      if (userId) {
        await db
          .from("profiles")
          .update({ is_pro: true, stripe_customer_id: session.customer })
          .eq("id", userId);
      }
    } else if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object;
      await db
        .from("profiles")
        .update({ is_pro: false })
        .eq("stripe_customer_id", subscription.customer);
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (err) {
    await db.from("stripe_events").delete().eq("id", event.id);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}