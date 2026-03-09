import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerUser, loginWithCode } from "../services/authService";

export default function Login() {
  const navigate = useNavigate();
  const [mode, setMode] = useState(null); // null | "new" | "returning"

  // Estados para "Soy nuevo"
  const [name, setName]   = useState("");
  const [grade, setGrade] = useState("all");

  // Estado para "Ya tengo código"
  const [code, setCode] = useState("");

  // UX
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [newCode, setNewCode]   = useState(""); // código generado para mostrar

  async function handleRegister() {
    if (!name.trim()) { setError("Please enter your name"); return; }
    setLoading(true);
    setError("");
    try {
      const { accessCode } = await registerUser(name.trim(), grade);
      setNewCode(accessCode);
    } catch (e) {
      setError("Something went wrong. Please try again.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin() {
    if (!code.trim()) { setError("Please enter your access code"); return; }
    setLoading(true);
    setError("");
    try {
      await loginWithCode(code.trim());
      navigate("/");
    } catch (e) {
      setError("Code not found. Check your code and try again.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  // ─── Pantalla: código generado (post-registro) ───────────────────────
  if (newCode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center p-6">
        <div className="max-w-sm w-full bg-white rounded-3xl shadow-lg p-8 text-center flex flex-col gap-6">
          <div className="text-6xl">🎉</div>
          <h2 className="text-2xl font-black text-indigo-800">
            Welcome, {name}!
          </h2>
          <p className="text-gray-500 text-sm">
            This is your personal access code. Write it down — you'll need it to log in from any device.
          </p>

          {/* Código grande y copiable */}
          <div className="bg-indigo-50 rounded-2xl px-6 py-5">
            <p className="text-xs text-indigo-300 uppercase tracking-widest mb-2">
              Your access code
            </p>
            <p className="text-4xl font-black font-mono text-indigo-700 tracking-widest">
              {newCode}
            </p>
          </div>

          <p className="text-xs text-gray-400">
            ⚠️ Store it somewhere safe. We can't recover it if you lose it.
          </p>

          <button
            onClick={() => navigate("/")}
            className="w-full bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-black py-4 rounded-2xl text-lg transition-all"
          >
            Let's go! 🚀
          </button>
        </div>
      </div>
    );
  }

  // ─── Pantalla: selector inicial ──────────────────────────────────────
  if (!mode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center p-6">
        <div className="max-w-sm w-full flex flex-col gap-6 text-center">
          <div className="text-6xl">🐝</div>
          <h1 className="text-4xl font-black text-indigo-800">
            Spelling Practice
          </h1>
          <p className="text-gray-400 text-sm">
            Practice spelling bee words at your own pace
          </p>

          <button
            onClick={() => setMode("new")}
            className="w-full bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-black py-5 rounded-3xl text-lg shadow-lg transition-all"
          >
            🌟 I'm new here
          </button>

          <button
            onClick={() => setMode("returning")}
            className="w-full bg-white hover:bg-gray-50 active:scale-95 text-indigo-600 font-bold py-5 rounded-3xl text-lg shadow-sm border border-indigo-100 transition-all"
          >
            🔑 I have my code
          </button>

          {/* Branding */}
          <div className="mt-4 text-center text-xs text-gray-400 space-y-2">
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

  // ─── Pantalla: Soy nuevo ──────────────────────────────────────────────
  if (mode === "new") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center p-6">
        <div className="max-w-sm w-full bg-white rounded-3xl shadow-lg p-8 flex flex-col gap-5">
          <button
            onClick={() => { setMode(null); setError(""); }}
            className="text-indigo-300 hover:text-indigo-500 text-sm text-left"
          >
            ← Back
          </button>
          <div className="text-4xl text-center">🌟</div>
          <h2 className="text-2xl font-black text-indigo-800 text-center">
            Create your profile
          </h2>

          {/* Nombre */}
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-widest block mb-2">
              Your name
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleRegister()}
              placeholder="e.g. Eva"
              className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 text-lg font-semibold outline-none focus:border-indigo-400 transition-all"
            />
          </div>

          {/* Grado */}
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-widest block mb-2">
              Grade
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setGrade("1st")}
                className={`py-3 rounded-2xl text-sm font-semibold border transition-all ${
                  grade === "1st"
                    ? "bg-pink-500 text-white border-pink-500 shadow-md"
                    : "bg-white text-pink-400 border-pink-200"
                }`}
              >
                🌈 1st Grade
              </button>
              <button
                onClick={() => setGrade("all")}
                className={`py-3 rounded-2xl text-sm font-semibold border transition-all ${
                  grade === "all"
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-md"
                    : "bg-white text-indigo-400 border-indigo-200"
                }`}
              >
                🚀 5th–8th Grade
              </button>
            </div>
          </div>

          {error && <p className="text-red-400 text-sm text-center">{error}</p>}

          <button
            onClick={handleRegister}
            disabled={loading || !name.trim()}
            className="w-full bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-black py-4 rounded-2xl text-lg transition-all disabled:opacity-40"
          >
            {loading ? "Creating..." : "Create profile 🎉"}
          </button>
        </div>
      </div>
    );
  }

  // ─── Pantalla: Ya tengo código ────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center p-6">
      <div className="max-w-sm w-full bg-white rounded-3xl shadow-lg p-8 flex flex-col gap-5">
        <button
          onClick={() => { setMode(null); setError(""); }}
          className="text-indigo-300 hover:text-indigo-500 text-sm text-left"
        >
          ← Back
        </button>
        <div className="text-4xl text-center">🔑</div>
        <h2 className="text-2xl font-black text-indigo-800 text-center">
          Enter your code
        </h2>
        <p className="text-sm text-gray-400 text-center">
          Your code looks like: <span className="font-mono font-bold text-indigo-400">STAR-4829</span>
        </p>

        <input
          type="text"
          value={code}
          onChange={e => setCode(e.target.value.toUpperCase())}
          onKeyDown={e => e.key === "Enter" && handleLogin()}
          placeholder="STAR-4829"
          className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 text-xl font-mono font-bold text-center outline-none focus:border-indigo-400 tracking-widest transition-all uppercase"
        />

        {error && <p className="text-red-400 text-sm text-center">{error}</p>}

        <button
          onClick={handleLogin}
          disabled={loading || !code.trim()}
          className="w-full bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-black py-4 rounded-2xl text-lg transition-all disabled:opacity-40"
        >
          {loading ? "Logging in..." : "Let's go! 🚀"}
        </button>
      </div>
    </div>
  );
}
