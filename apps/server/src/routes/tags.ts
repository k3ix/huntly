import { Elysia } from "elysia";
import { and, eq } from "drizzle-orm";
import { createTagSchema } from "@huntly/shared";
import { db } from "../db";
import { tags, jobs, jobTags } from "../db/schema";

export const tagRoutes = new Elysia({ prefix: "/api/tags" })
  .get("/", () => {
    return db.select().from(tags).all();
  })
  .post("/", ({ body, set }) => {
    const parsed = createTagSchema.safeParse(body);
    if (!parsed.success) {
      set.status = 422;
      return { error: parsed.error.flatten() };
    }
    const existing = db.select().from(tags).where(eq(tags.name, parsed.data.name)).get();
    if (existing) {
      set.status = 409;
      return { error: "Tag already exists" };
    }
    return db.insert(tags).values({ name: parsed.data.name }).returning().get();
  })
  .delete("/:id", ({ params, set }) => {
    const existing = db.select().from(tags).where(eq(tags.id, Number(params.id))).get();
    if (!existing) {
      set.status = 404;
      return { error: "Tag not found" };
    }
    db.delete(tags).where(eq(tags.id, Number(params.id))).run();
    return { success: true };
  });

export const jobTagRoutes = new Elysia({ prefix: "/api/jobs" })
  .post("/:id/tags", ({ params, body, set }) => {
    const jobId = Number(params.id);
    const job = db.select().from(jobs).where(eq(jobs.id, jobId)).get();
    if (!job) {
      set.status = 404;
      return { error: "Job not found" };
    }
    const parsed = createTagSchema.safeParse(body);
    if (!parsed.success) {
      set.status = 422;
      return { error: parsed.error.flatten() };
    }
    let tag = db.select().from(tags).where(eq(tags.name, parsed.data.name)).get();
    if (!tag) {
      tag = db.insert(tags).values({ name: parsed.data.name }).returning().get();
    }
    const alreadyLinked = db
      .select()
      .from(jobTags)
      .where(and(eq(jobTags.jobId, jobId), eq(jobTags.tagId, tag.id)))
      .get();
    if (!alreadyLinked) {
      db.insert(jobTags).values({ jobId, tagId: tag.id }).run();
    }
    return { success: true, tagId: tag.id };
  })
  .delete("/:id/tags/:tagId", ({ params, set }) => {
    const jobId = Number(params.id);
    const tagId = Number(params.tagId);
    const job = db.select().from(jobs).where(eq(jobs.id, jobId)).get();
    if (!job) {
      set.status = 404;
      return { error: "Job not found" };
    }
    db.delete(jobTags)
      .where(and(eq(jobTags.jobId, jobId), eq(jobTags.tagId, tagId)))
      .run();
    return { success: true };
  });
