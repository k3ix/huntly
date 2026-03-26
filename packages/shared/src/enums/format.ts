import { z } from "zod";

export const JOB_FORMATS = ["remote", "hybrid", "office"] as const;

export const jobFormatSchema = z.enum(JOB_FORMATS);

export type JobFormat = z.infer<typeof jobFormatSchema>;
