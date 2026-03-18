function shuffle(array) {
  return [...array].sort(() => Math.random() - 0.5);
}

/**
 * Arma un lote de palabras para la sesión.
 *
 * Reglas:
 * - Con pending:    hasta 6 pending + hasta 2 struggling + hasta 2 mastered
 * - Sin pending:    hasta 8 struggling + hasta 2 mastered
 * - Deal < 10 si no hay suficientes palabras (no bloquea)
 * - Retorna [] solo cuando pending=0 Y struggling=0 (todo dominado)
 */
export function dealWords(activeWords) {
  const pending    = shuffle(activeWords.filter(w => w.status === "pending"));
  const struggling = shuffle(activeWords.filter(w => w.status === "struggling"));
  const mastered   = shuffle(activeWords.filter(w => w.status === "mastered"));

  // Verdaderamente terminado
  if (pending.length === 0 && struggling.length === 0) return [];

  let deal = [];

  if (pending.length > 0) {
    // ── Caso normal: hay palabras nuevas ──────────────────────
    deal = [
      ...pending.slice(0, 6),
      ...struggling.slice(0, 2),
      ...mastered.slice(0, 2),
    ];

    // Completar hasta 10 con más struggling
    if (deal.length < 10) {
      const usedIds = new Set(deal.map(w => w.id));
      deal = [
        ...deal,
        ...struggling
          .filter(w => !usedIds.has(w.id))
          .slice(0, 10 - deal.length),
      ];
    }

    // Completar hasta 10 con más pending
    if (deal.length < 10) {
      const usedIds = new Set(deal.map(w => w.id));
      deal = [
        ...deal,
        ...pending
          .filter(w => !usedIds.has(w.id))
          .slice(0, 10 - deal.length),
      ];
    }

  } else {
    // ── Caso repaso: ya no quedan nuevas ──────────────────────
    deal = [
      ...struggling.slice(0, 8),
      ...mastered.slice(0, 2),
    ];
  }

  return shuffle(deal);
}
