export const HELP = `branchmaid - tidy up stale git branches safely

Usage
  branchmaid [command] [options]

Commands
  list            show local branches, oldest first (default)

Options
  --base <name>         branch to compare against (default: origin HEAD, main or master)
  --older-than <dur>    staleness threshold, e.g. 30d, 2w, 3mo (default: 30d)
  --merged              only show branches merged into base
  --gone                only show branches whose upstream was deleted
  --stale               only show branches older than the threshold
  --squash              also detect squash-merged branches (slower)
  --json                print JSON instead of a table
  -h, --help            show this help
  -v, --version         print the version
`;
