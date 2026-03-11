import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { logoutUser } from "../services/authService";
import useSpellingStore from "../store/useSpellingStore";

export default function Home() {
  const navigate       = useNavigate();
  const loadWords      = useSpellingStore(s => s.loadWords);
  const deal           = useSpellingStore(s => s.deal);
  const getStats       = useSpellingStore(s => s.getStats);
  const resetAll       = useSpellingStore(s => s.resetAll);
  const isFirstDeal    = useSpellingStore(s => s.isFirstDeal);
  const setActiveGrade = useSpellingStore(s => s.setActiveGrade);

  const [userData, setUserData] = useState(null); // { name, grade, accessCode }
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    async function init() {
      const user = auth.currentUser;
      if (!user) { navigate("/login"); return; }

      // Cargar datos del perfil
      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) {
        const data = snap.data();
        setUserData(data);
        // Aplicar grade del perfil al store
        setActiveGrade(data.grade);
        // Cargar palabras + progreso Firebase
        await loadWords(user.uid);
      }
      setLoading(false);
    }
    init();
  }, []);

  async function handleLogout() {
    await logoutUser();
    navigate("/login");
  }

  function handleDeal(path) {
    deal();
    navigate(path);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50">
        <p className="text-indigo-400 text-lg animate-pulse">Loading your words... 🐝</p>
      </div>
    );
  }

  const stats      = getStats();
  const progressPct = stats.total > 0
    ? Math.round((stats.mastered / stats.total) * 100)
    : 0;

  const gradeLabel = userData?.grade === "1st" ? "1st Grade" : "5th–8th Grade";
  const gradeEmoji = userData?.grade === "1st" ? "🌈" : "🚀";

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center p-6">
      <div className="max-w-sm w-full">

        {/* Header: nombre + grado + logout */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-xs text-indigo-300 uppercase tracking-widest">
              {gradeEmoji} {gradeLabel}
            </p>
            <h2 className="text-xl font-black text-indigo-800">
              Hi, {userData?.name}! 👋
            </h2>
          </div>
          <button
            onClick={handleLogout}
            className="text-xs text-gray-400 hover:text-red-400 transition-colors"
          >
            Sign out
          </button>
        </div>

        {/* Barra de progreso */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">🏆</div>
          <h1 className="text-4xl font-black text-indigo-800">Spelling Practice</h1>
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

        {/* Botones principales */}
        <button
          onClick={() => handleDeal("/session-auto")}
          disabled={stats.total === 0}
          className="w-full bg-violet-600 hover:bg-violet-700 active:scale-95 text-white font-black py-6 rounded-3xl text-xl shadow-lg transition-all duration-150 disabled:opacity-40 mb-4"
        >
          🎙 Practice
          <p className="text-sm font-normal opacity-70 mt-1">
            Listen, think, and tap to spell.
          </p>
        </button>

        {/* Stats */}
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

        {/* Branding */}
        <div className="mt-8 text-center text-xs text-gray-400 space-y-2">
          <p>
            Built with ❤️ by{" "}
            <a
              href="https://zenithwebcraft.com"
              target="_blank"
              rel="noreferrer"
              className="text-indigo-400 hover:text-indigo-600 font-semibold"
            >
              zenithwebcraft.com
            </a>
          </p>
          <a
            href="https://buymeacoffee.com/zenithwebcraft"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-300 hover:bg-yellow-400 text-xs font-bold text-gray-800 shadow-sm transition-all"
          >
            ☕ Buy me a coffee
          </a>
        </div>

      </div>
    </div>
  );
}
