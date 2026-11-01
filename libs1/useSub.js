"use client";
import { useEffect, useState } from "react";
import { supabase } from "./supabase";

export function useSub() {
  const [state, setState] = useState({ loading: true, active: false });
  useEffect(() => {
    supabase.from("subscriptions").select("status").maybeSingle().then(({ data }) => {
      setState({ loading: false, active: ["active", "trialing"].includes(data?.status) });
    });
  }, []);
  return state;
}