"use client";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "./supabase";
import { DEFAULT_CFG } from "./calc";

// Réglages par exercice : groupe, séries cibles, fourchette de reps, incrément (onglet « Exercices » de ton Excel)
export function useExercises() {
  const [list, setList] = useState(null);
  const reload = useCallback(async () => {
    const { data } = await supabase.from("exercises").select("*").order("name");
    setList(data ?? []);
  }, []);
  useEffect(() => { reload(); }, [reload]);
  const map = new Map((list ?? []).map((e) => [e.name.toLowerCase(), e]));
  const cfgOf = (name) => {
    const e = map.get(String(name).toLowerCase());
    return e ? { ...e, increment: Number(e.increment) } : { ...DEFAULT_CFG, muscle_group: "Autre", name };
  };
  return { list, cfgOf, reload, loading: list === null };
}
