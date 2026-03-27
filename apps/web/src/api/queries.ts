import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Placeholder -- will use Eden client once types are wired
const API_BASE = "/api";

async function fetchJson(path: string) {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

export function useJobs(params?: { status?: string; search?: string }) {
  const query = new URLSearchParams();
  if (params?.status) query.set("status", params.status);
  if (params?.search) query.set("search", params.search);
  const qs = query.toString();
  return useQuery({
    queryKey: ["jobs", params],
    queryFn: () => fetchJson(`/jobs${qs ? `?${qs}` : ""}`),
  });
}

export function useJob(id: number) {
  return useQuery({
    queryKey: ["jobs", id],
    queryFn: () => fetchJson(`/jobs/${id}`),
    enabled: id > 0,
  });
}

export function useJobStats() {
  return useQuery({
    queryKey: ["jobs", "stats"],
    queryFn: () => fetchJson("/jobs/stats"),
  });
}

export function useCreateJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      fetch(`${API_BASE}/jobs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["jobs"] }),
  });
}

export function useUpdateJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: number } & Record<string, unknown>) =>
      fetch(`${API_BASE}/jobs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["jobs"] }),
  });
}

export function useDeleteJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      fetch(`${API_BASE}/jobs/${id}`, { method: "DELETE" }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["jobs"] }),
  });
}

export function useTags() {
  return useQuery({
    queryKey: ["tags"],
    queryFn: () => fetchJson("/tags"),
  });
}
