import { useState, useEffect } from "react";
import { JOB_STATUSES } from "@huntly/shared";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TagBadge } from "@/components/tags/TagBadge";
import { useJob, useUpdateJob, useDeleteJob } from "@/api/queries";

interface JobDetailProps {
  jobId: number | null;
  onClose: () => void;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function JobDetail({ jobId, onClose }: JobDetailProps) {
  const { data: job } = useJob(jobId ?? 0);
  const updateJob = useUpdateJob();
  const deleteJob = useDeleteJob();

  const [notes, setNotes] = useState("");
  const [notesDirty, setNotesDirty] = useState(false);

  useEffect(() => {
    if (job) {
      setNotes(job.notes ?? "");
      setNotesDirty(false);
    }
  }, [job]);

  function handleStatusChange(status: string) {
    if (!job) return;
    updateJob.mutate({ id: job.id, status });
  }

  function handleSaveNotes() {
    if (!job) return;
    updateJob.mutate({ id: job.id, notes });
    setNotesDirty(false);
  }

  async function handleDelete() {
    if (!job) return;
    if (!confirm(`Delete "${job.company} - ${job.position}"?`)) return;
    await deleteJob.mutateAsync(job.id);
    onClose();
  }

  const salary =
    job?.salaryMin || job?.salaryMax
      ? [
          job.salaryMin && `${Math.round(job.salaryMin / 1000)}k`,
          job.salaryMax && `${Math.round(job.salaryMax / 1000)}k`,
        ]
          .filter(Boolean)
          .join("-") +
        ` ${job.salaryCurrency ?? ""}`
      : null;

  return (
    <Sheet open={jobId !== null} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="overflow-y-auto w-full sm:max-w-lg">
        {job ? (
          <>
            <SheetHeader>
              <SheetTitle>{job.company}</SheetTitle>
              <p className="text-sm text-muted-foreground">{job.position}</p>
            </SheetHeader>

            <div className="px-4 space-y-4">
              <div>
                <label className="text-xs text-muted-foreground">Status</label>
                <Select value={job.status} onValueChange={(v) => v && handleStatusChange(v)}>
                  <SelectTrigger className="w-full mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {JOB_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {capitalize(s)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {job.recruiterName && (
                <div>
                  <label className="text-xs text-muted-foreground">Recruiter</label>
                  <p className="text-sm mt-0.5">{job.recruiterName}</p>
                </div>
              )}

              {salary && (
                <div>
                  <label className="text-xs text-muted-foreground">Salary</label>
                  <p className="text-sm mt-0.5">{salary.trim()}</p>
                </div>
              )}

              {job.location && (
                <div>
                  <label className="text-xs text-muted-foreground">Location</label>
                  <p className="text-sm mt-0.5">{job.location}</p>
                </div>
              )}

              {job.format && (
                <div>
                  <label className="text-xs text-muted-foreground">Format</label>
                  <p className="text-sm mt-0.5">{capitalize(job.format)}</p>
                </div>
              )}

              {job.url && (
                <div>
                  <label className="text-xs text-muted-foreground">URL</label>
                  <a
                    href={job.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-primary hover:underline block mt-0.5 truncate"
                  >
                    {job.url}
                  </a>
                </div>
              )}

              {job.tags?.length > 0 && (
                <div>
                  <label className="text-xs text-muted-foreground">Tags</label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {job.tags.map((tag: { id: number; name: string }) => (
                      <TagBadge key={tag.id} name={tag.name} />
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs text-muted-foreground">Notes</label>
                <Textarea
                  className="mt-1"
                  rows={4}
                  value={notes}
                  onChange={(e) => {
                    setNotes(e.target.value);
                    setNotesDirty(true);
                  }}
                  placeholder="Add notes..."
                />
                {notesDirty && (
                  <Button size="sm" className="mt-1" onClick={handleSaveNotes}>
                    Save notes
                  </Button>
                )}
              </div>

              <div className="text-xs text-muted-foreground space-y-0.5 pt-2">
                <p>Created: {new Date(job.createdAt).toLocaleDateString()}</p>
                <p>Updated: {new Date(job.updatedAt).toLocaleDateString()}</p>
              </div>

              <div className="pt-2">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                  disabled={deleteJob.isPending}
                >
                  Delete Job
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="p-4 text-sm text-muted-foreground">Loading...</div>
        )}
      </SheetContent>
    </Sheet>
  );
}
