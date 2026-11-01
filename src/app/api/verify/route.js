import { stripe, admin, userFrom, subRow } from "../../../../lib/server";

// Appelée au retour de Stripe : le statut est lu chez Stripe (pas fourni par le navigateur).
export async function POST(req) {
  try {
    const user = await userFrom(req);
    if (!user) return Response.json({ error: "Non connecté." }, { status: 401 });
    const { sessionId } = await req.json();
    const session = await stripe().checkout.sessions.retrieve(sessionId, { expand: ["subscription"] });
    if (session.client_reference_id !== user.id || !session.subscription) return Response.json({ error: "Session invalide." }, { status: 403 });
    const { error } = await admin().from("subscriptions").upsert(subRow(user.id, session.subscription));
    if (error) throw error;
    return Response.json({ status: session.subscription.status });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
