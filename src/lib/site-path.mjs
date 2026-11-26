// Authored references are relative to the research site's root. Keep fragments,
// query-only links and external URLs intact when mounting it under a project path.
export function sitePath(url, base = "/") {
  const prefix = base.replace(/\/+$/, "");
  if (!prefix || !url.startsWith("/") || url.startsWith("//") ||
      url === prefix || url.startsWith(prefix + "/")) return url;
  return prefix + url;
}
