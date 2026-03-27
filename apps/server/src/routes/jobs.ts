import { Elysia } from "elysia";
import { eq, like, or, sql } from "drizzle-orm";
import { createJobSchema, updateJobSchema } from "@huntly/shared";
import { db } from "../db";
import { jobs, tags, jobTags } from "../db/schema";

async function getJobWithTags(jobId: number) {
  const job = db.select().from(jobs).where(eq(jobs.id, jobId)).get();
  if (!job) return null;
  const jobTagRows = db
    .select({ id: tags.id, name: tags.name })
    .from(jobTags)
    .innerJoin(tags, eq(jobTags.tagId, tags.id))
    .where(eq(jobTags.jobId, jobId))
    .all();
  return { ...job, tags: jobTagRows };
}

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

export const jobRoutes = new Elysia({ prefix: "/api/jobs" })
  .get("/", ({ query }) => {
    const { status, search } = query as {
      status?: string;
      search?: string;
    };
    const conditions = [];
    if (status) conditions.push(eq(jobs.status, status));
    if (search) {
      const pattern = `%${search}%`;
      conditions.push(
        or(
          like(jobs.company, pattern),
          like(jobs.position, pattern),
          like(jobs.recruiterName, pattern)
        )!
      );
    }
    const where =
      conditions.length > 0
        ? conditions.reduce((acc, c) => sql`${acc} AND ${c}`)
        : undefined;
    const rows = where
      ? db.select().from(jobs).where(where).all()
      : db.select().from(jobs).all();
    return Promise.all(
      rows.map(async (row) => {
        const jobTagRows = db
          .select({ id: tags.id, name: tags.name })
          .from(jobTags)
          .innerJoin(tags, eq(jobTags.tagId, tags.id))
          .where(eq(jobTags.jobId, row.id))
          .all();
        return { ...row, tags: jobTagRows };
      })
    );
  })
  .get("/:id", async ({ params, set }) => {
    const job = await getJobWithTags(Number(params.id));
    if (!job) {
      set.status = 404;
      return { error: "Job not found" };
    }
    return job;
  })
  .post("/", async ({ body, set }) => {
    const parsed = createJobSchema.safeParse(body);
    if (!parsed.success) {
      set.status = 422;
      return { error: parsed.error.flatten() };
    }
    const { tags: tagNames, ...jobData } = parsed.data;
    const inserted = db.insert(jobs).values(jobData).returning().get();
    if (tagNames?.length) {
      const tagIds = await upsertTags(tagNames);
      for (const tagId of tagIds) {
        db.insert(jobTags).values({ jobId: inserted.id, tagId }).run();
      }
    }
    return getJobWithTags(inserted.id);
  })
  .patch("/:id", async ({ params, body, set }) => {
    const parsed = updateJobSchema.safeParse(body);
    if (!parsed.success) {
      set.status = 422;
      return { error: parsed.error.flatten() };
    }
    const { tags: tagNames, ...jobData } = parsed.data;
    const existing = db
      .select()
      .from(jobs)
      .where(eq(jobs.id, Number(params.id)))
      .get();
    if (!existing) {
      set.status = 404;
      return { error: "Job not found" };
    }
    if (Object.keys(jobData).length > 0) {
      db.update(jobs)
        .set({ ...jobData, updatedAt: sql`(datetime('now'))` })
        .where(eq(jobs.id, Number(params.id)))
        .run();
    }
    if (tagNames) {
      db.delete(jobTags).where(eq(jobTags.jobId, Number(params.id))).run();
      const tagIds = await upsertTags(tagNames);
      for (const tagId of tagIds) {
        db.insert(jobTags).values({ jobId: Number(params.id), tagId }).run();
      }
    }
    return getJobWithTags(Number(params.id));
  })
  .delete("/:id", ({ params, set }) => {
    const existing = db
      .select()
      .from(jobs)
      .where(eq(jobs.id, Number(params.id)))
      .get();
    if (!existing) {
      set.status = 404;
      return { error: "Job not found" };
    }
    db.delete(jobs).where(eq(jobs.id, Number(params.id))).run();
    return { success: true };
  });
