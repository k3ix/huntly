import { Routes, Route, Navigate } from "react-router-dom";
import { KanbanPage } from "@/pages/KanbanPage";
import { ListPage } from "@/pages/ListPage";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<KanbanPage />} />
      <Route path="/list" element={<ListPage />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
