import { describe, expect, it } from "bun:test";
import { parseRecruiterMessage } from "../../src/mcp/parser";

describe("parseRecruiterMessage", () => {
  it("extracts company from typical message", () => {
    const result = parseRecruiterMessage("Hi! I'm a recruiter at Spotify. We have an opening.");
    expect(result.company).toBe("Spotify");
  });

  it("extracts salary range", () => {
    const result = parseRecruiterMessage("The salary range is $150k-$200k");
    expect(result.salaryMin).toBe(150000);
    expect(result.salaryMax).toBe(200000);
  });

  it("returns null for unparseable", () => {
    const result = parseRecruiterMessage("Hey, are you open?");
    expect(result.company).toBeNull();
  });

  it("extracts salary with full numbers", () => {
    const result = parseRecruiterMessage("Salary: $150,000-$200,000 per year");
    expect(result.salaryMin).toBe(150000);
    expect(result.salaryMax).toBe(200000);
    expect(result.salaryCurrency).toBe("USD");
  });

  it("sets remote format", () => {
    const result = parseRecruiterMessage("This is a fully remote position.");
    expect(result.format).toBe("remote");
  });

  it("sets hybrid format", () => {
    const result = parseRecruiterMessage("We work in a hybrid model.");
    expect(result.format).toBe("hybrid");
  });

  it("sets office format for on-site", () => {
    const result = parseRecruiterMessage("The role is on-site in Warsaw.");
    expect(result.format).toBe("office");
  });

  it("returns null currency when no $ sign", () => {
    const result = parseRecruiterMessage("Salary 100k-150k");
    expect(result.salaryMin).toBe(100000);
    expect(result.salaryMax).toBe(150000);
    expect(result.salaryCurrency).toBeNull();
  });

  it("returns all nulls for empty message", () => {
    const result = parseRecruiterMessage("");
    expect(result.company).toBeNull();
    expect(result.position).toBeNull();
    expect(result.salaryMin).toBeNull();
    expect(result.salaryMax).toBeNull();
    expect(result.salaryCurrency).toBeNull();
    expect(result.location).toBeNull();
    expect(result.format).toBeNull();
  });

  it("extracts company from 'from Company'", () => {
    const result = parseRecruiterMessage("I'm reaching out from Acme Corp.");
    expect(result.company).toBe("Acme Corp");
  });
});
