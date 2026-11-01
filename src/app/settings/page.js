"use client";
import { useState } from "react";
import Link from "next/link";
import Shell from "../../../lib/Shell";
import { supabase } from "../../../lib/supabase";
import { api } from "../../../lib/api";
import { useProfile } from "../../../lib/useProfile";
import { Field, Choice, Err, Ok, btn, btn2, btnWarn, download } from "../../../lib/ui";
export default function Page() { return <Shell title="Réglages" subtitle="Préférences, sécurité et données"><Content /></Shell>; }
function Content() {
  const { profile, loading, save } = useProfile();
  const [pw, setPw] = useState(""); const [confirmText, setConfirmText] = useState(""); const [msg, setMsg] = useState({ err: "", ok: "" });
  if (loading) return null;
  const note = (err, ok) => setMsg({ err: err || "", ok: ok || "" });
  async function setUnit(u) { const er = await save({ unit: u }); note(er?.message, er ? "" : "Unité enregistrée."); }
  async function changePw() { if (pw.length < 8) return note("Au moins 8 caractères."); const { error } = await supabase.auth.updateUser({ password: pw }); if (error) return note(error.message); setPw(""); note("", "Mot de passe modifié."); }
  async function exportAll() {
    const out = {};
    for (const t of ["profiles", "weights", "workouts", "food_entries", "programs"]) { const { data, error } = await supabase.from(t).select("*"); if (error) return note(`Export impossible (${t}) : ${error.message}`); out[t] = data; }
    download(JSON.stringify(out, null, 2), "fitsaas-export.json", "application/json"); note("", "Export téléchargé.");
  }
  async function del() {
    if (confirmText !== "SUPPRIMER") return note("Tape SUPPRIMER pour confirmer.");
    const j = await api("/api/account", "DELETE");
    if (j.error) return note(j.error);
    await supabase.auth.signOut(); window.location.href = "/login";
  }
  return (
    <div className="max-w-xl space-y-5">
      <Err>{msg.err}</Err><Ok>{msg.ok}</Ok>
      <section className="panel space-y-3 p-6"><h2 className="font-semibold">Préférences</h2><Field label="Unité de poids"><Choice cols={2} value={profile.unit || "kg"} onChange={setUnit} options={[["kg", "Kilogrammes"], ["lb", "Livres"]]} /></Field><p className="text-xs text-muted-foreground">Tes pesées sont toujours conservées en kg ; seul l'affichage change.</p></section>
      <section className="panel space-y-3 p-6"><h2 className="font-semibold">Abonnement</h2><Link href="/settings/billing" className={btn2}>Gérer mon abonnement</Link></section>
      <section className="panel space-y-3 p-6"><h2 className="font-semibold">Sécurité</h2><Field label="Nouveau mot de passe"><input className="w-full" type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} /></Field><div className="flex gap-3"><button className={btn} onClick={changePw}>Modifier</button><button className={btn2} onClick={() => supabase.auth.signOut()}>Se déconnecter</button></div></section>
      <section className="panel space-y-3 p-6"><h2 className="font-semibold">Mes données</h2><p className="text-sm text-muted-foreground">Télécharge toutes tes données (profil, pesées, séances, journal, programme) au format JSON.</p><button className={btn2} onClick={exportAll}>Exporter mes données</button><p className="text-xs text-muted-foreground">Voir aussi les <Link className="underline" href="/legal">informations légales</Link>.</p></section>
      <section className="panel space-y-3 border-streak/40 p-6"><h2 className="font-semibold text-streak">Supprimer mon compte</h2><p className="text-sm text-muted-foreground">Action définitive : ton abonnement est résilié et toutes tes données sont supprimées.</p><input className="w-full" placeholder="Tape SUPPRIMER" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} /><button className={btnWarn} onClick={del}>Supprimer définitivement mon compte</button></section>
    </div>);
}
