import { vi } from "vitest";
import { main } from "../src/main.js";

export function run(argv: string[], cwd: string) {
  const out: string[] = [];
  const err: string[] = [];
  const log = vi.spyOn(console, "log").mockImplementation((...a) => void out.push(a.join(" ")));
  const error = vi.spyOn(console, "error").mockImplementation((...a) => void err.push(a.join(" ")));
  try {
    const code = main(argv, cwd);
    return { code, out: out.join("\n"), err: err.join("\n") };
  } finally {
    log.mockRestore();
    error.mockRestore();
  }
}
