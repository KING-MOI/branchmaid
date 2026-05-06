# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses
[semantic versioning](https://semver.org/).

## [Unreleased]

### Added

- `list` command showing local branches by age, with merged, squashed, gone
  and stale labels.
- `sweep` command that deletes merged and gone branches, with `--dry-run`,
  `--yes`, `--interactive`, `--remote` and `--no-backup`.
- Backup tags for every deleted branch, plus `backups` and `restore`.
- `init` and `config` commands.
- Configuration via `.branchmaidrc`, `.branchmaidrc.json` or `package.json`.
