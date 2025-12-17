import type { Branch } from "../src/branches.js";

export function branch(name: string, overrides: Partial<Branch> = {}): Branch {
  return {
    name,
    sha: "0".repeat(40),
    date: new Date("2026-01-01T00:00:00Z"),
    author: "Test",
    email: "test@example.com",
    subject: "work",
    current: false,
    upstream: "",
    gone: false,
    ...overrides,
  };
}
