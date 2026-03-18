import { create } from "zustand";
import { persist } from "zustand/middleware";
import { dealWords } from "../utils/dealEngine";
import { saveWordProgress, loadUserProgress } from "../services/progressService";

const useSpellingStore = create(
  persist(
    (set, get) => ({
      words:         [],
      currentDeal:   [],
      currentIndex:  0,
      sessionNumber: 0,
      sessionHistory:[],
      isFirstDeal:   true,
      initialized:   false,
      activeGrade:   "all",
      uid:           null,      // 🔸 uid del usuario Firebase

      // ── Setters básicos ─────────────────────────────────────
      setUid: (uid) => set({ uid }),

      setActiveGrade: (gradeKey) => set({
        activeGrade: gradeKey,
        currentDeal: [],
        currentIndex: 0,
        isFirstDeal: true,
      }),

      // ── Cargar palabras + progreso Firebase ─────────────────
      loadWords: async (uid) => {
        // Siempre recargar si viene un uid nuevo
        const prevUid = get().uid;
        if (get().initialized && prevUid === uid) return;

        // 1. Cargar JSON de palabras
        const res  = await fetch("/words_clean.json");
        const data = await res.json();

        // 2. Cargar progreso de Firebase si hay usuario
        let progress = {};
        if (uid) {
          try {
            progress = await loadUserProgress(uid);
          } catch (e) {
            console.warn("Could not load progress:", e);
          }
        }

        // 3. Mezclar palabras + progreso guardado
        const words = data.map(w => {
          const saved = progress[w.id];
          if (saved) {
            return { ...w, status: saved.status, stats: saved.stats };
          }
          return w;
        });

        set({ words, initialized: true, uid: uid || null });
      },

      // ── Helpers ─────────────────────────────────────────────
      getActiveWords: () => {
        const { words, activeGrade } = get();
        if (activeGrade === "1st") {
          return words.filter(w => (w.grade || "").toLowerCase() === "1st");
        }
        return words.filter(w => (w.grade || "").toLowerCase() !== "1st");
      },

      // ── Deal ────────────────────────────────────────────────
      deal: () => {
        const { sessionNumber, getActiveWords } = get();
        const hand = dealWords(getActiveWords()); // ← sin isFirstDeal
        set({
          currentDeal:   hand,
          currentIndex:  0,
          isFirstDeal:   false,
          sessionNumber: sessionNumber + 1,
        });
      },

      // ── Marcar palabra + guardar en Firebase ─────────────────
      markWord: async (wordId, result) => {
        const now = new Date().toISOString();
        const {
          words, currentIndex, sessionNumber,
          sessionHistory, uid,
        } = get();

        const updatedWords = words.map(w => {
          if (w.id !== wordId) return w;

          const stats = { ...w.stats };
          stats.timesShown  += 1;
          stats.lastSeen     = now;
          if (!stats.firstSeen) stats.firstSeen = now;

          if (result === "mastered") {
            stats.timesCorrect += 1;
            stats.streak       += 1;
          } else {
            stats.timesWrong += 1;
            stats.streak      = 0;
          }

          stats.accuracy = Math.round((stats.timesCorrect / stats.timesShown) * 100);

          // 🔸 Guardar en Firebase si hay usuario
          if (uid) {
            saveWordProgress(uid, wordId, result, stats).catch(e =>
              console.warn("Could not save progress:", e)
            );
          }

          return { ...w, status: result, stats };
        });

        const updatedHistory = [...sessionHistory];
        const sessionIdx = updatedHistory.findIndex(
          s => s.sessionNumber === sessionNumber
        );
        const entry = { wordId, result, timestamp: now };

        if (sessionIdx === -1) {
          updatedHistory.push({ sessionNumber, date: now, results: [entry] });
        } else {
          updatedHistory[sessionIdx].results.push(entry);
        }

        set({
          words:          updatedWords,
          currentIndex:   currentIndex + 1,
          sessionHistory: updatedHistory,
        });
      },

      // ── Stats filtrados ──────────────────────────────────────
      getStats: () => {
        const { getActiveWords, sessionHistory } = get();
        const active = getActiveWords();
        return {
          total:     active.length,
          pending:   active.filter(w => w.status === "pending").length,
          mastered:  active.filter(w => w.status === "mastered").length,
          struggling:active.filter(w => w.status === "struggling").length,
          sessions:  sessionHistory.length,
        };
      },

      // ── Reset completo ───────────────────────────────────────
      resetAll: () => {
        set(state => ({
          words: state.words.map(w => ({
            ...w,
            status: "pending",
            stats: {
              timesShown:  0,
              timesCorrect:0,
              timesWrong:  0,
              accuracy:    0,
              streak:      0,
              lastSeen:    null,
              firstSeen:   null,
            },
          })),
          currentDeal:    [],
          currentIndex:   0,
          sessionNumber:  0,
          sessionHistory: [],
          isFirstDeal:    true,
        }));
      },
    }),
    { name: "spelling-store" }
  )
);

export default useSpellingStore;
