import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent } from "@/components/ui/card";
import { TagBadge } from "@/components/tags/TagBadge";

interface Job {
  id: number;
  company: string;
  position: string;
  recruiterName: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string | null;
  updatedAt: string;
  tags: { id: number; name: string }[];
}

interface JobCardProps {
  job: Job;
  onClick: () => void;
}

function formatSalary(min: number | null, max: number | null, currency: string | null): string | null {
  if (!min && !max) return null;
  const fmt = (n: number) => `${Math.round(n / 1000)}k`;
  const parts = [min && fmt(min), max && fmt(max)].filter(Boolean).join("-");
  return `${parts} ${currency ?? ""}`.trim();
}

export function JobCard({ job, onClick }: JobCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: job.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const salary = formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency);
  const updated = new Date(job.updatedAt).toLocaleDateString();

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card
        className="mb-2 cursor-pointer hover:shadow-md transition-shadow"
        onClick={onClick}
      >
        <CardContent className="p-3 space-y-1">
          <div className="font-semibold text-sm">{job.company}</div>
          <div className="text-sm text-muted-foreground">{job.position}</div>
          {job.recruiterName && (
            <div className="text-xs text-muted-foreground">{job.recruiterName}</div>
          )}
          {salary && <div className="text-xs font-medium">{salary}</div>}
          {job.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              {job.tags.map((tag) => (
                <TagBadge key={tag.id} name={tag.name} />
              ))}
            </div>
          )}
          <div className="text-xs text-muted-foreground pt-1">{updated}</div>
        </CardContent>
      </Card>
    </div>
  );
}
