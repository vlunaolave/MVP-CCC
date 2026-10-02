export function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

export function includesText(haystack: string | null | undefined, needle: string): boolean {
  if (!needle) {
    return true;
  }
  if (!haystack) {
    return false;
  }
  return normalizeText(haystack).includes(normalizeText(needle));
}
