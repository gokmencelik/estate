export function hexToRgbChannels(hex: string): string | null {
  const raw = (hex || "").trim().replace(/^#/, "");
  if (!/^[0-9a-fA-F]{6}$/.test(raw)) return null;

  const r = parseInt(raw.slice(0, 2), 16);
  const g = parseInt(raw.slice(2, 4), 16);
  const b = parseInt(raw.slice(4, 6), 16);
  return `${r} ${g} ${b}`;
}

