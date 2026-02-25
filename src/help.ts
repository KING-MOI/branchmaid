export const HELP = `branchmaid - tidy up stale git branches safely

Usage
  branchmaid [command] [options]

Commands
  list                  show local branches, oldest first (default)
  sweep                 delete merged and gone branches, keeping backup tags
  backups               list backup tags left by sweep
  restore <branch>      recreate a deleted branch from its latest backup

Options
  --base <name>         branch to compare against (default: origin HEAD, main or master)
  --older-than <dur>    staleness threshold, e.g. 30d, 2w, 3mo (default: 30d)
  --merged              only show branches merged into base
  --gone                only show branches whose upstream was deleted
  --stale               only show branches older than the threshold
  --squash              also detect squash-merged branches (slower)
  --json                print JSON instead of a table
  -n, --dry-run         show what would happen without changing anything
  -y, --yes             do not ask for confirmation
  -i, --interactive     pick branches to delete from a list
  --no-backup           do not create backup tags when deleting
  --prune <dur>         with backups: drop backup tags older than <dur>
  -h, --help            show this help
  -v, --version         print the version
`;
