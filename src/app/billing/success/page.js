"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "../../../../lib/api";
export default function Success() {
  const [msg, setMsg] = useState("Validation du paiement…");
  useEffect(() => { (async () => {
    const id = new URLSearchParams(window.location.search).get("session_id");
    const j = await api("/api/verify", "POST", { sessionId: id });
    if (j.status) window.location.href = "/workouts"; else setMsg(j.error || "Une erreur est survenue.");
  })(); }, []);
  return (<main className="mx-auto max-w-md p-8 text-center"><p>{msg}</p>{msg !== "Validation du paiement…" && <Link className="mt-4 inline-block underline" href="/settings/billing">Retour à l'abonnement</Link>}</main>);
}
