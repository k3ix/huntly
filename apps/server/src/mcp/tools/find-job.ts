import { z } from "zod";
import { eq, like, or, sql } from "drizzle-orm";
import { db } from "../../db";
import { jobs, tags, jobTags } from "../../db/schema";

export const def = {
  name: "find_job",
  description: "Search for jobs by text across company, position, and recruiter name.",
  schema: {
    query: z.string().min(1).describe("Search text to match against company, position, or recruiter name"),
  },
};

export async function handler(input: { query: string }) {
  const pattern = `%${input.query}%`;
  const rows = db
    .select()
    .from(jobs)
    .where(
      or(
        like(jobs.company, pattern),
        like(jobs.position, pattern),
        like(jobs.recruiterName, pattern)
      )!
    )
    .all();

  if (rows.length === 0) {
    return {
      content: [
        {
          type: "text" as const,
          text: `No jobs found matching "${input.query}".`,
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
    const recruiter = job.recruiterName ? ` (recruiter: ${job.recruiterName})` : "";
    return `#${job.id} ${job.company} - ${job.position} (${job.status})${salary}${recruiter}${tagStr}`;
  });

  return {
    content: [
      {
        type: "text" as const,
        text: `Found ${rows.length} job(s) matching "${input.query}":\n\n${lines.join("\n")}`,
      },
    ],
  };
}
