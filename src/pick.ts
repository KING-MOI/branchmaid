import { isCancel, multiselect } from "@clack/prompts";
import { formatAge } from "./duration.js";
import type { Entry } from "./scan.js";

export async function pick(entries: Entry[], preselected: Entry[]): Promise<Entry[] | undefined> {
  const chosen = await multiselect({
    message: "Select branches to delete",
    options: entries.map((e) => ({
      value: e.branch.name,
      label: e.branch.name,
      hint: [formatAge(e.age), ...e.reasons].join(" · "),
    })),
    initialValues: preselected.map((e) => e.branch.name),
    required: false,
  });
  if (isCancel(chosen)) return undefined;
  return entries.filter((e) => chosen.includes(e.branch.name));
}
