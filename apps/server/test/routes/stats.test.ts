import { describe, expect, it, beforeEach } from "bun:test";
import { app } from "../../src/app";
import { db } from "../../src/db";
import { jobs, tags, jobTags } from "../../src/db/schema";

async function api(path: string, options?: RequestInit) {
  return app.handle(new Request(`http://localhost${path}`, options));
}

async function postJob(body: Record<string, unknown>) {
  return api("/api/jobs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  db.delete(jobTags).run();
  db.delete(tags).run();
  db.delete(jobs).run();
});

describe("GET /api/jobs/stats", () => {
  it("returns all zeros when no jobs", async () => {
    const res = await api("/api/jobs/stats");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({
      contacted: 0,
      reviewing: 0,
      talking: 0,
      interview: 0,
      offer: 0,
      declined: 0,
      ghosted: 0,
      total: 0,
    });
  });

  it("counts jobs per status correctly", async () => {
    await postJob({ company: "A", position: "Dev", status: "contacted" });
    await postJob({ company: "B", position: "Dev", status: "contacted" });
    await postJob({ company: "C", position: "Dev", status: "interview" });
    const res = await api("/api/jobs/stats");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.contacted).toBe(2);
    expect(body.interview).toBe(1);
    expect(body.total).toBe(3);
    expect(body.reviewing).toBe(0);
    expect(body.offer).toBe(0);
  });

  it("total matches sum of all statuses", async () => {
    await postJob({ company: "A", position: "Dev", status: "contacted" });
    await postJob({ company: "B", position: "Dev", status: "offer" });
    await postJob({ company: "C", position: "Dev", status: "ghosted" });
    const res = await api("/api/jobs/stats");
    const body = await res.json();
    const sum = body.contacted + body.reviewing + body.talking + body.interview + body.offer + body.declined + body.ghosted;
    expect(body.total).toBe(sum);
    expect(body.total).toBe(3);
  });
});
