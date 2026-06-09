import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { DEFAULTS } from "../src/config.js";

const schema = JSON.parse(readFileSync(new URL("../schema.json", import.meta.url), "utf8"));

describe("schema.json", () => {
  it("lists every config key", () => {
    expect(Object.keys(schema.properties).sort()).toEqual(
      ["$schema", "base", ...Object.keys(DEFAULTS)].sort(),
    );
    expect(Object.keys(schema.properties.sweep.properties).sort()).toEqual(
      Object.keys(DEFAULTS.sweep).sort(),
    );
  });

  it("has defaults that match the code", () => {
    expect(schema.properties.protected.default).toEqual(DEFAULTS.protected);
    expect(schema.properties.squash.default).toBe(DEFAULTS.squash);
    for (const [key, value] of Object.entries(DEFAULTS.sweep)) {
      expect(schema.properties.sweep.properties[key].default).toEqual(value);
    }
  });
});
