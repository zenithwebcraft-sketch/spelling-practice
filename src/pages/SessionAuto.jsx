import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import useSpellingStore from "../store/useSpellingStore";
import { speak, cancelSpeech } from "../utils/tts";

// Sonidos nativos sin archivos
let audioContext = null;

function playSound(frequency, duration, type = "sine") {
  audioContext = audioContext || new (window.AudioContext || window.webkitAudioContext)();
  
  const oscillator = audioContext.createOscillator();
  const gainNode   = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.frequency.value = frequency;
  oscillator.type = type;

  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + duration);
}

function playSuccess() {
  // 🎉 Correcto: acorde ascendente triunfal
  playSound(523, 0.15, "sine");   // Do
  setTimeout(() => playSound(659, 0.15, "sine"), 150); // Mi
  setTimeout(() => playSound(784, 0.3, "sine"), 300);  // Sol
}

function playError() {
  // ❌ Error: acorde descendente triste
  playSound(392, 0.15, "square"); // Sol
  setTimeout(() => playSound(330, 0.15, "square"), 150); // Mi
  setTimeout(() => playSound(262, 0.3, "square"), 300);  // Do
}

function normalizeSpelling(text) {
  return text
    .replace(/[^A-Za-z]/g, "")
    .toUpperCase()
    .trim();
}

function parseSentence(sentence, word) {
  const regex = new RegExp(`(${word})`, "i");
  return sentence.split(regex);
}
function normalizeLettersString(text) {
  // "F I R S T" → "FIRST"
  return text
    .toUpperCase()
    .replace(/[^A-Z]/g, "")   // solo letras
    .trim();
}

function WordCardAuto({ word, onResult }) {
  const [speaking, setSpeaking] = useState(false);
  const [displayLetters, setDisplayLetters] = useState("");
  const [status, setStatus] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [countdown, setCountdown] = useState(null);

  const recognitionRef = useRef(null);
  const timerRef = useRef(null);
  const countdownRef = useRef(null);
  const transcriptRef = useRef("");

  useEffect(() => {
    setSpeaking(true);
    setDisplayLetters("");
    setStatus(null);
    setRevealed(false);
    setIsListening(false);
    setCountdown(null);
    transcriptRef.current = "";

    speak(word.word, word.sentence, word.grade, () => {
      setSpeaking(false);
    });

    return () => {
      clearTimeout(timerRef.current);
      clearInterval(countdownRef.current);

      if (recognitionRef.current) {
        recognitionRef.current.onresult = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }
    };
  }, [word.id]);

  function handleResultFromSpeech(rawTranscript) {
    const normalized = normalizeLettersString(rawTranscript);
    const expected = word.word.toUpperCase();
    const isCorrect = normalized === expected;

    setDisplayLetters(
      normalized ? normalized.split("").join("-") : "😅 I didn't catch that"
    );
    setStatus(isCorrect ? "correct" : "wrong");
    setRevealed(true);

    if (isCorrect) {
      playSuccess();
      setTimeout(() => onResult(word.id, "mastered"), 3000);
    } else {
      playError();
    }
  }

  function stopListening(recognition) {
    clearTimeout(timerRef.current);
    clearInterval(countdownRef.current);
    try {
      recognition.stop();
    } catch (e) {}
  }

  function startListening() {
    if (status || isListening || speaking) return;

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech Recognition no soportado en este navegador 😞");
      return;
    }

    transcriptRef.current = "";

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = false;      // ← natural speech-end detection
    recognition.interimResults = false;  // ← solo resultado final, limpio
    recognition.maxAlternatives = 3;     // ← revisa alternativas también

    recognition.onresult = (event) => {
      // Con continuous:false, siempre es results[0]
      // Revisa las alternativas para encontrar la que mejor matchea
      let bestMatch = "";
      const expected = word.word.toUpperCase();

      for (let i = 0; i < event.results[0].length; i++) {
        const alt = normalizeLettersString(event.results[0][i].transcript);
        if (alt === expected) { bestMatch = alt; break; }
        if (!bestMatch) bestMatch = alt;
      }

      transcriptRef.current = bestMatch;
      setDisplayLetters(bestMatch ? bestMatch.split("").join("-") : "🎙 Processing...");
    };

    recognition.onerror = () => {
      setIsListening(false);
      setCountdown(null);
      clearTimeout(timerRef.current);
      clearInterval(countdownRef.current);
      setDisplayLetters("😅 Try again");
      recognitionRef.current = null;
    };

    recognition.onend = () => {
      setIsListening(false);
      setCountdown(null);
      clearTimeout(timerRef.current);
      clearInterval(countdownRef.current);
      recognitionRef.current = null;

      const transcript = transcriptRef.current.trim();

      if (!transcript) {
        setDisplayLetters("😅 I didn't catch that. Tap to try again");
        return;
      }

      handleResultFromSpeech(transcript);
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
      setIsListening(true);
      setStatus(null);
      setRevealed(false);
      setDisplayLetters("🎙 Listening...");

      const listenTime = Math.max(3000, word.word.length * 600);
      let remaining = Math.ceil(listenTime / 1000);
      setCountdown(remaining);

      countdownRef.current = setInterval(() => {
        remaining -= 1;
        if (remaining >= 0) setCountdown(remaining);
        if (remaining <= 0) clearInterval(countdownRef.current);
      }, 1000);

      timerRef.current = setTimeout(() => {
        stopListening(recognition);
      }, listenTime);
    } catch (e) {
      setIsListening(false);
      setCountdown(null);
      recognitionRef.current = null;
    }
  }

  const sentenceParts = parseSentence(word.sentence, word.word);
  const wordFoundInSentence = sentenceParts.length === 3;

  const inputBg =
    status === "correct"
      ? "bg-green-50 border-green-400 text-green-700"
      : status === "wrong"
      ? "bg-red-50 border-red-400 text-red-500"
      : "bg-white border-gray-200 text-gray-800";

  return (
    <div className="bg-white rounded-3xl shadow-lg p-8 flex flex-col gap-7">
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold uppercase tracking-widest text-indigo-300">
          {word.grade} Grade
        </span>
        <span className="text-sm font-mono font-bold bg-indigo-50 text-indigo-400 px-3 py-1 rounded-full">
          #{word.id}
        </span>
      </div>

      <button
        onClick={() => {
          setSpeaking(true);
          speak(word.word, word.sentence, word.grade, () => setSpeaking(false));
        }}
        className="flex items-center justify-center gap-2 text-indigo-500 hover:text-indigo-700 transition-colors text-base font-semibold"
      >
        {speaking ? (
          <span className="animate-pulse">🔊 Playing...</span>
        ) : (
          <span>🔁 Repeat word</span>
        )}
      </button>

      <div className="bg-gray-50 rounded-2xl px-5 py-5">
        <span className="text-xs text-gray-300 uppercase tracking-widest block mb-3">
          Sentence
        </span>
        <p className="text-center text-gray-600 italic text-lg leading-relaxed">
          "
          {wordFoundInSentence ? (
            <>
              {sentenceParts[0]}
              {revealed ? (
                <span className="font-bold text-indigo-600 not-italic">
                  {sentenceParts[1]}
                </span>
              ) : (
                <span className="inline-block bg-gray-300 text-gray-300 rounded px-1 select-none">
                  {"_".repeat(sentenceParts[1].length)}
                </span>
              )}
              {sentenceParts[2]}
            </>
          ) : (
            word.sentence
          )}
          "
        </p>
      </div>

      <div>
        <span className="text-xs text-gray-300 uppercase tracking-widest block mb-2">
          Say the letters one by one →
        </span>
        <div
          className={`w-full text-center text-2xl font-mono font-bold rounded-2xl border-2 py-4 px-4 transition-all duration-300 tracking-widest ${inputBg}`}
          style={{
            animation:
              status === "correct"
                ? "bounce 0.6s ease-in-out"
                : status === "wrong"
                ? "shake 0.5s ease-in-out"
                : "none",
          }}
        >
          {displayLetters || "🎙 Tap the button to start"}
        </div>

        {status === "correct" && (
          <p className="text-center text-green-500 font-bold mt-2 text-lg animate-bounce">
            ✅ Perfect! 🎉
          </p>
        )}

        {status === "wrong" && (
          <p className="text-center text-red-400 font-bold mt-2 text-lg">
            ❌ Not quite — check the spelling below
          </p>
        )}
      </div>

      <style jsx>{`
        @keyframes bounce {
          0%,
          100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }
        @keyframes shake {
          0%,
          100% {
            transform: translateX(0);
          }
          25% {
            transform: translateX(-4px);
          }
          75% {
            transform: translateX(4px);
          }
        }
      `}</style>

      {!status ? (
        <button
          onClick={startListening}
          disabled={isListening || speaking}
          className={`w-full ${
            isListening
              ? "bg-red-500 cursor-not-allowed"
              : "bg-indigo-600 hover:bg-indigo-700"
          } active:scale-95 text-white font-black py-5 rounded-2xl text-lg transition-all disabled:opacity-70`}
        >
          {isListening
            ? `🎙 Listening... ${countdown ?? ""}s`
            : speaking
            ? "⏳ Wait..."
            : "🎙 Tap to spell"}
        </button>
      ) : status === "wrong" ? (
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => onResult(word.id, "struggling")}
            className="py-5 rounded-2xl bg-red-50 hover:bg-red-100 active:scale-95 text-red-500 font-black text-xl transition-all"
          >
            ❌ Review
          </button>
          <button
            onClick={() => onResult(word.id, "mastered")}
            className="py-5 rounded-2xl bg-green-50 hover:bg-green-100 active:scale-95 text-green-600 font-black text-xl transition-all"
          >
            ✅ Override
          </button>
        </div>
      ) : null}

      {revealed && (
        <div className="bg-indigo-50 rounded-2xl px-5 py-4 text-center">
          <span className="text-xs text-indigo-300 uppercase tracking-widest block mb-2">
            Spelling
          </span>
          <span className="font-mono font-bold text-indigo-600 tracking-widest text-2xl">
            {word.spelling}
          </span>
        </div>
      )}
    </div>
  );
}


// ─── Página SessionAuto ──────────────────────────────────────────────
export default function SessionAuto() {
  const navigate     = useNavigate();
  const currentDeal  = useSpellingStore(s => s.currentDeal);
  const currentIndex = useSpellingStore(s => s.currentIndex);
  const markWord     = useSpellingStore(s => s.markWord);
  const sessionNumber= useSpellingStore(s => s.sessionNumber);
  const words        = useSpellingStore(s => s.words);

  useEffect(() => {
    if (currentDeal.length === 0) navigate("/");
  }, []);

  const total    = currentDeal.length;
  const done     = currentIndex;
  const progress = total > 0 ? Math.round((done / total) * 100) : 0;
  const current  = currentDeal[currentIndex];
  const finished = currentIndex >= total;

  if (finished) {
    const dealResults = currentDeal.map(dw => words.find(w => w.id === dw.id) || dw);
    const masteredCount   = dealResults.filter(w => w.status === "mastered").length;
    const strugglingCount = dealResults.filter(w => w.status === "struggling").length;

    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 to-purple-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-lg p-8 max-w-sm w-full">
          <div className="text-center mb-6">
            <div className="text-6xl mb-3">🎉</div>
            <h2 className="text-2xl font-black text-violet-800">Round Complete!</h2>
            <p className="text-gray-400 text-sm mt-1">Session #{sessionNumber} · Auto mode</p>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-green-50 rounded-2xl p-4 text-center">
              <p className="text-3xl font-black text-green-600">{masteredCount}</p>
              <p className="text-xs text-green-400 font-semibold mt-1">Got it! ✅</p>
            </div>
            <div className="bg-red-50 rounded-2xl p-4 text-center">
              <p className="text-3xl font-black text-red-400">{strugglingCount}</p>
              <p className="text-xs text-red-300 font-semibold mt-1">To Review ❌</p>
            </div>
          </div>
          <div className="space-y-2 mb-8 max-h-64 overflow-y-auto">
            {dealResults.map(w => (
              <div key={w.id} className={`flex items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold ${
                w.status === "mastered" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-400"
              }`}>
                <span>{w.status === "mastered" ? "✅" : "❌"} {w.word}</span>
                <span className="font-mono text-xs opacity-50">#{w.id}</span>
              </div>
            ))}
          </div>
          <button
            onClick={() => navigate("/")}
            className="w-full bg-violet-600 hover:bg-violet-700 active:scale-95 text-white font-bold py-4 rounded-2xl text-lg transition-all"
          >
            🏠 Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-purple-50 p-6">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => navigate("/")} className="text-violet-300 hover:text-violet-600 transition-colors text-sm">
            ← Home
          </button>
          <span className="text-sm font-semibold text-violet-400">
            🤖 Auto · {done + 1} / {total}
          </span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2 mb-8">
          <div
            className="bg-violet-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <WordCardAuto
          key={current.id}
          word={current}
          onResult={markWord}
        />
      </div>
    </div>
  );
}
