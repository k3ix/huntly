import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "./client";

export function useJobs(params?: { status?: string; search?: string }) {
  return useQuery({
    queryKey: ["jobs", params],
    queryFn: async () => {
      const { data, error } = await client.api.jobs.get({ query: params ?? {} });
      if (error) throw error;
      return data;
    },
  });
}

export function useJob(id: number) {
  return useQuery({
    queryKey: ["jobs", id],
    queryFn: async () => {
      const { data, error } = await client.api.jobs({ id }).get();
      if (error) throw error;
      if (!data || "error" in data) throw new Error("Job not found");
      return data;
    },
    enabled: id > 0,
  });
}

export function useJobStats() {
  return useQuery({
    queryKey: ["jobs", "stats"],
    queryFn: async () => {
      const { data, error } = await client.api.jobs.stats.get();
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Record<string, unknown>) => {
      const { data, error } = await client.api.jobs.post(input);
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["jobs"] }),
  });
}

export function useUpdateJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: { id: number } & Record<string, unknown>) => {
      const { data, error } = await client.api.jobs({ id }).patch(input);
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["jobs"] }),
  });
}

export function useDeleteJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data, error } = await client.api.jobs({ id }).delete();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["jobs"] }),
  });
}

export function useTags() {
  return useQuery({
    queryKey: ["tags"],
    queryFn: async () => {
      const { data, error } = await client.api.tags.get();
      if (error) throw error;
      return data;
    },
  });
}
