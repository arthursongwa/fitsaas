import { admin, userFrom } from "../../../../lib/server";
import Stripe from "stripe";

export async function POST(req) {
  try {
    // Initialisation ici pour éviter l'erreur au build
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    
    // ... le reste de ton code existant pour la route checkout
    const user = await userFrom(req);
    if (!user) return Response.json({ error: "Non connecté." }, { status: 401 });
    const db = admin();
    const { data } = await db.from("subscriptions").select("stripe_subscription_id,status").eq("user_id", user.id).maybeSingle();
    if (data?.stripe_subscription_id && ["active", "trialing", "past_due"].includes(data.status)) { try { await stripe().subscriptions.cancel(data.stripe_subscription_id); } catch {} }
    const { error } = await db.auth.admin.deleteUser(user.id);
    if (error) throw error;
    return Response.json({ ok: true });
  } catch (e) { return Response.json({ error: e.message }, { status: 500 }); }
}
