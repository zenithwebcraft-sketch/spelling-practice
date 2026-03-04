// merge_words.js
const fs = require("fs");

// 1. Cargar las 50 palabras de Estrella
const estrella = JSON.parse(fs.readFileSync("./estrella.json", "utf-8")); // pega ahí este JSON

// 2. Cargar el words_clean.json actual (101-222 de Eva)
const upper = JSON.parse(fs.readFileSync("./public/words_clean.json", "utf-8"));

const statsTemplate = {
  timesShown: 0,
  timesCorrect: 0,
  timesWrong: 0,
  accuracy: 0,
  streak: 0,
  lastSeen: null,
  firstSeen: null,
};

// Añadir stats a Estrella
const estrellaWithStats = estrella.map(w => ({
  ...w,
  stats: { ...statsTemplate },
}));

// Asegurar stats en upper y fixes básicos
const upperFixed = upper.map(w => {
  const fixed = { ...w };

  if (!fixed.stats) {
    fixed.stats = { ...statsTemplate };
  }

  // Por si aún no estaban los fixes:
  if (fixed.id === 101) {
    fixed.sentence = "Adith accidentally garbled the message he was asked to pass along to his sister.";
  }
  if (fixed.id === 111) {
    fixed.spelling = "N-O-M-A-D";
  }

  return fixed;
});

// Unir ambas listas: Estrella primero (1–50), luego Eva (101–222)
const merged = [...estrellaWithStats, ...upperFixed];

// Guardar nuevo archivo
fs.writeFileSync("./public/words_clean.json", JSON.stringify(merged, null, 2), "utf-8");

console.log("✅ words_clean.json actualizado con 1st + 5th–8th y stats completos.");
console.log("Total words:", merged.length);
console.log("1st grade:", merged.filter(w => w.grade === "1st").length);
