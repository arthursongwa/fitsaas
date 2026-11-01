"use client";
import { useEffect, useState } from "react";
import { supabase } from "./supabase";

export function useSub() {
  const [s, setS] = useState({ loading: true, active: false, status: null, periodEnd: null, cancel: false });
  useEffect(() => {
    supabase.from("subscriptions").select("status,current_period_end,cancel_at_period_end").maybeSingle().then(({ data }) => {
      setS({ loading: false, active: ["active", "trialing"].includes(data?.status), status: data?.status ?? null, periodEnd: data?.current_period_end ?? null, cancel: !!data?.cancel_at_period_end });
    });
  }, []);
  return s;
}
