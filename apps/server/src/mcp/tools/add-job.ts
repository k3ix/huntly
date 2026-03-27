import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "../../db";
import { jobs, tags, jobTags } from "../../db/schema";

export const def = {
  name: "add_job",
  description:
    "Add a new job to the tracker. Provide structured fields extracted from recruiter messages.",
  schema: {
    company: z.string().describe("Company name"),
    position: z.string().describe("Job position/title"),
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
  company: string;
  position: string;
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
  const jobData = {
    company: input.company,
    position: input.position,
    url: input.url ?? null,
    recruiterName: input.recruiterName ?? null,
    status: (input.status ?? "contacted") as string,
    salaryMin: input.salaryMin ?? null,
    salaryMax: input.salaryMax ?? null,
    salaryCurrency: input.salaryCurrency ?? null,
    location: input.location ?? null,
    format: input.format ?? null,
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
        text: `Job added!\n\nID: ${job.id}\nCompany: ${job.company}\nPosition: ${job.position}\nStatus: ${job.status}\nSalary: ${job.salaryMin ? `${job.salaryCurrency ?? ""} ${job.salaryMin}-${job.salaryMax}` : "not specified"}\nFormat: ${job.format ?? "not specified"}\nLocation: ${job.location ?? "not specified"}\nTags: ${job.tags.map((t) => t.name).join(", ") || "none"}`,
      },
    ],
  };
}
