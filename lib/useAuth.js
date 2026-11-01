"use client";
import { useEffect, useState } from "react";
import { supabase } from "./supabase";
// undefined = chargement, null = déconnecté
export function useAuth() {
  const [session, setSession] = useState(undefined);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);
  return session;
}
