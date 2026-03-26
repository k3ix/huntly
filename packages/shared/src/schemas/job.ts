import { z } from "zod";
import { jobStatusSchema } from "../enums/status";
import { jobFormatSchema } from "../enums/format";

export const createJobSchema = z.object({
  company: z.string().min(1),
  position: z.string().min(1),
  url: z.string().url().nullable().optional(),
  recruiterName: z.string().nullable().optional(),
  status: jobStatusSchema.default("contacted"),
  salaryMin: z.number().int().positive().nullable().optional(),
  salaryMax: z.number().int().positive().nullable().optional(),
  salaryCurrency: z.string().max(3).nullable().optional(),
  location: z.string().nullable().optional(),
  format: jobFormatSchema.nullable().optional(),
  notes: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
});

export const updateJobSchema = createJobSchema.partial();

export const jobResponseSchema = z.object({
  id: z.number(),
  company: z.string(),
  position: z.string(),
  url: z.string().nullable(),
  recruiterName: z.string().nullable(),
  status: jobStatusSchema,
  salaryMin: z.number().nullable(),
  salaryMax: z.number().nullable(),
  salaryCurrency: z.string().nullable(),
  location: z.string().nullable(),
  format: jobFormatSchema.nullable(),
  notes: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  tags: z.array(z.object({ id: z.number(), name: z.string() })),
});

export type CreateJob = z.infer<typeof createJobSchema>;
export type UpdateJob = z.infer<typeof updateJobSchema>;
export type JobResponse = z.infer<typeof jobResponseSchema>;
