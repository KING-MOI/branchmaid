# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses
[semantic versioning](https://semver.org/).

## [Unreleased]

## [0.2.0] - 2026-11-17

### Added

- `undo` restores every branch deleted by the last sweep.
- `doctor` checks git, config and remote setup.
- `completion` prints bash, zsh and fish completion scripts.
- Per-command help via `branchmaid <command> --help`.
- `restore` accepts a tag, `--as <name>`, and offers a picker with no argument.
- `--protect`, `--author`, `--no-color` and `--json` for sweep.
- `--older-than` and `--prune` accept an ISO date.
- `BRANCHMAID_DEBUG=1` traces git commands.
- `schema.json` for editor completion; unknown config keys are rejected.

### Fixed

- Squash detection no longer crashes on branches with unrelated history.
- Branches are resolved by full ref, so a tag with the same name cannot shadow them.
- Base detection falls back to `origin/<branch>` when the local base is gone.
- Backups taken in the same second no longer collide.
- Empty repositories and missing repositories get clear errors.

## [0.1.0] - 2026-11-17

### Added

- `list` command showing local branches by age, with merged, squashed, gone
  and stale labels.
- `sweep` command that deletes merged and gone branches, with `--dry-run`,
  `--yes`, `--interactive`, `--remote` and `--no-backup`.
- Backup tags for every deleted branch, plus `backups` and `restore`.
- `init` and `config` commands.
- Configuration via `.branchmaidrc`, `.branchmaidrc.json` or `package.json`.
- `--mine`, `--sort`, `--limit`, `--names`, `--json` and `--fetch` options.
- Ahead and behind counts against base.
- Programmatic API exported from the package entry.

### Safety

- Branches checked out in any worktree are protected.
- A branch whose tip moved after scanning is skipped.
- Remote branches are only deleted if they still match the backed up commit.
- Branches sitting exactly on the base tip are not swept.
- follow up on type narrowing
- follow up on release checklist
- flaky test observed while testing
- double-check the macOS build behavior
- double-check the macOS build behavior
- follow up on exit codes
- follow up on config defaults
- considered cleanup logic; parked for now
- slow start observed while testing
- follow up on the retry path
- flaky test observed while testing
- double-check exit codes behavior
- considered cleanup logic; parked for now
- edge case observed while testing
- considered the macOS build; parked for now
- double-check config defaults behavior
- follow up on error messages
- follow up on ci caching
