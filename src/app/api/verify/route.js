import { admin, userFrom, subRow } from "../../../../lib/server";
import Stripe from "stripe";

export async function POST(req) {
  try {
    // Initialisation ici pour éviter l'erreur au build
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    
    // ... le reste de ton code existant pour la route checkout
    const user = await userFrom(req);
    if (!user) return Response.json({ error: "Non connecté." }, { status: 401 });
    const { sessionId } = await req.json();
    const session = await stripe().checkout.sessions.retrieve(sessionId, { expand: ["subscription"] });
    if (session.client_reference_id !== user.id || !session.subscription) return Response.json({ error: "Session invalide." }, { status: 403 });
    const { error } = await admin().from("subscriptions").upsert(subRow(user.id, session.subscription));
    if (error) throw error;
    return Response.json({ status: session.subscription.status });
  } catch (e) { return Response.json({ error: e.message }, { status: 500 }); }
}
