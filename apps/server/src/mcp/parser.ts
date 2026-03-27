export interface ParsedMessage {
  company: string | null;
  position: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string | null;
  location: string | null;
  format: string | null;
}

export function parseRecruiterMessage(text: string): ParsedMessage {
  const result: ParsedMessage = {
    company: null,
    position: null,
    salaryMin: null,
    salaryMax: null,
    salaryCurrency: null,
    location: null,
    format: null,
  };

  // Company: match "at Company" or "from Company" followed by punctuation/whitespace
  const companyMatch = text.match(
    /\b(?:at|from)\s+([A-Z][A-Za-z0-9&.\-\s]{0,40}?)(?:\s*[,.\!?]|\s+(?:we|who|is|for|and|a\b|an\b|the\b|has|have|are|our|inc|llc|ltd|corp|co\.)\b|$)/
  );
  if (companyMatch) {
    result.company = companyMatch[1].trim();
  }

  // Position: match "role of X", "position of X", "opening for X", "looking for a X", "hiring a/an X"
  const positionMatch = text.match(
    /\b(?:role\s+of|position\s+of|opening\s+for(?:\s+a(?:n)?)?\s+|looking\s+for\s+a(?:n)?\s+|hiring\s+a(?:n)?\s+|for\s+(?:a(?:n)?\s+)?(?:the\s+)?(?:role|position)\s+of\s+)([A-Za-z][A-Za-z0-9\s\-\/]{1,60}?)(?:\s*[,.\!?]|$)/i
  );
  if (positionMatch) {
    result.position = positionMatch[1].trim();
  }

  // Salary: various formats like $150k-$200k, $150,000-$200,000, 150k-200k, 150000-200000
  const salaryMatch = text.match(
    /(\$?)(\d[\d,]*(?:\.\d+)?)(k?)\s*(?:-|to|–)\s*(\$?)(\d[\d,]*(?:\.\d+)?)(k?)/i
  );
  if (salaryMatch) {
    const currency = salaryMatch[1] || salaryMatch[4] || null;
    const rawMin = parseFloat(salaryMatch[2].replace(/,/g, ""));
    const rawMax = parseFloat(salaryMatch[5].replace(/,/g, ""));
    const minK = salaryMatch[3].toLowerCase() === "k";
    const maxK = salaryMatch[6].toLowerCase() === "k";

    result.salaryMin = minK || rawMin < 1000 ? rawMin * 1000 : rawMin;
    result.salaryMax = maxK || rawMax < 1000 ? rawMax * 1000 : rawMax;
    result.salaryCurrency = currency === "$" ? "USD" : null;
  }

  // Format: remote, hybrid, office/on-site
  const formatMatch = text.match(/\b(remote|hybrid|on[-\s]?site|office)\b/i);
  if (formatMatch) {
    const raw = formatMatch[1].toLowerCase();
    if (raw.startsWith("on") || raw === "office") {
      result.format = "office";
    } else if (raw === "hybrid") {
      result.format = "hybrid";
    } else if (raw === "remote") {
      result.format = "remote";
    }
  }

  // Location: "based in X", "located in X", "in X (city/country pattern)"
  const locationMatch = text.match(
    /\b(?:based\s+in|located\s+in|location[:\s]+|in\s+)([A-Z][A-Za-z\s,]{2,40}?)(?:\s*[,.\!?]|$)/
  );
  if (locationMatch) {
    result.location = locationMatch[1].trim();
  }

  return result;
}
