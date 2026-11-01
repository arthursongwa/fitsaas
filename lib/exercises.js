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
