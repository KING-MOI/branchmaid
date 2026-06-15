import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import { COMMAND_HELP, HELP } from "../src/help.js";
import { COMMANDS, OPTIONS } from "../src/main.js";
import { run } from "./cli.js";

describe("help", () => {
  it.each(Object.keys(OPTIONS))("documents --%s", (name) => {
    expect(HELP).toContain(`--${name}`);
  });
});

describe("command help", () => {
  it("has an entry for every command", () => {
    expect(Object.keys(COMMAND_HELP).sort()).toEqual(Object.keys(COMMANDS).sort());
  });

  it("is shown for `<command> --help` and `help <command>`", async () => {
    expect((await run(["sweep", "--help"], tmpdir())).out).toContain("Usage: branchmaid sweep");
    expect((await run(["help", "restore"], tmpdir())).out).toContain("Usage: branchmaid restore");
  });
});
