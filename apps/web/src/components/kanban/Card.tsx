import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent } from "@/components/ui/card";
import { TagBadge } from "@/components/tags/TagBadge";

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
  salaryPeriod?: string | null;
  salaryType?: string | null;
  salaryAsk?: number | null;
  salaryAskCurrency?: string | null;
  salaryNetMonthly?: number | null;
  salaryNetCurrency?: string | null;
  contractType?: string | null;
  source?: string | null;
  nextStep?: string | null;
  updatedAt: string;
  tags: { id: number; name: string }[];
}

interface JobCardProps {
  job: Job;
  onClick: () => void;
}

function fmtK(n: number): string {
  const k = n / 1000;
  return Number.isInteger(k) ? `${k}k` : `${k.toFixed(1)}k`;
}

function formatSalaryOffer(job: Job): string | null {
  if (!job.salaryMin && !job.salaryMax) return null;
  const range =
    job.salaryMin === job.salaryMax
      ? fmtK(job.salaryMin!)
      : [job.salaryMin && fmtK(job.salaryMin), job.salaryMax && fmtK(job.salaryMax)]
          .filter(Boolean)
          .join("-");
  const currency = job.salaryCurrency ?? "";
  const type = job.salaryType ?? null;
  const period = job.salaryPeriod ? (job.salaryPeriod === "monthly" ? "mo" : "yr") : null;
  const contract = job.contractType ? job.contractType.toUpperCase() : null;
  return [
    `${range} ${currency}`.trim(),
    type,
    period ? `/${period}` : null,
    contract,
  ]
    .filter(Boolean)
    .join(" ")
    .replace(/ \//, "/");
}

function formatSalaryNet(job: Job): string | null {
  if (!job.salaryNetMonthly) return null;
  return `~${fmtK(job.salaryNetMonthly)} ${job.salaryNetCurrency ?? "EUR"}/mo net`;
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

  const salaryNet = formatSalaryNet(job);
  const salaryOffer = formatSalaryOffer(job);
  const salaryDisplay = salaryNet ?? salaryOffer;

  const updated = new Date(job.updatedAt).toLocaleDateString();

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <Card
        className="mb-2 cursor-pointer hover:shadow-md transition-shadow"
        onClick={onClick}
      >
        <CardContent className="p-3 space-y-1">
          <div className="flex items-start gap-1">
            <div {...listeners} className="cursor-grab active:cursor-grabbing mt-0.5 text-muted-foreground/40 hover:text-muted-foreground select-none" title="Drag">
              &#x2630;
            </div>
            <div className="font-semibold text-sm">{job.company}</div>
          </div>
          <div className="text-sm text-muted-foreground">{job.position}</div>
          {job.recruiterName && (
            <div className="text-xs text-muted-foreground">{job.recruiterName}</div>
          )}
          {job.location && (
            <div className="text-xs text-muted-foreground">{job.location}</div>
          )}
          {salaryDisplay && (
            <div className="text-xs font-medium">{salaryDisplay}</div>
          )}
          {job.nextStep && (
            <div className="text-xs text-muted-foreground">Next: {job.nextStep}</div>
          )}
          {job.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              {job.tags.map((tag) => (
                <TagBadge key={tag.id} name={tag.name} />
              ))}
            </div>
          )}
          {job.notes && (
            <div className="text-xs text-muted-foreground italic">
              {job.notes.split("\n")[0].slice(0, 60)}
            </div>
          )}
          <div className="text-xs text-muted-foreground pt-1">{updated}</div>
        </CardContent>
      </Card>
    </div>
  );
}
