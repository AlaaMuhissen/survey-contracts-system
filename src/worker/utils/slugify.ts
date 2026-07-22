// Turns a free-typed name (Hebrew or Latin) into something safe to drop into
// a URL path segment, e.g. for the private-client placeholder projectId.
export function slugify(input: string): string {
  return (input || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\u0590-\u05FF-]/g, "");
}