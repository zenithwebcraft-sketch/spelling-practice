import {
  doc,
  setDoc,
  collection,
  getDocs,
} from "firebase/firestore";
import { db } from "../lib/firebase";

// Guarda el progreso de UNA palabra
export async function saveWordProgress(uid, wordId, status, stats) {
  await setDoc(
    doc(db, "users", uid, "progress", String(wordId)),
    { wordId, status, stats },
    { merge: true }
  );
}

// Carga TODO el progreso del usuario → objeto { [wordId]: { status, stats } }
export async function loadUserProgress(uid) {
  const snap = await getDocs(collection(db, "users", uid, "progress"));
  const progress = {};
  snap.forEach(d => {
    const data = d.data();
    progress[data.wordId] = { status: data.status, stats: data.stats };
  });
  return progress;
}
