import { z } from "zod";

export const JOB_SOURCES = ["linkedin_inbound", "applied", "referral", "other"] as const;

export const jobSourceSchema = z.enum(JOB_SOURCES);

export type JobSource = z.infer<typeof jobSourceSchema>;
