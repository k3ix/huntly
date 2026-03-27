import { DndContext, DragEndEvent, closestCenter } from "@dnd-kit/core";
import { JOB_STATUSES } from "@huntly/shared";
import { Column } from "./Column";
import { useUpdateJob } from "@/api/queries";

interface Job {
  id: number;
  company: string;
  position: string;
  status: string;
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

interface BoardProps {
  jobs: Job[];
  onCardClick: (id: number) => void;
}

export function Board({ jobs, onCardClick }: BoardProps) {
  const updateJob = useUpdateJob();

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const jobId = active.id as number;
    const targetStatus = over.id as string;

    const job = jobs.find((j) => j.id === jobId);
    if (!job) return;

    // over.id can be a column status or another card id
    const isColumn = JOB_STATUSES.includes(targetStatus as (typeof JOB_STATUSES)[number]);
    if (isColumn && job.status !== targetStatus) {
      updateJob.mutate({ id: jobId, status: targetStatus });
    } else if (!isColumn) {
      // dropped on a card -- find that card's column
      const targetJob = jobs.find((j) => j.id === (over.id as number));
      if (targetJob && targetJob.status !== job.status) {
        updateJob.mutate({ id: jobId, status: targetJob.status });
      }
    }
  }

  const grouped = Object.fromEntries(
    JOB_STATUSES.map((status) => [status, jobs.filter((j) => j.status === status)])
  );

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {JOB_STATUSES.map((status) => (
          <Column
            key={status}
            status={status}
            jobs={grouped[status] ?? []}
            onCardClick={onCardClick}
          />
        ))}
      </div>
    </DndContext>
  );
}
