export function normalizeTenantSlug(input: string) {
  const slug = (input || "").trim().toLowerCase();
  if (!slug) return null;
  const reserved = new Set(["admin", "api"]);
  if (reserved.has(slug)) return null;
  return slug;
}

