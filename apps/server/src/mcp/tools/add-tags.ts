import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { db } from "../../db";
import { jobs, tags, jobTags } from "../../db/schema";

export const def = {
  name: "add_tags",
  description: "Add one or more tags to a job by job ID.",
  schema: {
    jobId: z.number().int().positive().describe("Job ID to add tags to"),
    tags: z.array(z.string().min(1)).min(1).describe("Tag names to add"),
  },
};

export async function handler(input: { jobId: number; tags: string[] }) {
  const job = db.select().from(jobs).where(eq(jobs.id, input.jobId)).get();
  if (!job) {
    return {
      content: [
        {
          type: "text" as const,
          text: `Error: Job with ID ${input.jobId} not found.`,
        },
      ],
      isError: true,
    };
  }

  const added: string[] = [];
  const skipped: string[] = [];

  for (const name of input.tags) {
    let tag = db.select().from(tags).where(eq(tags.name, name)).get();
    if (!tag) {
      tag = db.insert(tags).values({ name }).returning().get();
    }
    const alreadyLinked = db
      .select()
      .from(jobTags)
      .where(and(eq(jobTags.jobId, input.jobId), eq(jobTags.tagId, tag.id)))
      .get();
    if (!alreadyLinked) {
      db.insert(jobTags).values({ jobId: input.jobId, tagId: tag.id }).run();
      added.push(name);
    } else {
      skipped.push(name);
    }
  }

  const allTagRows = db
    .select({ id: tags.id, name: tags.name })
    .from(jobTags)
    .innerJoin(tags, eq(jobTags.tagId, tags.id))
    .where(eq(jobTags.jobId, input.jobId))
    .all();

  const lines: string[] = [];
  if (added.length) lines.push(`Added: ${added.join(", ")}`);
  if (skipped.length) lines.push(`Already present: ${skipped.join(", ")}`);
  lines.push(`All tags on job #${input.jobId}: ${allTagRows.map((t) => t.name).join(", ") || "none"}`);

  return {
    content: [
      {
        type: "text" as const,
        text: lines.join("\n"),
      },
    ],
  };
}
