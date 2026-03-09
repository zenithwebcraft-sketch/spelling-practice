import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./lib/firebase";

import Login    from "./pages/Login";
import Home     from "./pages/Home";
import Session      from "./pages/Session";
import SessionAuto  from "./pages/SessionAuto";
import Rater        from "./pages/Rater";

function ProtectedRoute({ user, children }) {
  if (user === undefined) return (
    // Cargando: esperando a Firebase Auth
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-indigo-400 text-lg animate-pulse">Loading... 🐝</p>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const [user, setUser] = useState(undefined); // undefined = cargando

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u ?? null); // null = no logueado
    });
    return unsub;
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={
          user ? <Navigate to="/" replace /> : <Login />
        } />
        <Route path="/" element={
          <ProtectedRoute user={user}><Home /></ProtectedRoute>
        } />
        <Route path="/session" element={
          <ProtectedRoute user={user}><Session /></ProtectedRoute>
        } />
        <Route path="/session-auto" element={
          <ProtectedRoute user={user}><SessionAuto /></ProtectedRoute>
        } />
        <Route path="/rater" element={
          <ProtectedRoute user={user}><Rater /></ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}
