import { useState } from "react";
import { JOB_FORMATS, CONTRACT_TYPES, JOB_SOURCES, SALARY_PERIODS, SALARY_TYPES } from "@huntly/shared";
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
  const [salaryCurrency, setSalaryCurrency] = useState("PLN");
  const [salaryPeriod, setSalaryPeriod] = useState<string>("");
  const [salaryType, setSalaryType] = useState<string>("");
  const [salaryAsk, setSalaryAsk] = useState("");
  const [salaryAskCurrency, setSalaryAskCurrency] = useState("EUR");
  const [location, setLocation] = useState("");
  const [format, setFormat] = useState<string>("");
  const [tags, setTags] = useState("");
  const [notes, setNotes] = useState("");
  const [contractType, setContractType] = useState<string>("");
  const [source, setSource] = useState<string>("");
  const [nextStep, setNextStep] = useState("");

  function reset() {
    setCompany("");
    setPosition("");
    setRecruiterName("");
    setUrl("");
    setSalaryMin("");
    setSalaryMax("");
    setSalaryCurrency("PLN");
    setSalaryPeriod("");
    setSalaryType("");
    setSalaryAsk("");
    setSalaryAskCurrency("EUR");
    setLocation("");
    setFormat("");
    setTags("");
    setNotes("");
    setContractType("");
    setSource("");
    setNextStep("");
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
      salaryPeriod: (salaryPeriod as "monthly" | "yearly") || null,
      salaryType: (salaryType as "gross" | "net") || null,
      salaryAsk: salaryAsk ? Number(salaryAsk) : null,
      salaryAskCurrency: salaryAskCurrency || null,
      location: location || null,
      format: format || null,
      tags: tags
        ? tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : [],
      notes: notes || null,
      contractType: contractType || null,
      source: source || null,
      nextStep: nextStep || null,
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
                placeholder="10000"
              />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Salary Max</label>
              <Input
                type="number"
                value={salaryMax}
                onChange={(e) => setSalaryMax(e.target.value)}
                placeholder="15000"
              />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Currency</label>
              <Input
                value={salaryCurrency}
                onChange={(e) => setSalaryCurrency(e.target.value)}
                placeholder="PLN"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-medium mb-1 block">Period</label>
              <Select value={salaryPeriod} onValueChange={(v) => setSalaryPeriod(v ?? "")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Monthly/Yearly" />
                </SelectTrigger>
                <SelectContent>
                  {SALARY_PERIODS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Type</label>
              <Select value={salaryType} onValueChange={(v) => setSalaryType(v ?? "")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Gross/Net" />
                </SelectTrigger>
                <SelectContent>
                  {SALARY_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-medium mb-1 block">My Ask</label>
              <Input
                type="number"
                value={salaryAsk}
                onChange={(e) => setSalaryAsk(e.target.value)}
                placeholder="5000"
              />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Ask Currency</label>
              <Input
                value={salaryAskCurrency}
                onChange={(e) => setSalaryAskCurrency(e.target.value)}
                placeholder="EUR"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block">Location</label>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Warsaw, Poland"
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
            <label className="text-xs font-medium mb-1 block">Contract Type</label>
            <Select value={contractType} onValueChange={(v) => setContractType(v ?? "")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select contract type" />
              </SelectTrigger>
              <SelectContent>
                {CONTRACT_TYPES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c.toUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block">Source</label>
            <Select value={source} onValueChange={(v) => setSource(v ?? "")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="How did you find this?" />
              </SelectTrigger>
              <SelectContent>
                {JOB_SOURCES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block">Next Step</label>
            <Input
              value={nextStep}
              onChange={(e) => setNextStep(e.target.value)}
              placeholder="e.g. reply to recruiter, schedule interview"
            />
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
