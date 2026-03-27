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
    salaryMin: z.number().int().positive().nullable().optional().describe("Minimum salary from offer"),
    salaryMax: z.number().int().positive().nullable().optional().describe("Maximum salary from offer"),
    salaryCurrency: z.string().max(3).nullable().optional().describe("Offer salary currency code"),
    salaryPeriod: z.enum(["monthly", "yearly"]).nullable().optional().describe("Offer salary period: monthly or yearly"),
    salaryType: z.enum(["gross", "net"]).nullable().optional().describe("Offer salary type: gross or net"),
    salaryAsk: z.number().int().positive().nullable().optional().describe("My salary ask amount"),
    salaryAskCurrency: z.string().max(3).nullable().optional().describe("My salary ask currency code"),
    salaryAskPeriod: z.enum(["monthly", "yearly"]).nullable().optional().describe("My salary ask period"),
    salaryAskType: z.enum(["gross", "net"]).nullable().optional().describe("My salary ask type"),
    salaryFinal: z.number().int().positive().nullable().optional().describe("Agreed final salary"),
    salaryFinalCurrency: z.string().max(3).nullable().optional().describe("Agreed final salary currency code"),
    salaryNetMonthly: z.number().int().positive().nullable().optional().describe("Normalized net monthly salary in preferred comparison currency (EUR)"),
    salaryNetCurrency: z.string().max(3).nullable().optional().describe("Currency for salaryNetMonthly (default: EUR)"),
    location: z.string().nullable().optional().describe("Job location"),
    format: z.enum(["remote", "hybrid", "office"]).nullable().optional().describe("Work format"),
    notes: z.string().nullable().optional().describe("Additional notes"),
    tags: z.array(z.string()).optional().describe("Replace all tags with these names"),
    contractType: z.enum(["b2b", "uop", "contractor"]).nullable().optional().describe("Contract type"),
    source: z.enum(["linkedin_inbound", "applied", "referral", "other"]).nullable().optional().describe("How the job was found"),
    nextStep: z.string().nullable().optional().describe("Next action step (e.g. reply, schedule interview)"),
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
  salaryPeriod?: "monthly" | "yearly" | null;
  salaryType?: "gross" | "net" | null;
  salaryAsk?: number | null;
  salaryAskCurrency?: string | null;
  salaryAskPeriod?: "monthly" | "yearly" | null;
  salaryAskType?: "gross" | "net" | null;
  salaryFinal?: number | null;
  salaryFinalCurrency?: string | null;
  salaryNetMonthly?: number | null;
  salaryNetCurrency?: string | null;
  location?: string | null;
  format?: "remote" | "hybrid" | "office" | null;
  notes?: string | null;
  tags?: string[];
  contractType?: "b2b" | "uop" | "contractor" | null;
  source?: "linkedin_inbound" | "applied" | "referral" | "other" | null;
  nextStep?: string | null;
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

  const salaryOffer = job.salaryMin
    ? `${job.salaryCurrency ?? ""} ${job.salaryMin}-${job.salaryMax}${job.salaryPeriod ? "/" + job.salaryPeriod : ""}${job.salaryType ? " " + job.salaryType : ""}`
    : "not specified";
  const salaryNet = job.salaryNetMonthly
    ? `~${job.salaryNetMonthly} ${job.salaryNetCurrency ?? "EUR"}/mo net`
    : null;

  return {
    content: [
      {
        type: "text" as const,
        text: `Job #${job.id} updated.\n\nCompany: ${job.company}\nPosition: ${job.position}\nStatus: ${job.status}\nOffer: ${salaryOffer}${salaryNet ? "\nNet: " + salaryNet : ""}\nFormat: ${job.format ?? "not specified"}\nLocation: ${job.location ?? "not specified"}\nTags: ${job.tags.map((t) => t.name).join(", ") || "none"}`,
      },
    ],
  };
}
