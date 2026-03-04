import { create } from "zustand";
import { persist } from "zustand/middleware";
import { dealWords } from "../utils/dealEngine";

const useSpellingStore = create(
  persist(
    (set, get) => ({
      // --- Estado base ---
      words: [],
      currentDeal: [],
      currentIndex: 0,
      sessionNumber: 0,
      sessionHistory: [],

      isFirstDeal: true,
      initialized: false,

      // 🔸 nuevo: perfil activo (grade scope)
      // "all" → Eva (5th–8th), "1st" → Estrella
      activeGrade: "all",

      // --- Cargar palabras ---
      loadWords: async () => {
        if (get().initialized) return;
        const res = await fetch("/words_clean.json");
        const data = await res.json();
        set({ words: data, initialized: true });
      },

      // 🔸 cambiar perfil activo
      setActiveGrade: (gradeKey) => {
        // gradeKey: "all" | "1st"
        set({
          activeGrade: gradeKey,
          currentDeal: [],
          currentIndex: 0,
          isFirstDeal: true,
          // sesión se puede seguir contando globalmente
        });
      },

      // helper que devuelve el subset según perfil
      getActiveWords: () => {
        const { words, activeGrade } = get();
        if (activeGrade === "1st") {
          return words.filter(w => w.grade === "1st");
        }
        // Eva: todo menos 1st
        return words.filter(w => w.grade !== "1st");
      },

      // --- Repartir 10 palabras ---
      deal: () => {
        const { isFirstDeal, sessionNumber, getActiveWords } = get();
        const activeWords = getActiveWords();
        const hand = dealWords(activeWords, isFirstDeal);

        set({
          currentDeal: hand,
          currentIndex: 0,
          isFirstDeal: false,
          sessionNumber: sessionNumber + 1,
        });
      },

      // --- Marcar palabra ---
      markWord: (wordId, result) => {
        const now = new Date().toISOString();
        const { words, currentDeal, currentIndex, sessionNumber, sessionHistory } = get();

        const updatedWords = words.map(w => {
          if (w.id !== wordId) return w;
          const stats = { ...w.stats };
          stats.timesShown += 1;
          stats.lastSeen = now;
          if (!stats.firstSeen) stats.firstSeen = now;

          if (result === "mastered") {
            stats.timesCorrect += 1;
            stats.streak += 1;
          } else {
            stats.timesWrong += 1;
            stats.streak = 0;
          }

          stats.accuracy = Math.round((stats.timesCorrect / stats.timesShown) * 100);

          return { ...w, status: result, stats };
        });

        const updatedHistory = [...sessionHistory];
        const sessionIdx = updatedHistory.findIndex(s => s.sessionNumber === sessionNumber);
        const entry = { wordId, result, timestamp: now };

        if (sessionIdx === -1) {
          updatedHistory.push({ sessionNumber, date: now, results: [entry] });
        } else {
          updatedHistory[sessionIdx].results.push(entry);
        }

        set({
          words: updatedWords,
          currentIndex: currentIndex + 1,
          sessionHistory: updatedHistory,
        });
      },

      // --- Reset completo (solo stats/estado, no borra palabras) ---
      resetAll: () => {
        set(state => ({
          words: state.words.map(w => ({
            ...w,
            status: "pending",
            stats: {
              timesShown: 0,
              timesCorrect: 0,
              timesWrong: 0,
              accuracy: 0,
              streak: 0,
              lastSeen: null,
              firstSeen: null,
            },
          })),
          currentDeal: [],
          currentIndex: 0,
          sessionNumber: 0,
          sessionHistory: [],
          isFirstDeal: true,
        }));
      },

      // --- Stats por perfil activo ---
      getStats: () => {
        const { getActiveWords, sessionHistory } = get();
        const active = getActiveWords();
        return {
          total: active.length,
          pending: active.filter(w => w.status === "pending").length,
          mastered: active.filter(w => w.status === "mastered").length,
          struggling: active.filter(w => w.status === "struggling").length,
          sessions: sessionHistory.length,
        };
      },
    }),
    {
      name: "eva-spelling-store",
    }
  )
);

export default useSpellingStore;
