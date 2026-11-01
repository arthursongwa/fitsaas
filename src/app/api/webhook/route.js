import { stripe, admin, subRow } from "../../../../lib/server";

// Webhook Stripe : signature vérifiée, traitement idempotent (un même événement n'est jamais appliqué deux fois),
// état relu chez Stripe pour éviter les problèmes d'ordre d'arrivée des événements.
export async function POST(req) {
  const body = await req.text();
  let event;
  try {
    event = stripe().webhooks.constructEvent(body, req.headers.get("stripe-signature"), process.env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return new Response("Signature invalide", { status: 400 });
  }
  if (!event.type.startsWith("customer.subscription.")) return new Response("ignoré");

  const db = admin();
  const { error: dup } = await db.from("stripe_events").insert({ id: event.id });
  if (dup) return dup.code === "23505" ? new Response("déjà traité") : new Response("erreur", { status: 500 });

  try {
    const s = await stripe().subscriptions.retrieve(event.data.object.id);
    let userId = s.metadata?.user_id;
    if (!userId) {
      const { data } = await db.from("subscriptions").select("user_id").eq("stripe_customer_id", s.customer).maybeSingle();
      userId = data?.user_id;
    }
    if (userId) {
      const { error } = await db.from("subscriptions").upsert(subRow(userId, s));
      if (error && error.code !== "23503") throw error; // 23503 : compte déjà supprimé, rien à faire
    }
    return new Response("ok");
  } catch {
    await db.from("stripe_events").delete().eq("id", event.id); // permet à Stripe de réessayer
    return new Response("erreur", { status: 500 });
  }
}
