import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { run } from "./cli.js";
import { makeRepo, sh } from "./helpers.js";

const prompts = vi.hoisted(() => ({ select: vi.fn() }));
vi.mock("@clack/prompts", async (orig) => ({ ...(await orig<object>()), ...prompts }));

describe("restore picker", () => {
  const tty = process.stdin.isTTY;
  beforeEach(() => {
    process.stdin.isTTY = true;
  });
  afterEach(() => {
    process.stdin.isTTY = tty;
    vi.resetAllMocks();
  });

  it("restores the chosen backup", async () => {
    const r = makeRepo();
    sh(r, ["tag", "branchmaid/backup/20200101T000000Z/picked"]);
    prompts.select.mockResolvedValue("branchmaid/backup/20200101T000000Z/picked");
    const { out } = await run(["restore"], r);
    expect(out).toContain("restored picked");
  });

  it("does not prompt with no backups", async () => {
    const { out } = await run(["restore"], makeRepo());
    expect(out).toContain("no backups");
    expect(prompts.select).not.toHaveBeenCalled();
  });
});
