import { parseDocument } from "yaml";

/**
 * Parse YAML frontmatter as data, rather than trying to extract values with
 * regexes. This supports quoted scalars, flow sequences, and block sequences.
 */
export function parseFrontmatter(source, filename = "<input>") {
  const match = /^(?:\uFEFF)?---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(source);
  if (!match) throw new Error(filename + ": missing or unclosed YAML frontmatter");
  const document = parseDocument(match[1], { uniqueKeys: true });
  if (document.errors.length) {
    throw new Error(filename + ": YAML error: " + document.errors.map(e => e.message).join("; "));
  }
  const data = document.toJS();
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error(filename + ": YAML frontmatter must be a mapping");
  }
  return data;
}
