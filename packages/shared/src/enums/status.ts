import { z } from "zod";

export const JOB_STATUSES = [
  "contacted",
  "reviewing",
  "talking",
  "interview",
  "offer",
  "declined",
  "ghosted",
] as const;

export const jobStatusSchema = z.enum(JOB_STATUSES);

export type JobStatus = z.infer<typeof jobStatusSchema>;

export const STATUS_ORDER: Record<JobStatus, number> = {
  contacted: 0,
  reviewing: 1,
  talking: 2,
  interview: 3,
  offer: 4,
  declined: 5,
  ghosted: 6,
};
