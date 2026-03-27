import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Board } from "@/components/kanban/Board";
import { JobDetail } from "@/components/jobs/JobDetail";
import { JobForm } from "@/components/jobs/JobForm";
import { useJobs } from "@/api/queries";

export function KanbanPage() {
  const { data: jobs = [] } = useJobs();
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="flex flex-col h-screen">
      <Header onAddJob={() => setShowForm(true)} />
      <main className="flex-1 overflow-auto p-4">
        <Board jobs={jobs} onCardClick={(id) => setSelectedJobId(id)} />
      </main>
      <JobDetail jobId={selectedJobId} onClose={() => setSelectedJobId(null)} />
      <JobForm open={showForm} onClose={() => setShowForm(false)} />
    </div>
  );
}
