"use client";
import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { supabase } from "../../lib/supabase";
import Link from "next/link";


const GOAL = 75; // objectif en kg (on le rendra modifiable ensuite)

export default function Home() {
  const [session, setSession] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!ready) return null;
  return session ? <Tracker userId={session.user.id} /> : <Login />;
}

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  async function go(signup) {
    const { error } = signup
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });
    setMsg(error ? error.message : "");
  }

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-xl shadow p-6 space-y-3">
        <h1 className="text-2xl font-bold">FitSaaS</h1>
        <input className="w-full border rounded p-2" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="w-full border rounded p-2" type="password" placeholder="Mot de passe (6+ caractères)" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button className="w-full bg-black text-white rounded p-2" onClick={() => go(false)}>Se connecter</button>
        <button className="w-full border rounded p-2" onClick={() => go(true)}>Créer un compte</button>
        {msg && <p className="text-red-600 text-sm">{msg}</p>}
      </div>
    </main>
  );
}

function Tracker({ userId }) {
  const [rows, setRows] = useState([]);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [weight, setWeight] = useState("");

  async function load() {
    const { data } = await supabase.from("weights").select("*").order("date");
    setRows(data ?? []);
  }
  useEffect(() => { load(); }, []);

  async function add() {
    const w = parseFloat(weight.replace(",", "."));
    if (!w) return;
    await supabase.from("weights").upsert({ user_id: userId, date, weight: w }, { onConflict: "user_id,date" });
    setWeight("");
    load();
  }

  const start = rows[0]?.weight;
  const current = rows[rows.length - 1]?.weight;
  const stat = (label, v) => (
    <div className="bg-white rounded-xl shadow p-4 text-center">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-2xl font-bold">{v !== undefined ? v.toFixed(1) : "–"}</div>
    </div>
  );

  
  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 p-4 max-w-2xl mx-auto space-y-4">
      <div className="flex gap-4 text-sm">
        <Link className="underline" href="/workouts">Séances →</Link>
        <Link className="underline" href="/dashboard">Bilan →</Link>
        <button className="underline" onClick={() => supabase.auth.signOut()}>Déconnexion</button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {stat("Actuel (kg)", current)}
        {stat("Perdu (kg)", start !== undefined && current !== undefined ? start - current : undefined)}
        {stat("Reste (kg)", current !== undefined ? current - GOAL : undefined)}
      </div>

      <div className="bg-white rounded-xl shadow p-4 flex gap-2">
        <input type="date" className="border rounded p-2" value={date} onChange={(e) => setDate(e.target.value)} />
        <input className="border rounded p-2 flex-1" placeholder="Poids (kg)" value={weight} onChange={(e) => setWeight(e.target.value)} />
        <button className="bg-black text-white rounded px-4" onClick={add}>Ajouter</button>
      </div>

      <div className="bg-white rounded-xl shadow p-4 h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={rows}>
            <XAxis dataKey="date" fontSize={11} />
            <YAxis domain={["dataMin - 2", "dataMax + 2"]} fontSize={11} />
            <Tooltip />
            <ReferenceLine y={GOAL} stroke="green" strokeDasharray="4 4" label="Objectif" />
            <Line type="monotone" dataKey="weight" stroke="#111" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </main>
  );
}