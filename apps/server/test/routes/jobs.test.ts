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

beforeEach(async () => {
  db.delete(jobTags).run();
  db.delete(tags).run();
  db.delete(jobs).run();
});

describe("POST /api/jobs", () => {
  it("creates a job with required fields", async () => {
    const res = await postJob({ company: "Spotify", position: "Senior Node.js Developer" });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.company).toBe("Spotify");
    expect(body.position).toBe("Senior Node.js Developer");
    expect(body.status).toBe("contacted");
    expect(body.id).toBeGreaterThan(0);
  });

  it("creates a job with tags", async () => {
    const res = await postJob({ company: "Google", position: "Backend Engineer", tags: ["remote", "interesting stack"] });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.tags).toHaveLength(2);
    expect(body.tags.map((t: { name: string }) => t.name).sort()).toEqual(["interesting stack", "remote"]);
  });

  it("rejects invalid body", async () => {
    const res = await postJob({ company: "" });
    expect(res.status).toBe(422);
  });
});

describe("GET /api/jobs", () => {
  it("returns empty list", async () => {
    const res = await api("/api/jobs");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([]);
  });

  it("returns created jobs", async () => {
    await postJob({ company: "A", position: "Dev" });
    await postJob({ company: "B", position: "Dev" });
    const body = await (await api("/api/jobs")).json();
    expect(body).toHaveLength(2);
  });

  it("filters by status", async () => {
    await postJob({ company: "A", position: "Dev", status: "contacted" });
    await postJob({ company: "B", position: "Dev", status: "offer" });
    const body = await (await api("/api/jobs?status=offer")).json();
    expect(body).toHaveLength(1);
    expect(body[0].company).toBe("B");
  });

  it("searches by text", async () => {
    await postJob({ company: "Spotify", position: "Dev" });
    await postJob({ company: "Google", position: "Dev" });
    const body = await (await api("/api/jobs?search=spot")).json();
    expect(body).toHaveLength(1);
    expect(body[0].company).toBe("Spotify");
  });
});

describe("GET /api/jobs/:id", () => {
  it("returns a job by id", async () => {
    const created = await (await postJob({ company: "Spotify", position: "Dev" })).json();
    const body = await (await api(`/api/jobs/${created.id}`)).json();
    expect(body.company).toBe("Spotify");
  });

  it("returns 404 for missing job", async () => {
    expect((await api("/api/jobs/9999")).status).toBe(404);
  });
});

describe("PATCH /api/jobs/:id", () => {
  it("updates job fields", async () => {
    const created = await (await postJob({ company: "Spotify", position: "Dev" })).json();
    const res = await api(`/api/jobs/${created.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "interview", notes: "went well" }),
    });
    const body = await res.json();
    expect(body.status).toBe("interview");
    expect(body.notes).toBe("went well");
  });
});

describe("DELETE /api/jobs/:id", () => {
  it("deletes a job", async () => {
    const created = await (await postJob({ company: "Spotify", position: "Dev" })).json();
    await api(`/api/jobs/${created.id}`, { method: "DELETE" });
    expect(await (await api("/api/jobs")).json()).toHaveLength(0);
  });
});
