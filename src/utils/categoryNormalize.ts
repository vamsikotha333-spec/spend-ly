import { CATEGORIES } from "@/types/transaction";

// Normalize a user-typed category name: trim, collapse spaces, Title Case each word.
// Used before persisting newly-created categories.
export function normalizeName(raw: string): string {
  const s = (raw || "").replace(/\s+/g, " ").trim();
  if (!s) return "";
  return s
    .split(" ")
    .map((w) =>
      w.length === 0
        ? w
        : w[0].toUpperCase() + w.slice(1).toLowerCase(),
    )
    .join(" ");
}

// Strip emoji + symbol unicode ranges, lowercase, collapse whitespace, drop most punctuation.
export function normalizeCategory(raw: string | null | undefined): string {
  if (!raw) return "";
  let s = String(raw);
  // Remove emoji & pictographs (broad ranges)
  s = s.replace(
    /[\u2600-\u27BF\u{1F300}-\u{1FAFF}\u{1F000}-\u{1F0FF}\u{1F100}-\u{1F1FF}\uFE0F\u200D]/gu,
    " ",
  );
  // Remove variation selectors / ZWJ leftovers
  s = s.replace(/[\u200B-\u200F\uFEFF]/g, " ");
  s = s.toLowerCase();
  // Replace separators with space
  s = s.replace(/[_/-/.]+/g, " ");
  // Drop everything except letters/numbers/space/&
  s = s.replace(/[^a-z0-9& ]+/g, " ");
  // Collapse whitespace
  s = s.replace(/\s+/g, " ").trim();
  return s;
}

// Build lookup: normalized -> canonical display name (with emoji) from CATEGORIES
const CANONICAL_MAP: Record<string, string> = (() => {
  const map: Record<string, string> = {};
  Object.values(CATEGORIES).forEach((list) => {
    (list as readonly string[]).forEach((display) => {
      const key = normalizeCategory(display);
      if (key && !map[key]) map[key] = display;
    });
  });
  return map;
})();

// Return canonical display name for a category (with emoji if known),
// otherwise return the original (trimmed) display.
export function canonicalDisplay(raw: string): string {
  const key = normalizeCategory(raw);
  if (CANONICAL_MAP[key]) return CANONICAL_MAP[key];
  return raw?.trim() || raw;
}

// Group { categoryName: amount } map by normalized identity.
// Returns { canonicalDisplay: amount }.
export function mergeByCategory(
  entries: Record<string, number>,
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [name, amt] of Object.entries(entries)) {
    const display = canonicalDisplay(name);
    out[display] = (out[display] || 0) + amt;
  }
  return out;
}

// Used when iterating raw transactions: returns the canonical display key to bucket under.
export function categoryKey(raw: string): string {
  return canonicalDisplay(raw);
}
