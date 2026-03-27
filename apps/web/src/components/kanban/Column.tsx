import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { JobCard } from "./Card";

interface Job {
  id: number;
  company: string;
  position: string;
  recruiterName: string | null;
  location: string | null;
  format: string | null;
  notes: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string | null;
  contractType?: string | null;
  salaryGross?: boolean | null;
  source?: string | null;
  nextStep?: string | null;
  updatedAt: string;
  tags: { id: number; name: string }[];
}

interface ColumnProps {
  status: string;
  jobs: Job[];
  onCardClick: (id: number) => void;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function Column({ status, jobs, onCardClick }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div className="flex flex-col w-64 shrink-0">
      <div className="flex items-center justify-between mb-2 px-1">
        <span className="font-semibold text-sm">{capitalize(status)}</span>
        <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">
          {jobs.length}
        </span>
      </div>
      <div
        ref={setNodeRef}
        className={`flex-1 rounded-lg p-2 min-h-32 transition-colors ${
          isOver ? "bg-muted/60" : "bg-muted/30"
        }`}
      >
        <SortableContext items={jobs.map((j) => j.id)} strategy={verticalListSortingStrategy}>
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} onClick={() => onCardClick(job.id)} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}
