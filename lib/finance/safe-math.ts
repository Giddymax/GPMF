/** Returns null instead of NaN/Infinity when the denominator is zero, so ratio dashboards can render "—" instead of crashing. */
export function safeDiv(numerator: number, denominator: number): number | null {
  if (!Number.isFinite(denominator) || denominator === 0) return null;
  return numerator / denominator;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
