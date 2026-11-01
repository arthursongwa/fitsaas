"use client";
import { useEffect, useState } from "react";
import { supabase } from "./supabase";
export function useProfile() {
  const [profile, setProfile] = useState({});
  const [loading, setLoading] = useState(true);
  async function reload() { const { data } = await supabase.from("profiles").select("*").maybeSingle(); setProfile(data || {}); setLoading(false); }
  useEffect(() => { reload(); }, []);
  async function save(patch) {
    const { data } = await supabase.auth.getSession();
    const { error } = await supabase.from("profiles").upsert({ ...patch, user_id: data.session.user.id }, { onConflict: "user_id" });
    if (!error) setProfile((p) => ({ ...p, ...patch }));
    return error;
  }
  return { profile, loading, save, reload };
}
