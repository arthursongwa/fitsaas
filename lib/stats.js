import { isoDay, addDays, xpOf } from "./calc";
const TITLES = ["Rookie", "Starter", "Regular", "Athlete", "Iron Lifter", "Beast", "Machine", "Legend"];
export function compute(workouts, weights, profile) {
  const weekGoal = profile.training_days || profile.weekly_goal || 3;
  const now = new Date();
  const sessions = [...new Set(workouts.map((r) => r.date))];
  const vol = (rows) => rows.flatMap((r) => r.sets).reduce((a, s) => a + s.kg * s.reps, 0);
  const xp = workouts.reduce((a, r) => a + xpOf(r), 0) + weights.length * 10;
  let level = 1, rem = xp;
  while (rem >= 250 * level) { rem -= 250 * level; level++; }
  const active = new Set([...sessions, ...weights.map((w) => w.date)]);
  let streak = 0, c = new Date(now);
  if (!active.has(isoDay(c))) c = addDays(c, -1);
  while (active.has(isoDay(c))) { streak++; c = addDays(c, -1); }
  const m0 = addDays(now, -((now.getDay() + 6) % 7)), m1 = addDays(m0, -7), m2 = addDays(m0, 7);
  const between = (rows, a, b) => rows.filter((r) => r.date >= isoDay(a) && r.date < isoDay(b));
  const thisW = between(workouts, m0, m2), lastW = between(workouts, m1, m0);
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(now, i - 6), k = isoDay(d);
    return { d: ["D", "L", "M", "M", "J", "V", "S"][d.getDay()], xp: workouts.filter((r) => r.date === k).reduce((a, r) => a + xpOf(r), 0) + weights.filter((w) => w.date === k).length * 10 };
  });
  const first = weights[0]?.weight, last = weights[weights.length - 1]?.weight;
  const goal = Number(profile.goal_weight) || 75;
  const lost = first != null ? first - last : 0;
  const reached = last != null && (profile.objective === "muscle" ? last >= goal : last <= goal);
  const vw = vol(thisW), vl = vol(lastW);
  return {
    xp, level, xpInto: rem, xpNext: 250 * level, title: TITLES[Math.min(Math.floor(level / 3), TITLES.length - 1)], streak,
    weekDone: new Set(thisW.map((r) => r.date)).size, weekGoal, lastDone: new Set(lastW.map((r) => r.date)).size,
    volWeek: vw, volDelta: vl ? Math.round(((vw - vl) / vl) * 100) : null, days, week7: days.reduce((a, x) => a + x.xp, 0), first, last, sessions: sessions.length,
    badges: [
      { name: "First Step", desc: "Première séance", icon: "Footprints", unlocked: sessions.length >= 1, tone: "success" },
      { name: "Consistency King", desc: "7 jours d'affilée", icon: "Crown", unlocked: streak >= 7, tone: "streak" },
      { name: "Heavy Duty", desc: "10 000 kg soulevés", icon: "Dumbbell", unlocked: vol(workouts) >= 10000, tone: "info" },
      { name: "Century Club", desc: "100 séances", icon: "Trophy", unlocked: sessions.length >= 100, tone: "success" },
      { name: "Down 5", desc: "5 kg perdus", icon: "TrendingDown", unlocked: lost >= 5, tone: "streak" },
      { name: "Goal Reached", desc: "Objectif de poids atteint", icon: "Target", unlocked: reached, tone: "info" },
    ],
    feed: [...workouts].reverse().slice(0, 6).map((r) => ({ id: r.id, name: r.exercise, meta: r.sets.map((s) => `${s.kg}×${s.reps}`).join(" · "), when: r.date, xp: xpOf(r) })),
  };
}
