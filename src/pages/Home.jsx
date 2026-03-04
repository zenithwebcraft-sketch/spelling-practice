import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useSpellingStore from "../store/useSpellingStore";

export default function Home() {
  const navigate      = useNavigate();
  const loadWords     = useSpellingStore(s => s.loadWords);
  const deal          = useSpellingStore(s => s.deal);
  const getStats      = useSpellingStore(s => s.getStats);
  const resetAll      = useSpellingStore(s => s.resetAll);
  const isFirstDeal   = useSpellingStore(s => s.isFirstDeal);
  const activeGrade   = useSpellingStore(s => s.activeGrade);
  const setActiveGrade= useSpellingStore(s => s.setActiveGrade);

  useEffect(() => { loadWords(); }, []);

  const stats = getStats();
  const progressPct = stats.total > 0
    ? Math.round((stats.mastered / stats.total) * 100)
    : 0;

  const profileLabel = activeGrade === "1st" ? "Estrella · 1st grade" : "Eva · 5th–8th grade";

  function handleDeal(path) {
    deal();
    navigate(path);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center p-6">
      <div className="max-w-sm w-full">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">🏆</div>
          <h1 className="text-4xl font-black text-indigo-800">Spelling Bee Lab</h1>
          <p className="text-indigo-300 mt-1 text-sm">
            {profileLabel}
          </p>
          <div className="w-full bg-gray-100 rounded-full h-2 mt-3">
            <div
              className="bg-indigo-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <p className="text-indigo-300 mt-1 text-xs">
            {stats.mastered} / {stats.total} words mastered
          </p>
        </div>

        {/* Selector de hija / perfil */}
        <div className="grid grid-cols-2 gap-2 mb-6">
          <button
            onClick={() => setActiveGrade("1st")}
            className={`py-2 rounded-2xl text-sm font-semibold border ${
              activeGrade === "1st"
                ? "bg-pink-500 text-white border-pink-500 shadow-md"
                : "bg-white text-pink-400 border-pink-200"
            }`}
          >
            🌈 Estrella (1st)
          </button>
          <button
            onClick={() => setActiveGrade("all")}
            className={`py-2 rounded-2xl text-sm font-semibold border ${
              activeGrade === "all"
                ? "bg-indigo-600 text-white border-indigo-600 shadow-md"
                : "bg-white text-indigo-400 border-indigo-200"
            }`}
          >
            🚀 Eva (5th–8th)
          </button>
        </div>

        {/* Botón Practice manual */}
        <button
          onClick={() => handleDeal("/session")}
          disabled={stats.total === 0}
          className="w-full bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-black py-6 rounded-3xl text-xl shadow-lg transition-all duration-150 disabled:opacity-40 mb-3"
        >
          🎓 Practice
          <p className="text-sm font-normal opacity-70 mt-1">
            {isFirstDeal ? "First deal — 10 words" : "Deal next 10 words"}
          </p>
        </button>

        {/* Botón Practice Auto */}
        <button
          onClick={() => handleDeal("/session-auto")}
          disabled={stats.total === 0}
          className="w-full bg-violet-600 hover:bg-violet-700 active:scale-95 text-white font-black py-6 rounded-3xl text-xl shadow-lg transition-all duration-150 disabled:opacity-40 mb-4"
        >
          🤖 Practice (Auto)
          <p className="text-sm font-normal opacity-70 mt-1">
            Spell out loud — Wispr validates
          </p>
        </button>

        {/* Botón Rater */}
        <button
          onClick={() => navigate("/rater")}
          className="w-full bg-white hover:bg-gray-50 active:scale-95 text-indigo-600 font-bold py-5 rounded-3xl text-xl shadow-sm border border-indigo-100 transition-all duration-150"
        >
          🔍 Rater
          <p className="text-sm font-normal text-indigo-300 mt-1">
            Look up any word by ID
          </p>
        </button>

        {/* Stats + Reset */}
        <div className="flex justify-between items-center mt-6 px-2 text-sm text-gray-400">
          <span>✅ {stats.mastered} · 🔁 {stats.struggling} · 📋 {stats.pending}</span>
          {stats.sessions > 0 && (
            <button
              onClick={() => { if (confirm("Reset ALL progress?")) resetAll(); }}
              className="text-red-300 hover:text-red-500 transition-colors"
            >
              Reset
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
