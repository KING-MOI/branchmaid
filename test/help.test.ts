import { describe, expect, it } from "vitest";
import { HELP } from "../src/help.js";
import { OPTIONS } from "../src/main.js";

describe("help", () => {
  it.each(Object.keys(OPTIONS))("documents --%s", (name) => {
    expect(HELP).toContain(`--${name}`);
  });
});
