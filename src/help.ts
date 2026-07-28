export const HELP = `branchmaid - tidy up stale git branches safely

Usage
  branchmaid [command] [options]

Commands
  list                  show local branches, oldest first (default)
  sweep                 delete merged and gone branches, keeping backup tags
  backups               list backup tags left by sweep
  restore <branch|tag>  recreate a deleted branch from its latest backup or a given tag
  undo                  restore every branch deleted by the last sweep
  init                  write a .branchmaidrc with the defaults
  config                print the effective config and where it came from
  doctor                check git, config and remote setup
  completion <shell>    print a completion script for bash, zsh or fish

Options
  --base <name>         branch to compare against (default: origin HEAD, main or master)
  --older-than <dur>    staleness threshold, e.g. 30d, 2w, 3mo or 2026-01-31 (default: 30d)
  -f, --fetch           run git fetch --prune first so gone branches are current
  --protect <glob>      protect extra branches for this run (repeatable)
  -r, --remotes         work on branches on origin instead of local ones
  --merged              only show branches merged into base
  --gone                only show branches whose upstream was deleted
  --stale               only show branches older than the threshold
  --mine                only show branches whose last commit is yours
  --author <text>       only show branches whose last author name or email contains text
  --squash              also detect squash-merged branches (slower)
  --sort <key>          sort by age (default), name or author
  --limit <n>           show at most n branches
  --names               print only branch names, one per line
  --json                print JSON instead of a table
  -n, --dry-run         show what would happen without changing anything
  -y, --yes             do not ask for confirmation
  -i, --interactive     pick branches to delete from a list
  --remote              with sweep: also delete the branch on its remote
  --no-backup           do not create backup tags when deleting
  --as <name>           with restore: recreate the branch under a different name
  --prune <dur>         with backups: drop backup tags older than <dur>
  --no-color            disable colors (NO_COLOR is honoured too)
  -h, --help            show this help
  -v, --version         print the version
`;

export const COMMAND_HELP: Record<string, string> = {
  list: `Usage: branchmaid list [--merged] [--gone] [--stale] [--mine] [--author <text>]
                       [--sort age|name|author] [--limit <n>] [--names | --json]

Show local branches, oldest first, with their age, commits ahead and behind
base, last author and why they might be safe to delete.`,
  sweep: `Usage: branchmaid sweep [-n] [-y] [-i] [--remote] [--no-backup] [--json]
                        [--merged] [--gone] [--stale]

Delete branches that are merged into base or whose upstream is gone. Each
branch is tagged under branchmaid/backup/ first. Pass --merged, --gone or
--stale to choose exactly which kinds are swept for this run.`,
  backups: `Usage: branchmaid backups [--prune <dur|date>] [-n] [--json]

List backup tags, newest first. With --prune, drop the ones older than the
given age.`,
  restore: `Usage: branchmaid restore [<branch> | <tag>] [--as <name>]

Recreate a deleted branch from its newest backup, or from the exact tag given.
Without an argument, pick a backup from a list.`,
  undo: `Usage: branchmaid undo [-n]

Restore every branch from the most recent sweep. Branches that already exist
again are reported and left alone.`,
  init: `Usage: branchmaid init

Write a .branchmaidrc with the default settings at the repository root.`,
  completion: `Usage: branchmaid completion [bash|zsh|fish]

Print a shell completion script. For example:
  branchmaid completion bash >> ~/.bashrc
  branchmaid completion fish > ~/.config/fish/completions/branchmaid.fish`,
  doctor: `Usage: branchmaid doctor

Check the git version, repository, config, base branch, origin HEAD and
fetch.prune, and suggest fixes for anything that will make results less
accurate.`,
  config: `Usage: branchmaid config

Print the configuration in effect and the file it was read from.`,
};
