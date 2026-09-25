/* Read a CSS custom property from the document root. Used where MapLibre style
   values must mirror the design tokens (MapLibre does not resolve var()). */
export function cssVar(name: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

/** Token-backed map ink color (--ink-0); hex fallback matches globals.css. */
export function ink0(): string {
  return cssVar('--ink-0', '#101216');
}
