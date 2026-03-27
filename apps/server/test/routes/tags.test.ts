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

async function postTag(body: Record<string, unknown>) {
  return api("/api/tags", {
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

describe("POST /api/tags", () => {
  it("creates a tag", async () => {
    const res = await postTag({ name: "remote" });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.name).toBe("remote");
    expect(body.id).toBeGreaterThan(0);
  });

  it("rejects duplicate tag with 409", async () => {
    await postTag({ name: "remote" });
    const res = await postTag({ name: "remote" });
    expect(res.status).toBe(409);
  });

  it("rejects invalid body with 422", async () => {
    const res = await postTag({ name: "" });
    expect(res.status).toBe(422);
  });
});

describe("GET /api/tags", () => {
  it("returns all tags", async () => {
    await postTag({ name: "remote" });
    await postTag({ name: "startup" });
    const res = await api("/api/tags");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(2);
    expect(body.map((t: { name: string }) => t.name).sort()).toEqual(["remote", "startup"]);
  });
});

describe("DELETE /api/tags/:id", () => {
  it("deletes a tag", async () => {
    const created = await (await postTag({ name: "remote" })).json();
    const res = await api(`/api/tags/${created.id}`, { method: "DELETE" });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    const remaining = await (await api("/api/tags")).json();
    expect(remaining).toHaveLength(0);
  });

  it("returns 404 for missing tag", async () => {
    const res = await api("/api/tags/9999", { method: "DELETE" });
    expect(res.status).toBe(404);
  });
});

describe("POST /api/jobs/:id/tags", () => {
  it("adds a tag to a job", async () => {
    const job = await (await postJob({ company: "Spotify", position: "Dev" })).json();
    const res = await api(`/api/jobs/${job.id}/tags`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "remote" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.tagId).toBeGreaterThan(0);
  });

  it("creates tag if not exists when adding to job", async () => {
    const job = await (await postJob({ company: "Spotify", position: "Dev" })).json();
    await api(`/api/jobs/${job.id}/tags`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "new-tag" }),
    });
    const allTags = await (await api("/api/tags")).json();
    expect(allTags.map((t: { name: string }) => t.name)).toContain("new-tag");
  });

  it("skips if tag already linked to job", async () => {
    const job = await (await postJob({ company: "Spotify", position: "Dev" })).json();
    await api(`/api/jobs/${job.id}/tags`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "remote" }),
    });
    const res = await api(`/api/jobs/${job.id}/tags`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "remote" }),
    });
    expect(res.status).toBe(200);
    // Only one tag should exist
    const allTags = await (await api("/api/tags")).json();
    expect(allTags).toHaveLength(1);
  });

  it("returns 404 for missing job", async () => {
    const res = await api("/api/jobs/9999/tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "remote" }),
    });
    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/jobs/:id/tags/:tagId", () => {
  it("removes a tag from a job", async () => {
    const job = await (await postJob({ company: "Spotify", position: "Dev" })).json();
    const addRes = await (await api(`/api/jobs/${job.id}/tags`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "remote" }),
    })).json();
    const res = await api(`/api/jobs/${job.id}/tags/${addRes.tagId}`, {
      method: "DELETE",
    });
    expect(res.status).toBe(200);
    expect((await res.json()).success).toBe(true);
    // Tag still exists in tags table, just unlinked from job
    const updatedJob = await (await api(`/api/jobs/${job.id}`)).json();
    expect(updatedJob.tags).toHaveLength(0);
  });
});
