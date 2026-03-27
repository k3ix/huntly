import { Elysia } from "elysia";
import { eq, sql } from "drizzle-orm";
import { JOB_STATUSES } from "@huntly/shared";
import { db } from "../db";
import { jobs } from "../db/schema";

export const statsRoutes = new Elysia({ prefix: "/api/jobs" })
  .get("/stats", () => {
    const rows = db
      .select({
        status: jobs.status,
        count: sql<number>`count(*)`.as("count"),
      })
      .from(jobs)
      .groupBy(jobs.status)
      .all();

    const countMap: Record<string, number> = {};
    for (const row of rows) {
      countMap[row.status] = Number(row.count);
    }

    const result: Record<string, number> = {};
    let total = 0;
    for (const status of JOB_STATUSES) {
      const count = countMap[status] ?? 0;
      result[status] = count;
      total += count;
    }
    result.total = total;

    return result;
  });
