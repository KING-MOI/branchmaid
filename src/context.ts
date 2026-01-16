import type { Config } from "./config.js";

export interface Context {
  cwd: string;
  config: Config;
  base: string;
  staleAfter: number;
}
