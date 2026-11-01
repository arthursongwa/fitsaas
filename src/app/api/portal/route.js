import { stripe, admin, userFrom, siteUrl } from "../../../../lib/server";

export async function POST(req) {
  try {
    const user = await userFrom(req);
    if (!user) return Response.json({ error: "Non connecté." }, { status: 401 });
    const { data } = await admin().from("subscriptions").select("stripe_customer_id").eq("user_id", user.id).maybeSingle();
    if (!data?.stripe_customer_id) return Response.json({ error: "Aucun abonnement trouvé pour ce compte." }, { status: 404 });
    const s = await stripe().billingPortal.sessions.create({ customer: data.stripe_customer_id, return_url: `${siteUrl(req)}/settings/billing` });
    return Response.json({ url: s.url });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
