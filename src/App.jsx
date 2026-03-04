import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Session from "./pages/Session";
import SessionAuto from "./pages/SessionAuto";
import Rater from "./pages/Rater";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"             element={<Home />} />
        <Route path="/session"      element={<Session />} />
        <Route path="/session-auto" element={<SessionAuto />} />
        <Route path="/rater"        element={<Rater />} />
      </Routes>
    </BrowserRouter>
  );
}
