import { z } from "zod";
import { eq, like, sql } from "drizzle-orm";
import { db } from "../../db";
import { jobs, tags, jobTags } from "../../db/schema";

export const def = {
  name: "list_jobs",
  description: "List jobs from the tracker with optional filters by status or tag.",
  schema: {
    status: z
      .enum(["contacted", "reviewing", "talking", "interview", "offer", "declined", "ghosted"])
      .optional()
      .describe("Filter by job status"),
    tag: z.string().optional().describe("Filter by tag name"),
  },
};

export async function handler(input: {
  status?: "contacted" | "reviewing" | "talking" | "interview" | "offer" | "declined" | "ghosted";
  tag?: string;
}) {
  let rows = db.select().from(jobs).all();

  if (input.status) {
    rows = db.select().from(jobs).where(eq(jobs.status, input.status)).all();
  }

  if (input.tag) {
    // Filter by tag: get job IDs that have this tag
    const tagRow = db.select().from(tags).where(eq(tags.name, input.tag)).get();
    if (!tagRow) {
      return {
        content: [
          {
            type: "text" as const,
            text: `No jobs found with tag "${input.tag}".`,
          },
        ],
      };
    }
    const jobIdsWithTag = db
      .select({ jobId: jobTags.jobId })
      .from(jobTags)
      .where(eq(jobTags.tagId, tagRow.id))
      .all()
      .map((r) => r.jobId);

    rows = rows.filter((r) => jobIdsWithTag.includes(r.id));
  }

  if (rows.length === 0) {
    return {
      content: [
        {
          type: "text" as const,
          text: "No jobs found.",
        },
      ],
    };
  }

  const jobsWithTags = rows.map((row) => {
    const jobTagRows = db
      .select({ id: tags.id, name: tags.name })
      .from(jobTags)
      .innerJoin(tags, eq(jobTags.tagId, tags.id))
      .where(eq(jobTags.jobId, row.id))
      .all();
    return { ...row, tags: jobTagRows };
  });

  const lines = jobsWithTags.map((job) => {
    const salary = job.salaryMin
      ? ` | ${job.salaryCurrency ?? ""}${job.salaryMin}-${job.salaryMax}`
      : "";
    const tagStr = job.tags.length ? ` [${job.tags.map((t) => t.name).join(", ")}]` : "";
    return `#${job.id} ${job.company} - ${job.position} (${job.status})${salary}${tagStr}`;
  });

  return {
    content: [
      {
        type: "text" as const,
        text: `Found ${rows.length} job(s):\n\n${lines.join("\n")}`,
      },
    ],
  };
}
