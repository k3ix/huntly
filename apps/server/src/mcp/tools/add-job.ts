import { z } from "zod";
import { eq, sql } from "drizzle-orm";
import { db } from "../../db";
import { jobs, tags, jobTags } from "../../db/schema";
import { parseRecruiterMessage } from "../parser";

export const def = {
  name: "add_job",
  description:
    "Add a new job to the tracker. Accepts raw recruiter message text (parsed automatically) and/or structured fields. Structured fields override parsed values.",
  schema: {
    rawText: z
      .string()
      .optional()
      .describe("Raw recruiter message to parse for job details"),
    company: z.string().optional().describe("Company name (overrides parsed)"),
    position: z.string().optional().describe("Job position/title (overrides parsed)"),
    url: z.string().url().optional().describe("Job URL"),
    recruiterName: z.string().optional().describe("Recruiter name"),
    status: z
      .enum(["contacted", "reviewing", "talking", "interview", "offer", "declined", "ghosted"])
      .optional()
      .default("contacted")
      .describe("Job status"),
    salaryMin: z.number().int().positive().optional().describe("Minimum salary"),
    salaryMax: z.number().int().positive().optional().describe("Maximum salary"),
    salaryCurrency: z.string().max(3).optional().describe("Salary currency code (e.g. USD)"),
    location: z.string().optional().describe("Job location"),
    format: z.enum(["remote", "hybrid", "office"]).optional().describe("Work format"),
    notes: z.string().optional().describe("Additional notes"),
    tags: z.array(z.string()).optional().describe("Tag names to associate with the job"),
  },
};

async function upsertTags(tagNames: string[]): Promise<number[]> {
  const tagIds: number[] = [];
  for (const name of tagNames) {
    const existing = db.select().from(tags).where(eq(tags.name, name)).get();
    if (existing) {
      tagIds.push(existing.id);
    } else {
      tagIds.push(
        db.insert(tags).values({ name }).returning({ id: tags.id }).get().id
      );
    }
  }
  return tagIds;
}

export async function handler(input: {
  rawText?: string;
  company?: string;
  position?: string;
  url?: string;
  recruiterName?: string;
  status?: "contacted" | "reviewing" | "talking" | "interview" | "offer" | "declined" | "ghosted";
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  location?: string;
  format?: "remote" | "hybrid" | "office";
  notes?: string;
  tags?: string[];
}) {
  const parsed = input.rawText ? parseRecruiterMessage(input.rawText) : null;

  const company = input.company ?? parsed?.company ?? null;
  const position = input.position ?? parsed?.position ?? null;

  if (!company || !position) {
    return {
      content: [
        {
          type: "text" as const,
          text: `Error: company and position are required. Parsed from text: company=${parsed?.company ?? "null"}, position=${parsed?.position ?? "null"}. Please provide them explicitly.`,
        },
      ],
      isError: true,
    };
  }

  const jobData = {
    company,
    position,
    url: input.url ?? null,
    recruiterName: input.recruiterName ?? null,
    status: (input.status ?? "contacted") as string,
    salaryMin: input.salaryMin ?? parsed?.salaryMin ?? null,
    salaryMax: input.salaryMax ?? parsed?.salaryMax ?? null,
    salaryCurrency: input.salaryCurrency ?? parsed?.salaryCurrency ?? null,
    location: input.location ?? parsed?.location ?? null,
    format: input.format ?? (parsed?.format as "remote" | "hybrid" | "office" | null) ?? null,
    notes: input.notes ?? null,
  };

  const inserted = db.insert(jobs).values(jobData).returning().get();

  const tagNames = input.tags ?? [];
  if (tagNames.length) {
    const tagIds = await upsertTags(tagNames);
    for (const tagId of tagIds) {
      db.insert(jobTags).values({ jobId: inserted.id, tagId }).run();
    }
  }

  const jobTagRows = db
    .select({ id: tags.id, name: tags.name })
    .from(jobTags)
    .innerJoin(tags, eq(jobTags.tagId, tags.id))
    .where(eq(jobTags.jobId, inserted.id))
    .all();

  const job = { ...inserted, tags: jobTagRows };

  return {
    content: [
      {
        type: "text" as const,
        text: `Job added successfully!\n\nID: ${job.id}\nCompany: ${job.company}\nPosition: ${job.position}\nStatus: ${job.status}\nSalary: ${job.salaryMin ? `${job.salaryCurrency ?? ""} ${job.salaryMin}-${job.salaryMax}` : "not specified"}\nFormat: ${job.format ?? "not specified"}\nLocation: ${job.location ?? "not specified"}\nTags: ${job.tags.map((t) => t.name).join(", ") || "none"}`,
      },
    ],
  };
}
