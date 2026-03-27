import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "../../db";
import { jobs, tags, jobTags } from "../../db/schema";

export const def = {
  name: "add_job",
  description:
    "Add a new job to the tracker. Provide structured fields extracted from recruiter messages. Always calculate salaryNetMonthly in EUR (user's preferred comparison currency). Convert from source currency using approximate current rates, apply estimated taxes based on country and contractType. salaryPeriod and salaryType describe the offer's salary context.",
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
    salaryMin: z.number().int().positive().optional().describe("Minimum salary from offer"),
    salaryMax: z.number().int().positive().optional().describe("Maximum salary from offer"),
    salaryCurrency: z.string().max(3).optional().describe("Offer salary currency code (e.g. PLN, EUR, USD)"),
    salaryPeriod: z.enum(["monthly", "yearly"]).optional().describe("Offer salary period: monthly or yearly"),
    salaryType: z.enum(["gross", "net"]).optional().describe("Offer salary type: gross or net"),
    salaryAsk: z.number().int().positive().optional().describe("My salary ask amount"),
    salaryAskCurrency: z.string().max(3).optional().describe("My salary ask currency code"),
    salaryAskPeriod: z.enum(["monthly", "yearly"]).optional().describe("My salary ask period"),
    salaryAskType: z.enum(["gross", "net"]).optional().describe("My salary ask type: gross or net"),
    location: z.string().optional().describe("Job location"),
    format: z.enum(["remote", "hybrid", "office"]).optional().describe("Work format"),
    notes: z.string().optional().describe("Additional notes"),
    tags: z.array(z.string()).optional().describe("Tag names to associate with the job"),
    contractType: z.enum(["b2b", "uop", "contractor"]).optional().describe("Contract type"),
    source: z.enum(["linkedin_inbound", "applied", "referral", "other"]).optional().describe("How the job was found"),
    nextStep: z.string().optional().describe("Next action step (e.g. reply, schedule interview)"),
    salaryNetMonthly: z.number().int().positive().optional().describe("Normalized net monthly salary in user's preferred comparison currency (EUR). Calculate from offer using current exchange rates and estimated taxes."),
    salaryNetCurrency: z.string().max(3).optional().describe("Currency for salaryNetMonthly (default: EUR)"),
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
  salaryPeriod?: "monthly" | "yearly";
  salaryType?: "gross" | "net";
  salaryAsk?: number;
  salaryAskCurrency?: string;
  salaryAskPeriod?: "monthly" | "yearly";
  salaryAskType?: "gross" | "net";
  location?: string;
  format?: "remote" | "hybrid" | "office";
  notes?: string;
  tags?: string[];
  contractType?: "b2b" | "uop" | "contractor";
  source?: "linkedin_inbound" | "applied" | "referral" | "other";
  nextStep?: string;
  salaryNetMonthly?: number;
  salaryNetCurrency?: string;
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
    salaryPeriod: input.salaryPeriod ?? null,
    salaryType: input.salaryType ?? null,
    salaryAsk: input.salaryAsk ?? null,
    salaryAskCurrency: input.salaryAskCurrency ?? null,
    salaryAskPeriod: input.salaryAskPeriod ?? null,
    salaryAskType: input.salaryAskType ?? null,
    location: input.location ?? null,
    format: input.format ?? null,
    notes: input.notes ?? null,
    contractType: input.contractType ?? null,
    source: input.source ?? null,
    nextStep: input.nextStep ?? null,
    salaryNetMonthly: input.salaryNetMonthly ?? null,
    salaryNetCurrency: input.salaryNetCurrency ?? null,
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
        text: `Job added!\n\nID: ${job.id}\nCompany: ${job.company}\nPosition: ${job.position}\nStatus: ${job.status}\nOffer: ${salaryOffer}${salaryNet ? "\nNet: " + salaryNet : ""}\nFormat: ${job.format ?? "not specified"}\nLocation: ${job.location ?? "not specified"}\nTags: ${job.tags.map((t) => t.name).join(", ") || "none"}`,
      },
    ],
  };
}
