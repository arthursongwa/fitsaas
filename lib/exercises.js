const GYM = {
  push: ["Développé couché (barre)", "Développé incliné (haltères)", "Développé militaire (haltères)", "Élévations latérales", "Extensions triceps poulie"],
  pull: ["Tractions", "Rowing barre", "Tirage horizontal", "Curl biceps (haltères)", "Face pull"],
  legs: ["Squat (barre)", "Presse à cuisses", "Soulevé de terre roumain", "Leg curl", "Mollets debout"],
  upper: ["Développé couché (haltères)", "Tirage vertical", "Développé militaire (haltères)", "Rowing haltère", "Curl biceps (haltères)"],
  lower: ["Squat (barre)", "Fentes marchées", "Leg curl", "Hip thrust", "Mollets debout"],
  fullA: ["Squat (barre)", "Développé couché (barre)", "Tirage vertical", "Élévations latérales", "Curl biceps (haltères)"],
  fullB: ["Presse à cuisses", "Développé militaire (haltères)", "Rowing barre", "Soulevé de terre roumain", "Extensions triceps poulie"],
  fullC: ["Fentes marchées", "Développé incliné (haltères)", "Tractions", "Hip thrust", "Face pull"],
};
const HOME = {
  push: ["Pompes", "Pompes déclinées", "Développé épaules (haltères)", "Élévations latérales (haltères)", "Dips sur chaise"],
  pull: ["Rowing haltère", "Rowing inversé (table)", "Curl biceps (haltères)", "Shrugs (haltères)", "Oiseau (haltères)"],
  legs: ["Squat goblet (haltère)", "Fentes bulgares", "Soulevé de terre roumain (haltères)", "Pont fessier", "Mollets debout (haltères)"],
  upper: ["Pompes", "Rowing haltère", "Développé épaules (haltères)", "Rowing inversé (table)", "Curl biceps (haltères)"],
  lower: ["Squat goblet (haltère)", "Fentes bulgares", "Pont fessier", "Soulevé de terre roumain (haltères)", "Mollets debout (haltères)"],
  fullA: ["Squat goblet (haltère)", "Pompes", "Rowing haltère", "Élévations latérales (haltères)", "Curl biceps (haltères)"],
  fullB: ["Fentes bulgares", "Développé épaules (haltères)", "Rowing inversé (table)", "Pont fessier", "Dips sur chaise"],
  fullC: ["Soulevé de terre roumain (haltères)", "Pompes déclinées", "Rowing haltère", "Mollets debout (haltères)", "Oiseau (haltères)"],
};
const LABEL = { push: "Push", pull: "Pull", legs: "Jambes", upper: "Haut du corps", lower: "Bas du corps", fullA: "Full body A", fullB: "Full body B", fullC: "Full body C" };
const SPLITS = { 2: ["fullA", "fullB"], 3: ["fullA", "fullB", "fullC"], 4: ["upper", "lower", "upper", "lower"], 5: ["push", "pull", "legs", "upper", "lower"], 6: ["push", "pull", "legs", "push", "pull", "legs"] };

export const ALL_EXOS = [...new Set([...Object.values(GYM).flat(), ...Object.values(HOME).flat()])].sort();

export function generateProgram({ days = 3, place = "salle", experience = "debutant" } = {}) {
  const n = Math.min(6, Math.max(2, Number(days) || 3));
  const lib = place === "maison" ? HOME : GYM;
  return SPLITS[n].map((k, i) => ({ name: `Jour ${i + 1} · ${LABEL[k]}`, exercises: experience === "debutant" ? lib[k].slice(0, 4) : [...lib[k]] }));
}

// Exercices types issus de ton Excel
export const GROUPS = ["Pectoraux", "Dos", "Épaules", "Quadriceps", "Ischios/Fessiers", "Biceps", "Triceps", "Abdos", "Molet"];
export const DEFAULT_EXERCISES = [["Développé couché (barre)", "Pectoraux", 3, 6, 10, 2.5], ["Développé militaire (haltere)", "Épaules", 3, 6, 10, 2.5], ["Extensions triceps poulie", "Triceps", 3, 8, 12, 2.5], ["Tractions lestées", "Dos", 3, 6, 10, 2.5], ["Rowing barre", "Dos", 3, 8, 12, 2.5], ["Curl barre EZ", "Biceps", 3, 8, 12, 2.5], ["Squat (barre)", "Quadriceps", 3, 5, 8, 2.5], ["Presse à cuisses", "Quadriceps", 3, 8, 15, 5.0], ["Soulevé de terre", "Ischios/Fessiers", 3, 5, 8, 5.0], ["Hip thrust", "Ischios/Fessiers", 3, 8, 12, 5.0], ["Développé incliné haltères", "Pectoraux", 3, 8, 12, 2.0], ["Élévations latérales", "Épaules", 3, 12, 15, 1.0], ["Rowing haltère unilatéral", "Dos", 3, 8, 12, 2.0], ["Leg curl", "Ischios/Fessiers", 3, 8, 12, 2.5], ["Dips lestés", "Triceps", 3, 8, 12, 2.5], ["Crunch poulie", "Abdos", 3, 12, 15, 2.5], ["Tirage vertical", "Dos", 3, 8, 12, 2.5], ["Fente bulgare", "Ischios/Fessiers", 3, 7, 15, 1.5], ["Molet presse", "Molet", 3, 7, 15, 2.5], ["Leg curl poulie basse", "Ischios/Fessiers", 3, 7, 15, 2.5], ["Rowing banc", "Dos", 3, 8, 12, 2.0], ["Tirage horizontal", "Dos", 3, 8, 12, 2.5], ["Leg extension", "Quadriceps", 3, 8, 12, 2.5], ["Face-pull à la poulie", "Épaules", 3, 7, 15, 2.0]].map(([name, muscle_group, target_sets, rep_min, rep_max, increment]) => ({ name, muscle_group, target_sets, rep_min, rep_max, increment }));
