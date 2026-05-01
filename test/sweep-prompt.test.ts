import { CANCEL_SYMBOL } from "@clack/prompts";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { listBranches } from "../src/branches.js";
import { run } from "./cli.js";
import { makeRepo, sh } from "./helpers.js";

const prompts = vi.hoisted(() => ({ confirm: vi.fn(), multiselect: vi.fn() }));
vi.mock("@clack/prompts", async (orig) => ({ ...(await orig<object>()), ...prompts }));

function repo(): string {
  const r = makeRepo();
  sh(r, ["branch", "merged-one"]);
  sh(r, ["commit", "-q", "--allow-empty", "-m", "main moves on"]);
  return r;
}

const has = (r: string, name: string) => listBranches(r).some((b) => b.name === name);

describe("sweep confirmation", () => {
  const tty = process.stdin.isTTY;
  beforeEach(() => {
    process.stdin.isTTY = true;
  });
  afterEach(() => {
    process.stdin.isTTY = tty;
    vi.resetAllMocks();
  });

  it("deletes after the user confirms", async () => {
    prompts.confirm.mockResolvedValue(true);
    const r = repo();
    expect((await run(["sweep"], r)).code).toBe(0);
    expect(has(r, "merged-one")).toBe(false);
  });

  it("keeps everything when the user declines", async () => {
    prompts.confirm.mockResolvedValue(false);
    const r = repo();
    const { out } = await run(["sweep"], r);
    expect(out).toContain("aborted");
    expect(has(r, "merged-one")).toBe(true);
  });

  it("skips the prompt with --yes", async () => {
    const r = repo();
    await run(["sweep", "--yes"], r);
    expect(prompts.confirm).not.toHaveBeenCalled();
  });
});

describe("sweep --interactive", () => {
  afterEach(() => vi.resetAllMocks());

  it("offers unprotected branches with sweep targets preselected", async () => {
    const r = repo();
    sh(r, ["branch", "other"]);
    prompts.multiselect.mockResolvedValue([]);
    await run(["sweep", "-i"], r);
    const opts = prompts.multiselect.mock.calls[0][0];
    expect(opts.options.map((o: { value: string }) => o.value).sort()).toEqual(["merged-one", "other"]);
    expect(opts.initialValues).toEqual(["merged-one"]);
  });

  it("deletes only what was picked", async () => {
    const r = repo();
    sh(r, ["branch", "other"]);
    prompts.multiselect.mockResolvedValue(["other"]);
    await run(["sweep", "-i"], r);
    expect(has(r, "other")).toBe(false);
    expect(has(r, "merged-one")).toBe(true);
  });

  it("aborts on cancel", async () => {
    const r = repo();
    prompts.multiselect.mockResolvedValue(CANCEL_SYMBOL);
    const { out } = await run(["sweep", "-i"], r);
    expect(out).toContain("aborted");
    expect(has(r, "merged-one")).toBe(true);
  });
});
