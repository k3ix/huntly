import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const jobs = sqliteTable("jobs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  company: text("company").notNull(),
  position: text("position").notNull(),
  url: text("url"),
  recruiterName: text("recruiter_name"),
  status: text("status").notNull().default("contacted"),
  salaryMin: integer("salary_min"),
  salaryMax: integer("salary_max"),
  salaryCurrency: text("salary_currency"),
  salaryPeriod: text("salary_period"),
  salaryType: text("salary_type"),
  salaryAsk: integer("salary_ask"),
  salaryAskCurrency: text("salary_ask_currency"),
  salaryAskPeriod: text("salary_ask_period"),
  salaryAskType: text("salary_ask_type"),
  salaryFinal: integer("salary_final"),
  salaryFinalCurrency: text("salary_final_currency"),
  salaryNetMonthly: integer("salary_net_monthly"),
  salaryNetCurrency: text("salary_net_currency"),
  location: text("location"),
  format: text("format"),
  notes: text("notes"),
  contractType: text("contract_type"),
  source: text("source"),
  nextStep: text("next_step"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

export const tags = sqliteTable("tags", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
});

export const jobTags = sqliteTable("job_tags", {
  jobId: integer("job_id").notNull().references(() => jobs.id, { onDelete: "cascade" }),
  tagId: integer("tag_id").notNull().references(() => tags.id, { onDelete: "cascade" }),
});
