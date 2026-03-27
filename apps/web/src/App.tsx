import { Routes, Route, Navigate } from "react-router-dom";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<div className="p-8 text-xl">Huntly - Coming soon</div>} />
      <Route path="/list" element={<div className="p-8">List view</div>} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
