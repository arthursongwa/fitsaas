"use client";
import { useEffect, useState } from "react";
import { supabase } from "./supabase";

export function useProfile() {
  const [profile, setProfile] = useState({});
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    supabase.from("profiles").select("*").maybeSingle().then(({ data }) => {
      setProfile(data || {});
      setLoading(false);
    });
  }, []);
  async function save(p) {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("profiles").upsert({ ...p, user_id: user.id }, { onConflict: "user_id" });
    if (!error) setProfile(p);
    return error;
  }
  return { profile, loading, save };
}