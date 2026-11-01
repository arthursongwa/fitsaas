"use client";
import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, CartesianGrid } from "recharts";
import { Trash2 } from "lucide-react";
import Shell from "../../../lib/Shell";
import { supabase } from "../../../lib/supabase";
import { useAuth } from "../../../lib/useAuth";
import { useProfile } from "../../../lib/useProfile";

export default function Page() {
  return <Shell title="Mon poids" subtitle="Suivi et objectif"><Content /></Shell>;
}

function Content() {
  const session = useAuth();
  const userId = session?.user.id;
  const { profile } = useProfile();
  const goal = Number(profile.goal_weight) || 75;
  const muscle = profile.objective === "muscle";

  const [rows, setRows] = useState([]);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [weight, setWeight] = useState("");
  const [imp, setImp] = useState("");
  const [msg, setMsg] = useState("");

  async function load() {
    const { data } = await supabase.from("weights").select("*").order("date");
    setRows(data ?? []);
  }
  useEffect(() => { load(); }, []);

  async function add() {
    const w = parseFloat(weight.replace(",", "."));
    if (!w) return;
    await supabase.from("weights").upsert({ user_id: userId, date, weight: w }, { onConflict: "user_id,date" });
    setWeight(""); load();
  }
  async function remove(id) { await supabase.from("weights").delete().eq("id", id); load(); }

  async function importText() {
    const out = [];
    for (const line of imp.split(/\r?\n/)) {
      const [a, b] = line.split(/[\t;]/);
      if (!a || !b) continue;
      let d = a.trim().slice(0, 10);
      if (d.includes("/")) {
        const [j, m, y] = d.split("/");
        d = `${y.length === 2 ? "20" + y : y}-${m.padStart(2, "0")}-${j.padStart(2, "0")}`;
      }
      const w = parseFloat(b.replace(",", "."));
      if (/^\d{4}-\d{2}-\d{2}$/.test(d) && w) out.push({ user_id: userId, date: d, weight: w });
    }
    if (out.length) { await supabase.from("weights").upsert(out, { onConflict: "user_id,date" }); setImp(""); load(); }
    setMsg(`${out.length} pesée(s) importée(s)`);
  }

  const first = rows[0]?.weight, current = rows[rows.length - 1]?.weight;
  const delta = first !== undefined ? current - first : null;
  const stat = (label, v, unit = "kg") => (
    <div className="panel p-5">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight">{v ?? "–"} <span className="text-sm font-normal text-muted-foreground">{v != null ? unit : ""}</span></p>
    </div>
  );

  return (
    <>
      <div className="grid grid-cols-3 gap-4">
        {stat("Actuel", current?.toFixed(1))}
        {stat(muscle ? "Pris" : "Variation", delta !== null ? (muscle ? delta : delta).toFixed(1) : null)}
        {stat("Écart à l'objectif", current !== undefined ? Math.abs(current - goal).toFixed(1) : null)}
      </div>

      <div className="panel flex flex-wrap gap-2 p-4">
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <input className="flex-1" placeholder="Poids (kg)" value={weight} onChange={(e) => setWeight(e.target.value)} />
        <button className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-glow-success hover:brightness-110" onClick={add}>Ajouter</button>
      </div>

      <div className="panel h-80 p-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={rows}>
            <CartesianGrid stroke="#232b3d" vertical={false} />
            <XAxis dataKey="date" stroke="#8b95a9" fontSize={11} />
            <YAxis domain={["dataMin - 2", "dataMax + 2"]} stroke="#8b95a9" fontSize={11} />
            <Tooltip contentStyle={{ background: "#111622", border: "1px solid #232b3d", borderRadius: 8 }} />
            <ReferenceLine y={goal} stroke="#fb923c" strokeDasharray="4 4" label={{ value: "Objectif", fill: "#fb923c", fontSize: 11 }} />
            <Line type="monotone" dataKey="weight" stroke="#34d399" strokeWidth={2.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <details className="panel p-4">
        <summary className="cursor-pointer text-sm font-medium">Importer depuis Excel</summary>
        <p className="mt-3 text-xs text-muted-foreground">Copie deux colonnes (date, poids) dans Excel, puis colle ici. Une ligne par pesée.</p>
        <textarea className="mt-2 h-28 w-full rounded-lg border border-border bg-muted p-2 text-sm outline-none" value={imp} onChange={(e) => setImp(e.target.value)} placeholder={"10/03/2024\t82,1\n17/03/2024\t81,0"} />
        <div className="mt-2 flex items-center gap-3">
          <button className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-accent" onClick={importText}>Importer</button>
          {msg && <span className="text-xs text-muted-foreground">{msg}</span>}
        </div>
      </details>

      <div className="panel divide-y divide-border">
        {[...rows].reverse().slice(0, 20).map((r) => (
          <div key={r.id} className="flex items-center justify-between p-3 text-sm">
            <span className="text-muted-foreground">{r.date}</span>
            <span className="font-medium">{r.weight} kg</span>
            <button className="text-muted-foreground hover:text-streak" onClick={() => remove(r.id)} aria-label="Supprimer"><Trash2 className="h-4 w-4" /></button>
          </div>
        ))}
      </div>
    </>
  );
}