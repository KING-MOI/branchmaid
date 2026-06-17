# branchmaid

[![ci](https://github.com/adityaverma/branchmaid/actions/workflows/ci.yml/badge.svg)](https://github.com/adityaverma/branchmaid/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/branchmaid.svg)](https://www.npmjs.com/package/branchmaid)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Tidy up stale git branches safely.

branchmaid lists your local branches by age, works out which ones are merged
or whose remote is gone, and deletes them for you. Every deletion leaves a
backup tag behind, so nothing is ever more than one command away from coming back.

## Requirements

- Node.js 20.12 or newer
- git 2.41 or newer

## Install

```sh
npx branchmaid
```

or install it globally:

```sh
npm install -g branchmaid
```

## Usage

```sh
branchmaid                 # list branches, oldest first
branchmaid --merged        # only merged branches
branchmaid sweep -n        # preview what sweep would delete
branchmaid sweep           # delete merged and gone branches (asks first)
branchmaid sweep -i        # pick branches by hand
branchmaid restore feat/x  # bring a deleted branch back
```

## Scripting

`--names` prints one branch per line and `--json` prints everything branchmaid
knows, so it composes with other tools:

```sh
branchmaid --gone --names | xargs -n1 git log -1 --oneline
branchmaid --json | jq '.[] | select(.ahead > 0) | .branch.name'
branchmaid sweep --yes --json > sweep-report.json
```

Without a terminal, `sweep` refuses to delete anything unless you pass `--yes`.

## Shell completion

```sh
branchmaid completion bash >> ~/.bashrc
branchmaid completion zsh > "${fpath[1]}/_branchmaid"
branchmaid completion fish > ~/.config/fish/completions/branchmaid.fish
```

## Troubleshooting

Set `BRANCHMAID_DEBUG=1` to print every git command branchmaid runs:

```sh
BRANCHMAID_DEBUG=1 branchmaid sweep -n
```

## Backups

Before a branch is deleted, branchmaid tags its tip as
`branchmaid/backup/<timestamp>/<branch>`. Tags are cheap and keep the commits
alive, so a deleted branch can always be brought back:

```sh
branchmaid backups                    # list backups, newest first
branchmaid restore feat/x             # recreate feat/x from its newest backup
branchmaid restore feat/x --as feat/y # under a different name
branchmaid backups --prune 90d        # drop backups older than 90 days
```

Backup tags are local. They are not pushed unless you push tags yourself.

## How branches are classified

| label      | meaning                                                                    |
| ---------- | -------------------------------------------------------------------------- |
| `merged`   | every commit on the branch is reachable from base                          |
| `squashed` | the branch's changes landed on base as a single squash commit (`--squash`) |
| `gone`     | the branch tracked a remote branch that no longer exists                   |
| `stale`    | the last commit is older than `--older-than`                               |

The current branch, the base branch, branches checked out in another worktree
and anything matching `protected` are never deleted.

A merged branch that points at exactly the same commit as base is left alone
by `sweep`: it was most likely created a moment ago. It gets swept once base
moves on.

## Configuration

branchmaid reads its settings from the first of these it finds at the root of
your repository:

1. `.branchmaidrc` (JSON)
2. `.branchmaidrc.json`
3. the `branchmaid` key in `package.json`

```json
{
  "base": "main",
  "protected": ["main", "master", "develop", "release/*"],
  "squash": false,
  "sweep": {
    "olderThan": "30d",
    "merged": true,
    "gone": true,
    "stale": false
  }
}
```

| key               | default                         | meaning                                            |
| ----------------- | ------------------------------- | -------------------------------------------------- |
| `base`            | origin HEAD, `main` or `master` | branch that "merged" is measured against           |
| `protected`       | `main`, `master`, `develop`     | glob patterns that are never listed for deletion   |
| `squash`          | `false`                         | also detect squash-merged branches                 |
| `sweep.olderThan` | `30d`                           | a branch is stale once its last commit is this old |
| `sweep.merged`    | `true`                          | sweep branches merged into base                    |
| `sweep.gone`      | `true`                          | sweep branches whose upstream was deleted          |
| `sweep.stale`     | `false`                         | sweep stale branches even when they are not merged |

Point your editor at the bundled schema for completion and validation:

```json
{ "$schema": "./node_modules/branchmaid/schema.json" }
```

Unknown keys are rejected, so a typo like `olderthan` fails loudly instead of
being ignored.

Run `branchmaid init` to write the defaults, and `branchmaid config` to see
what is in effect.

## License

MIT © 2026 Aditya Verma
