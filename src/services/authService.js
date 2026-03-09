import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";

// Lista de palabras para generar códigos memorables
const CODE_WORDS = [
  "STAR", "MOON", "TREE", "BIRD", "LAKE",
  "FIRE", "WIND", "RAIN", "SNOW", "LEAF",
  "ROCK", "BEAR", "WOLF", "DOVE", "ROSE",
  "PINE", "SAGE", "JADE", "RUBY", "OPAL",
  "HAWK", "FROG", "DEER", "SWAN", "BOLT",
];

export function generateAccessCode() {
  const word   = CODE_WORDS[Math.floor(Math.random() * CODE_WORDS.length)];
  const digits = Math.floor(1000 + Math.random() * 9000);
  return `${word}-${digits}`;
}

// Convierte código → credenciales Firebase
function codeToCredentials(code) {
  const clean = code.toUpperCase().trim().replace(/\s/g, "");
  return {
    email:    `${clean}@spellingpractice.app`,
    password: clean,
  };
}

// REGISTRO: nombre + grado → devuelve accessCode
export async function registerUser(name, grade) {
  const accessCode = generateAccessCode();
  const { email, password } = codeToCredentials(accessCode);

  const { user } = await createUserWithEmailAndPassword(auth, email, password);

  await setDoc(doc(db, "users", user.uid), {
    name,
    grade,
    accessCode,
    createdAt: new Date().toISOString(),
  });

  return { user, accessCode };
}

// LOGIN: solo con el código
export async function loginWithCode(code) {
  const { email, password } = codeToCredentials(code);
  const { user } = await signInWithEmailAndPassword(auth, email, password);

  const snap = await getDoc(doc(db, "users", user.uid));
  if (!snap.exists()) throw new Error("User data not found");

  return { user, userData: snap.data() };
}

// LOGOUT
export async function logoutUser() {
  await signOut(auth);
}
