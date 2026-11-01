"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Play, History, Pencil, Zap } from "lucide-react";
import Shell from "../../../lib/Shell";
import { supabase } from "../../../lib/supabase";
import { btn, btn2 } from "../../../lib/ui";
export default function Page() { return <Shell title="Séances" subtitle="Ton programme" pro action={<Link href="/workouts/session?day=free" className={btn2}><Zap className="h-4 w-4" /> Séance libre</Link>}><Content /></Shell>; }
function Content() {
  const [prog, setProg] = useState(undefined);
  const [rows, setRows] = useState([]);
  useEffect(() => { (async () => {
    const a = await supabase.from("programs").select("*").eq("active", true).limit(1);
    const b = await supabase.from("workouts").select("date,day_name").order("date", { ascending: false }).order("id", { ascending: false }).limit(100);
    setProg(a.data?.[0] ?? null); setRows(b.data ?? []);
  })(); }, []);
  if (prog === undefined) return null;
  const days = prog?.days ?? [];
  const li = days.findIndex((x) => x.name === rows.find((r) => r.day_name)?.day_name);
  const next = days.length ? (li + 1) % days.length : -1;
  return (<>
    <div className="flex flex-wrap gap-3">
      <Link href="/workouts/history" className={btn2}><History className="h-4 w-4" /> Historique</Link>
      <Link href="/workouts/program" className={btn2}><Pencil className="h-4 w-4" /> Modifier le programme</Link>
      {rows[0] && <span className="self-center text-sm text-muted-foreground">Dernière séance : {rows[0].date}</span>}
    </div>
    {days.length === 0 ? (<div className="panel p-6 text-sm text-muted-foreground">Tu n'as pas encore de programme. <Link className="text-success underline" href="/workouts/program">Crée-le</Link> ou lance une séance libre.</div>) : (
      <div className="grid gap-4 sm:grid-cols-2">{days.map((d, i) => (
        <section key={i} className={`panel space-y-3 p-5 ${i === next ? "border-success/50 shadow-glow-success" : ""}`}>
          <div className="flex items-center justify-between gap-2"><h3 className="font-semibold">{d.name}</h3>{i === next && <span className="rounded-md bg-success/10 px-2 py-0.5 text-xs font-semibold text-success">Prochaine</span>}</div>
          <ul className="space-y-1 text-sm text-muted-foreground">{d.exercises.map((e) => <li key={e}>{e}</li>)}</ul>
          <Link href={`/workouts/session?day=${i}`} className={`${i === next ? btn : btn2} w-full`}><Play className="h-4 w-4" /> Démarrer</Link>
        </section>))}</div>)}
  </>);
}
