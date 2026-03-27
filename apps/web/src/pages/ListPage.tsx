import { useState } from "react";
import { JOB_STATUSES, JOB_FORMATS } from "@huntly/shared";
import { Header } from "@/components/layout/Header";
import { JobDetail } from "@/components/jobs/JobDetail";
import { JobForm } from "@/components/jobs/JobForm";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TagBadge } from "@/components/tags/TagBadge";
import { useJobs } from "@/api/queries";

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function fmtK(n: number): string {
  const k = n / 1000;
  return Number.isInteger(k) ? `${k}k` : `${k.toFixed(1)}k`;
}

interface SalaryFields {
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string | null;
  salaryPeriod?: string | null;
  salaryType?: string | null;
  contractType?: string | null;
  salaryAsk?: number | null;
  salaryAskCurrency?: string | null;
  salaryAskPeriod?: string | null;
  salaryAskType?: string | null;
  salaryFinal?: number | null;
  salaryFinalCurrency?: string | null;
  salaryNetMonthly?: number | null;
  salaryNetCurrency?: string | null;
}


export function ListPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [formatFilter, setFormatFilter] = useState("all");
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);

  const { data: allJobs = [] } = useJobs({ search: search || undefined });

  const jobs = allJobs
    .filter((job: { status: string; format: string | null }) => {
      if (statusFilter !== "all" && job.status !== statusFilter) return false;
      if (formatFilter !== "all" && job.format !== formatFilter) return false;
      return true;
    })
    .sort(
      (a: { updatedAt: string }, b: { updatedAt: string }) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );

  return (
    <div className="flex flex-col h-screen">
      <Header onAddJob={() => setShowForm(true)} />
      <main className="flex-1 overflow-auto p-4">
        <div className="flex gap-2 mb-4">
          <Input
            className="max-w-xs"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "all")}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {JOB_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {capitalize(s)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={formatFilter} onValueChange={(v) => setFormatFilter(v ?? "all")}>
            <SelectTrigger>
              <SelectValue placeholder="Format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All formats</SelectItem>
              {JOB_FORMATS.map((f) => (
                <SelectItem key={f} value={f}>
                  {capitalize(f)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-3 py-2 font-medium">Company</th>
                <th className="text-left px-3 py-2 font-medium">Position</th>
                <th className="text-left px-3 py-2 font-medium">Status</th>
                <th className="text-left px-3 py-2 font-medium">Offer</th>
                <th className="text-left px-3 py-2 font-medium">Ask</th>
                <th className="text-left px-3 py-2 font-medium">Final</th>
                <th className="text-left px-3 py-2 font-medium">Net</th>
                <th className="text-left px-3 py-2 font-medium">Format</th>
                <th className="text-left px-3 py-2 font-medium">Tags</th>
                <th className="text-left px-3 py-2 font-medium">Updated</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map(
                (job: SalaryFields & {
                  id: number;
                  company: string;
                  position: string;
                  status: string;
                  format: string | null;
                  updatedAt: string;
                  tags: { id: number; name: string }[];
                }) => (
                  <tr
                    key={job.id}
                    className="border-b last:border-0 hover:bg-muted/30 cursor-pointer"
                    onClick={() => setSelectedJobId(job.id)}
                  >
                    <td className="px-3 py-2 font-medium">{job.company}</td>
                    <td className="px-3 py-2 text-muted-foreground">{job.position}</td>
                    <td className="px-3 py-2">{capitalize(job.status)}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {(() => {
                        if (!job.salaryMin && !job.salaryMax) return "-";
                        const range = job.salaryMin === job.salaryMax
                          ? fmtK(job.salaryMin!)
                          : [job.salaryMin && fmtK(job.salaryMin), job.salaryMax && fmtK(job.salaryMax)].filter(Boolean).join("-");
                        const period = job.salaryPeriod === "monthly" ? "/mo" : job.salaryPeriod === "yearly" ? "/yr" : "";
                        return [range, job.salaryCurrency, job.salaryType, period, job.contractType?.toUpperCase()].filter(Boolean).join(" ");
                      })()}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {job.salaryAsk
                        ? (() => {
                            const period = job.salaryAskPeriod === "monthly" ? "/mo" : job.salaryAskPeriod === "yearly" ? "/yr" : "";
                            return [fmtK(job.salaryAsk), job.salaryAskCurrency, job.salaryAskType, period].filter(Boolean).join(" ");
                          })()
                        : "-"}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {job.salaryFinal
                        ? `${fmtK(job.salaryFinal)} ${job.salaryFinalCurrency ?? ""}`
                        : "-"}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap font-medium">
                      {job.salaryNetMonthly
                        ? `~${fmtK(job.salaryNetMonthly)} ${job.salaryNetCurrency ?? "EUR"}/mo`
                        : "-"}
                    </td>
                    <td className="px-3 py-2">
                      {job.format ? capitalize(job.format) : "-"}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-1">
                        {job.tags.map((tag) => (
                          <TagBadge key={tag.id} name={tag.name} />
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {new Date(job.updatedAt).toLocaleDateString()}
                    </td>
                  </tr>
                )
              )}
              {jobs.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-3 py-8 text-center text-muted-foreground">
                    No jobs found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
      <JobDetail jobId={selectedJobId} onClose={() => setSelectedJobId(null)} />
      <JobForm open={showForm} onClose={() => setShowForm(false)} />
    </div>
  );
}
