import { stripVTControlCharacters } from "node:util";

const width = (s: string) => stripVTControlCharacters(s).length;

export function truncate(text: string, max: number): string {
  if (max <= 0) return "";
  const plain = stripVTControlCharacters(text);
  if (plain.length <= max) return text;
  return `${plain.slice(0, Math.max(0, max - 1))}…`;
}

export function table(rows: string[][], maxWidth = Infinity): string {
  const widths: number[] = [];
  for (const row of rows) {
    row.forEach((cell, i) => {
      widths[i] = Math.max(widths[i] ?? 0, width(cell));
    });
  }
  return rows
    .map((row) => {
      const head = row
        .slice(0, -1)
        .map((cell, i) => cell + " ".repeat(widths[i] - width(cell)) + "  ")
        .join("");
      const last = row[row.length - 1] ?? "";
      return head + truncate(last, maxWidth - width(head));
    })
    .join("\n");
}
