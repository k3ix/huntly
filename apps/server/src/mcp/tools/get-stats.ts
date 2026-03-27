import { z } from "zod";
import { sql } from "drizzle-orm";
import { db } from "../../db";
import { jobs } from "../../db/schema";
import { JOB_STATUSES } from "@huntly/shared";

export const def = {
  name: "get_stats",
  description: "Get job count statistics per status and total.",
  schema: {},
};

export async function handler(_input: Record<string, never>) {
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

  let total = 0;
  const lines: string[] = [];
  for (const status of JOB_STATUSES) {
    const count = countMap[status] ?? 0;
    total += count;
    lines.push(`  ${status}: ${count}`);
  }
  lines.push(`  total: ${total}`);

  return {
    content: [
      {
        type: "text" as const,
        text: `Job statistics:\n\n${lines.join("\n")}`,
      },
    ],
  };
}
