import { z } from "zod";

export const SALARY_PERIODS = ["monthly", "yearly"] as const;
export const SALARY_TYPES = ["gross", "net"] as const;

export const salaryPeriodSchema = z.enum(SALARY_PERIODS);
export const salaryTypeSchema = z.enum(SALARY_TYPES);

export type SalaryPeriod = z.infer<typeof salaryPeriodSchema>;
export type SalaryType = z.infer<typeof salaryTypeSchema>;
