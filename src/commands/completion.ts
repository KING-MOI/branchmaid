import type { Context } from "../context.js";

export function completionScript(shell: string, commands: string[], options: string[]): string {
  const words = [...commands, ...options.map((o) => `--${o}`)].join(" ");
  switch (shell) {
    case "bash":
      return `complete -W "${words}" branchmaid`;
    case "zsh":
      return `#compdef branchmaid\n_branchmaid() { compadd -- ${words} }\ncompdef _branchmaid branchmaid`;
    case "fish":
      return [
        `complete -c branchmaid -f -n __fish_use_subcommand -a "${commands.join(" ")}"`,
        ...options.map((o) => `complete -c branchmaid -l ${o}`),
      ].join("\n");
    default:
      throw new Error(`unsupported shell: ${shell} (use bash, zsh or fish)`);
  }
}

export function makeCompletion(commands: () => string[], options: () => string[]) {
  return (ctx: Context): number => {
    console.log(completionScript(ctx.args[0] ?? "bash", commands(), options()));
    return 0;
  };
}
