import test from "node:test";
import assert from "node:assert/strict";
import { bmr, targets, movingAverage, trend, classifyTrend, parseSets, nextTarget, sumEntries, scaleFood, isValidWeightKg, parseNum, toUnit, fromUnit, profileTargets } from "../lib/calc.js";
import { generateProgram } from "../lib/exercises.js";
import { best1rm, DEFAULT_CFG } from "../lib/calc.js";
import { analyze, weekOf } from "../lib/analytics.js";

test("BMR Mifflin-St Jeor", () => {
  assert.equal(bmr({ sex: "h", weightKg: 80, heightCm: 180, age: 30 }), 1780);
  assert.equal(bmr({ sex: "f", weightKg: 80, heightCm: 180, age: 30 }), 1614);
});
test("BMR : données manquantes ou invalides", () => {
  assert.equal(bmr({ sex: "h", weightKg: NaN, heightCm: 180, age: 30 }), null);
  assert.equal(bmr({ sex: "h", weightKg: -5, heightCm: 180, age: 30 }), null);
  assert.equal(targets({ sex: "h", weightKg: 80, heightCm: 180, age: 30, activity: "inconnu", objective: "perte" }), null);
});
test("Objectif perte : déficit modéré", () => {
  const t = targets({ sex: "h", weightKg: 100, heightCm: 180, age: 30, activity: "modere", objective: "perte" });
  assert.equal(t.tdee, 3069); assert.equal(t.kcal, 2610); assert.equal(t.deltaPct, -15); assert.equal(t.protein, 200); assert.equal(t.floorApplied, false);
});
test("Plancher calorique : jamais en dessous de 1200 (femme)", () => {
  const t = targets({ sex: "f", weightKg: 50, heightCm: 150, age: 60, activity: "sedentaire", objective: "perte" });
  assert.equal(t.kcal, 1200); assert.equal(t.floorApplied, true);
});
test("Macros cohérentes avec les calories", () => {
  const t = targets({ sex: "h", weightKg: 75, heightCm: 178, age: 28, activity: "leger", objective: "muscle" });
  assert.ok(Math.abs(t.protein * 4 + t.carbs * 4 + t.fat * 9 - t.kcal) <= 10);
});
test("Journal : totaux et valeurs manquantes", () => {
  assert.deepEqual(sumEntries([{ kcal: 100, protein: "5", carbs: null, fat: undefined }]), { kcal: 100, protein: 5, carbs: 0, fat: 0 });
  assert.deepEqual(sumEntries([]), { kcal: 0, protein: 0, carbs: 0, fat: 0 });
  assert.equal(scaleFood({ kcal100: 130, protein100: 2.7, carbs100: 28, fat100: 0.3 }, 150).kcal, 195);
});
test("Profil sans objectif calorique", () => { assert.equal(profileTargets({}), null); assert.equal(profileTargets({ kcal_target: 2000 }).kcal, 2000); });
test("Poids : validation et unités", () => {
  assert.equal(isValidWeightKg(80), true); assert.equal(isValidWeightKg(0), false); assert.equal(isValidWeightKg(NaN), false); assert.equal(isValidWeightKg(900), false);
  assert.equal(parseNum("82,5"), 82.5); assert.ok(Number.isNaN(parseNum("abc")));
  assert.ok(Math.abs(fromUnit(toUnit(80, "lb"), "lb") - 80) < 1e-9);
});
test("Moyenne mobile", () => {
  const r = movingAverage([{ date: "2025-01-01", weight: 80 }, { date: "2025-01-02", weight: 82 }], 7);
  assert.equal(r[1].avg, 81);
});
test("Tendance : insuffisante, en baisse, stagnation", () => {
  assert.equal(trend([{ date: "2025-01-01", weight: 80 }, { date: "2025-01-02", weight: 79 }]), null);
  assert.equal(classifyTrend(null).status, "insufficient");
  const down = ["01", "06", "11", "16", "21"].map((d, i) => ({ date: `2025-01-${d}`, weight: 90 - i * 0.5 }));
  const t = trend(down); assert.equal(t.kgPerWeek, -0.7); assert.equal(classifyTrend(t, "perte").status, "on_track");
  const flat = ["01", "06", "11", "16", "21", "28"].map((d) => ({ date: `2025-01-${d}`, weight: 80 }));
  assert.equal(classifyTrend(trend(flat), "perte").status, "stagnation");
});
test("Séries : saisie 70x8 9 9 puis changement de charge", () => {
  assert.deepEqual(parseSets("70x8 9 9 62,5x10"), [{ kg: 70, reps: 8 }, { kg: 70, reps: 9 }, { kg: 70, reps: 9 }, { kg: 62.5, reps: 10 }]);
  assert.deepEqual(parseSets("abc"), []); assert.deepEqual(parseSets(""), []); assert.deepEqual(parseSets("70x0"), []);
});
test("Double progression (règle de l'Excel)", () => {
  const up = nextTarget([{ kg: 70, reps: 10 }, { kg: 70, reps: 10 }, { kg: 70, reps: 10 }]);
  assert.equal(up.verdict, "up"); assert.equal(up.kg, 72.5); assert.equal(up.reps, 6);
  assert.equal(nextTarget([{ kg: 70, reps: 10 }, { kg: 70, reps: 10 }]).verdict, "keep");
  const keep = nextTarget([{ kg: 70, reps: 8 }, { kg: 70, reps: 9 }, { kg: 70, reps: 9 }]); assert.equal(keep.verdict, "keep"); assert.equal(keep.reps, 9);
  const down = nextTarget([{ kg: 70, reps: 8 }, { kg: 70, reps: 5 }], { rep_min: 6 }); assert.equal(down.verdict, "down"); assert.equal(down.kg, 67.5);
  assert.equal(nextTarget([]), null);
});
test("1RM Epley : 1 rep = la charge, poids de corps ignoré", () => {
  assert.equal(best1rm([{ kg: 100, reps: 1 }]), 100); assert.equal(best1rm([{ kg: 0, reps: 10 }]), 0);
  assert.ok(Math.abs(best1rm([{ kg: 60, reps: 10 }, { kg: 70, reps: 3 }]) - 80) < 1e-9);
});
test("Analyse : PR, semaine, stagnation, grille", () => {
  const S = "2026-10-05", mk = (id, date, reps) => ({ id, date, exercise: "Dév", sets: [{ kg: 70, reps }, { kg: 70, reps }, { kg: 70, reps }] });
  assert.equal(weekOf("2026-10-13", S), 2);
  const A = analyze([mk(1, "2026-10-06", 8), mk(2, "2026-10-13", 10), mk(3, "2026-10-20", 8), mk(4, "2026-10-27", 8), mk(5, "2026-11-03", 8)], () => ({ ...DEFAULT_CFG, muscle_group: "Pectoraux" }), S, "2026-11-03");
  assert.equal(A.items[0].pr, false); assert.equal(A.items[1].pr, true); assert.equal(A.curWeek, 5);
  assert.equal(A.exercises[0].status, "stagnation"); assert.equal(A.kpi.stagnating, 1); assert.equal(A.kpi.prs, 1); assert.equal(A.kpi.sessions, 5);
  assert.equal(A.exercises[0].grid.length, 5);
});
test("Programme généré", () => {
  for (let d = 2; d <= 6; d++) assert.equal(generateProgram({ days: d }).length, d);
  assert.equal(generateProgram({ days: 99 }).length, 6);
  assert.equal(generateProgram({ days: 3, experience: "debutant" })[0].exercises.length, 4);
});
