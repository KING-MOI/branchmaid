import { stripVTControlCharacters } from "node:util";

export function table(rows: string[][]): string {
  const widths: number[] = [];
  for (const row of rows) {
    row.forEach((cell, i) => {
      widths[i] = Math.max(widths[i] ?? 0, stripVTControlCharacters(cell).length);
    });
  }
  return rows
    .map((row) =>
      row
        .map((cell, i) =>
          i === row.length - 1 ? cell : cell + " ".repeat(widths[i] - stripVTControlCharacters(cell).length),
        )
        .join("  "),
    )
    .join("\n");
}
