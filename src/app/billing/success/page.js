"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../../../lib/supabase";

export default function Success() {
  const [msg, setMsg] = useState("Validation du paiement…");
  useEffect(() => {
    (async () => {
      const id = new URLSearchParams(window.location.search).get("session_id");
      const { data } = await supabase.auth.getSession();
      const r = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.session?.access_token}` },
        body: JSON.stringify({ sessionId: id }),
      });
      const j = await r.json();
      if (j.status) window.location = "/workouts";
      else setMsg(j.error || "Une erreur est survenue.");
    })();
  }, []);
  return <main className="p-6">{msg}</main>;
}