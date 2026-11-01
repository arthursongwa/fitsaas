const TITLES = ["Rookie", "Starter", "Regular", "Athlete", "Iron Lifter", "Beast", "Machine", "Legend"];
export const e1rm = (s) => s.kg * (1 + s.reps / 30);
export const fmtSets = (sets) => sets.map((s) => `${s.kg}×${s.reps}`).join(" · ");
export const xpOf = (r) => 20 + 10 * r.sets.length;

const iso = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const mondayOf = (d) => addDays(d, -((d.getDay() + 6) % 7));
const pct = (a, b) => (b ? Math.round(((a - b) / b) * 100) : null);

export function compute(workouts, weights, profile) {
  const goal = Number(profile.goal_weight) || 75;
  const weekGoal = profile.weekly_goal || 3;
  const now = new Date();
  const sessions = [...new Set(workouts.map((r) => r.date))];
  const vol = (rows) => rows.flatMap((r) => r.sets).reduce((a, s) => a + s.kg * s.reps, 0);

  // XP et niveau
  const xp = workouts.reduce((a, r) => a + xpOf(r), 0) + weights.length * 10;
  let level = 1, rem = xp;
  while (rem >= 250 * level) { rem -= 250 * level; level++; }

  // Série de jours (séance ou pesée)
  const active = new Set([...sessions, ...weights.map((w) => w.date)]);
  let streak = 0, c = new Date(now);
  if (!active.has(iso(c))) c = addDays(c, -1);
  while (active.has(iso(c))) { streak++; c = addDays(c, -1); }

  // Semaine en cours vs précédente
  const m0 = mondayOf(now), m1 = addDays(m0, -7), m2 = addDays(m0, 7);
  const between = (rows, a, b) => rows.filter((r) => r.date >= iso(a) && r.date < iso(b));
  const thisW = between(workouts, m0, m2), lastW = between(workouts, m1, m0);
  const weekDone = new Set(thisW.map((r) => r.date)).size;
  const lastDone = new Set(lastW.map((r) => r.date)).size;

  // XP des 7 derniers jours
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(now, i - 6), k = iso(d);
    const x = workouts.filter((r) => r.date === k).reduce((a, r) => a + xpOf(r), 0)
      + weights.filter((w) => w.date === k).length * 10;
    return { d: ["D", "L", "M", "M", "J", "V", "S"][d.getDay()], xp: x };
  });

  const first = weights[0]?.weight, last = weights[weights.length - 1]?.weight;
  const lost = first != null ? first - last : 0;
  const reached = last != null && (profile.objective === "muscle" ? last >= goal : last <= goal);

  return {
    xp, level, xpInto: rem, xpNext: 250 * level,
    title: TITLES[Math.min(Math.floor(level / 3), TITLES.length - 1)],
    streak, sessions: sessions.length, weekDone, weekGoal, lastDone,
    volWeek: vol(thisW), volDelta: pct(vol(thisW), vol(lastW)),
    days, week7: days.reduce((a, x) => a + x.xp, 0),
    first, last, goal,
    badges: [
      { name: "First Step", desc: "Première séance", icon: "Footprints", unlocked: sessions.length >= 1, tone: "success" },
      { name: "Consistency King", desc: "7 jours d'affilée", icon: "Crown", unlocked: streak >= 7, tone: "streak" },
      { name: "Heavy Duty", desc: "10 000 kg soulevés", icon: "Dumbbell", unlocked: vol(workouts) >= 10000, tone: "info" },
      { name: "Century Club", desc: "100 séances", icon: "Trophy", unlocked: sessions.length >= 100, tone: "success" },
      { name: "Down 5", desc: "5 kg perdus", icon: "TrendingDown", unlocked: lost >= 5, tone: "streak" },
      { name: "Goal Reached", desc: "Objectif de poids atteint", icon: "Target", unlocked: reached, tone: "info" },
    ],
    feed: [...workouts].reverse().slice(0, 6).map((r) => ({
      id: r.id, name: r.exercise, meta: fmtSets(r.sets), when: r.date, xp: xpOf(r),
    })),
  };
}