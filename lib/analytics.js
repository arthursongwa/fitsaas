// Équivalent des onglets Progression / Suivi hebdo / Tableau de bord de ton Excel (fonctions pures)
import { dayNum, shiftIso, isoDay, best1rm, volume, nextTarget } from "./calc.js";

export const weekOf = (date, start) => Math.floor((dayNum(date) - dayNum(start)) / 7) + 1;
export const mondayIso = (iso) => shiftIso(iso, -((new Date(iso + "T12:00:00").getDay() + 6) % 7));

export function analyze(rows, cfgOf, start, today = isoDay()) {
  const sorted = [...rows].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.id - b.id));
  const byEx = new Map();
  const items = sorted.map((r) => {
    const k = r.exercise.toLowerCase();
    const g = byEx.get(k) || { rows: [], best: 0 };
    const rm = best1rm(r.sets);
    const it = { ...r, rm, week: weekOf(r.date, start), vol: volume(r.sets), reps: r.sets.reduce((a, s) => a + s.reps, 0), maxKg: Math.max(...r.sets.map((s) => s.kg)), pr: g.rows.length > 0 && rm > g.best };
    g.rows.push(it); g.best = Math.max(g.best, rm); byEx.set(k, g);
    return it;
  });
  const curWeek = items.length ? Math.max(...items.map((i) => i.week)) : 1;
  const first = Math.max(1, curWeek - 11);
  const weeks = Array.from({ length: curWeek - first + 1 }, (_, i) => first + i);

  const exercises = [...byEx.values()].map(({ rows: rs }) => {
    const name = rs[0].exercise, cfg = cfgOf(name), last = rs[rs.length - 1];
    const withRm = rs.filter((r) => r.rm > 0);
    const record = withRm.length ? Math.max(...withRm.map((r) => r.rm)) : 0;
    const recRow = withRm.find((r) => r.rm === record);
    const rmStart = withRm[0]?.rm ?? null, rmNow = withRm.length ? withRm[withRm.length - 1].rm : null;
    const q = recRow ? curWeek - recRow.week : null;
    return {
      name, group: cfg.muscle_group, cfg, sessions: rs.length, last, rows: rs, target: nextTarget(last.sets, cfg),
      maxLoad: Math.max(...rs.map((r) => r.maxKg)), rmStart, rmNow, record,
      evo: rmStart > 0 && rmNow > 0 ? rmNow / rmStart - 1 : null,
      status: rs.length >= 2 && q !== null ? (q === 0 ? "record" : q >= 3 ? "stagnation" : "ok") : "ok",
      grid: weeks.map((w) => {
        const inW = rs.filter((r) => r.week === w), prior = rs.filter((r) => r.week < w);
        const max = inW.length ? Math.max(...inW.map((r) => r.maxKg)) : null;
        return { w, max, rec: max != null && prior.length > 0 && max > Math.max(...prior.map((r) => r.maxKg)) };
      }),
    };
  }).sort((a, b) => (a.last.date < b.last.date ? 1 : -1));

  const wk = weeks.map((w) => { const r = items.filter((i) => i.week === w); return { w, vol: r.reduce((a, i) => a + i.vol, 0), sets: r.reduce((a, i) => a + i.sets.length, 0), sessions: new Set(r.map((i) => i.date)).size }; });
  const vol = (w) => items.filter((i) => i.week === w).reduce((a, i) => a + i.vol, 0);
  const kpi = {
    sessions: new Set(items.map((i) => i.date)).size, sets: items.reduce((a, i) => a + i.sets.length, 0), volume: items.reduce((a, i) => a + i.vol, 0), reps: items.reduce((a, i) => a + i.reps, 0),
    weeks: items.length ? curWeek : 0, prs: items.filter((i) => i.pr).length, stagnating: exercises.filter((e) => e.status === "stagnation").length,
    thisWeek: new Set(items.filter((i) => i.week === weekOf(today, start)).map((i) => i.date)).size,
    volWeek: vol(curWeek), volDelta: vol(curWeek - 1) ? Math.round((vol(curWeek) / vol(curWeek - 1) - 1) * 100) : null,
    best: exercises.filter((e) => e.evo != null).sort((a, b) => b.evo - a.evo)[0] || null,
  };
  return { items, exercises, weeks, wk, kpi, curWeek };
}
