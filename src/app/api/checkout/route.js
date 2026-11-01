import { userFrom, siteUrl } from "../../../../lib/server";
import Stripe from "stripe";

export async function POST(req) {
  try {
    // Initialisation ici pour éviter l'erreur au build
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    
    const user = await userFrom(req);
    
    if (!user) return Response.json({ error: "Non connecté." }, { status: 401 });
    
    const site = siteUrl(req);
    const session = await stripe().checkout.sessions.create({
      mode: "subscription", line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
      client_reference_id: user.id, customer_email: user.email,
      subscription_data: { trial_period_days: 7, metadata: { user_id: user.id } },
      success_url: `${site}/billing/success?session_id={CHECKOUT_SESSION_ID}`, cancel_url: `${site}/settings/billing`,
    });
    return Response.json({ url: session.url });
  } catch (e) { return Response.json({ error: e.message }, { status: 500 }); }
}
