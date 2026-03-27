import { z } from "zod";
import { eq, sql } from "drizzle-orm";
import { db } from "../../db";
import { jobs, tags, jobTags } from "../../db/schema";

export const def = {
  name: "update_job",
  description: "Update fields of an existing job by ID.",
  schema: {
    id: z.number().int().positive().describe("Job ID to update"),
    company: z.string().optional().describe("Company name"),
    position: z.string().optional().describe("Job position/title"),
    url: z.string().url().nullable().optional().describe("Job URL"),
    recruiterName: z.string().nullable().optional().describe("Recruiter name"),
    status: z
      .enum(["contacted", "reviewing", "talking", "interview", "offer", "declined", "ghosted"])
      .optional()
      .describe("Job status"),
    salaryMin: z.number().int().positive().nullable().optional().describe("Minimum salary"),
    salaryMax: z.number().int().positive().nullable().optional().describe("Maximum salary"),
    salaryCurrency: z.string().max(3).nullable().optional().describe("Salary currency code"),
    location: z.string().nullable().optional().describe("Job location"),
    format: z.enum(["remote", "hybrid", "office"]).nullable().optional().describe("Work format"),
    notes: z.string().nullable().optional().describe("Additional notes"),
    tags: z.array(z.string()).optional().describe("Replace all tags with these names"),
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
  id: number;
  company?: string;
  position?: string;
  url?: string | null;
  recruiterName?: string | null;
  status?: "contacted" | "reviewing" | "talking" | "interview" | "offer" | "declined" | "ghosted";
  salaryMin?: number | null;
  salaryMax?: number | null;
  salaryCurrency?: string | null;
  location?: string | null;
  format?: "remote" | "hybrid" | "office" | null;
  notes?: string | null;
  tags?: string[];
}) {
  const { id, tags: tagNames, ...fields } = input;

  const existing = db.select().from(jobs).where(eq(jobs.id, id)).get();
  if (!existing) {
    return {
      content: [
        {
          type: "text" as const,
          text: `Error: Job with ID ${id} not found.`,
        },
      ],
      isError: true,
    };
  }

  if (Object.keys(fields).length > 0) {
    db.update(jobs)
      .set({ ...fields, updatedAt: sql`(datetime('now'))` })
      .where(eq(jobs.id, id))
      .run();
  }

  if (tagNames !== undefined) {
    db.delete(jobTags).where(eq(jobTags.jobId, id)).run();
    if (tagNames.length > 0) {
      const tagIds = await upsertTags(tagNames);
      for (const tagId of tagIds) {
        db.insert(jobTags).values({ jobId: id, tagId }).run();
      }
    }
  }

  const updated = db.select().from(jobs).where(eq(jobs.id, id)).get()!;
  const jobTagRows = db
    .select({ id: tags.id, name: tags.name })
    .from(jobTags)
    .innerJoin(tags, eq(jobTags.tagId, tags.id))
    .where(eq(jobTags.jobId, id))
    .all();

  const job = { ...updated, tags: jobTagRows };

  return {
    content: [
      {
        type: "text" as const,
        text: `Job #${job.id} updated.\n\nCompany: ${job.company}\nPosition: ${job.position}\nStatus: ${job.status}\nSalary: ${job.salaryMin ? `${job.salaryCurrency ?? ""} ${job.salaryMin}-${job.salaryMax}` : "not specified"}\nFormat: ${job.format ?? "not specified"}\nLocation: ${job.location ?? "not specified"}\nTags: ${job.tags.map((t) => t.name).join(", ") || "none"}`,
      },
    ],
  };
}
