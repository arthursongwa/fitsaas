import { supabase } from "./supabase";
export async function api(path, method = "POST", body) {
  const { data } = await supabase.auth.getSession();
  const r = await fetch(path, { method, headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.session?.access_token}` }, body: body ? JSON.stringify(body) : undefined });
  return r.json().catch(() => ({ error: "Réponse invalide du serveur." }));
}
