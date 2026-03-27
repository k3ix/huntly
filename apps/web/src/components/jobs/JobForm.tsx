import { useState } from "react";
import { JOB_FORMATS } from "@huntly/shared";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateJob } from "@/api/queries";

interface JobFormProps {
  open: boolean;
  onClose: () => void;
}

export function JobForm({ open, onClose }: JobFormProps) {
  const createJob = useCreateJob();

  const [company, setCompany] = useState("");
  const [position, setPosition] = useState("");
  const [recruiterName, setRecruiterName] = useState("");
  const [url, setUrl] = useState("");
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");
  const [salaryCurrency, setSalaryCurrency] = useState("USD");
  const [location, setLocation] = useState("");
  const [format, setFormat] = useState<string>("");
  const [tags, setTags] = useState("");
  const [notes, setNotes] = useState("");

  function reset() {
    setCompany("");
    setPosition("");
    setRecruiterName("");
    setUrl("");
    setSalaryMin("");
    setSalaryMax("");
    setSalaryCurrency("USD");
    setLocation("");
    setFormat("");
    setTags("");
    setNotes("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!company || !position) return;

    await createJob.mutateAsync({
      company,
      position,
      recruiterName: recruiterName || null,
      url: url || null,
      salaryMin: salaryMin ? Number(salaryMin) : null,
      salaryMax: salaryMax ? Number(salaryMax) : null,
      salaryCurrency: salaryCurrency || null,
      location: location || null,
      format: format || null,
      tags: tags
        ? tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : [],
      notes: notes || null,
    });

    reset();
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Job</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-medium mb-1 block">Company *</label>
            <Input
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Acme Corp"
              required
            />
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block">Position *</label>
            <Input
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              placeholder="Senior Engineer"
              required
            />
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block">Recruiter Name</label>
            <Input
              value={recruiterName}
              onChange={(e) => setRecruiterName(e.target.value)}
              placeholder="Jane Smith"
            />
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block">URL</label>
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-xs font-medium mb-1 block">Salary Min</label>
              <Input
                type="number"
                value={salaryMin}
                onChange={(e) => setSalaryMin(e.target.value)}
                placeholder="100000"
              />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Salary Max</label>
              <Input
                type="number"
                value={salaryMax}
                onChange={(e) => setSalaryMax(e.target.value)}
                placeholder="150000"
              />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Currency</label>
              <Input
                value={salaryCurrency}
                onChange={(e) => setSalaryCurrency(e.target.value)}
                placeholder="USD"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block">Location</label>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="New York, NY"
            />
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block">Format</label>
            <Select value={format} onValueChange={(v) => setFormat(v ?? "")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select format" />
              </SelectTrigger>
              <SelectContent>
                {JOB_FORMATS.map((f) => (
                  <SelectItem key={f} value={f}>
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block">Tags (comma-separated)</label>
            <Input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="react, typescript, remote"
            />
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block">Notes</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any notes..."
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={createJob.isPending}>
              {createJob.isPending ? "Saving..." : "Add Job"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
