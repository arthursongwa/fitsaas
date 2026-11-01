import { stripe, admin, userFrom } from "../../../../lib/server";

// Suppression du compte : abonnement résilié, puis utilisateur supprimé (les données associées sont supprimées en cascade).
export async function DELETE(req) {
  try {
    const user = await userFrom(req);
    if (!user) return Response.json({ error: "Non connecté." }, { status: 401 });
    const db = admin();
    const { data } = await db.from("subscriptions").select("stripe_subscription_id,status").eq("user_id", user.id).maybeSingle();
    if (data?.stripe_subscription_id && ["active", "trialing", "past_due"].includes(data.status)) {
      try { await stripe().subscriptions.cancel(data.stripe_subscription_id); } catch {}
    }
    const { error } = await db.auth.admin.deleteUser(user.id);
    if (error) throw error;
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
