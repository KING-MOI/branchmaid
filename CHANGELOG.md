# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses
[semantic versioning](https://semver.org/).

## [Unreleased]

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
