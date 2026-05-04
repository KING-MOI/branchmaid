# branchmaid

[![ci](https://github.com/adityaverma/branchmaid/actions/workflows/ci.yml/badge.svg)](https://github.com/adityaverma/branchmaid/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/branchmaid.svg)](https://www.npmjs.com/package/branchmaid)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Tidy up stale git branches safely.

branchmaid lists your local branches by age, works out which ones are merged
or whose remote is gone, and deletes them for you. Every deletion leaves a
backup tag behind, so nothing is ever more than one command away from coming back.

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

Run `branchmaid init` to write the defaults, and `branchmaid config` to see
what is in effect.

## License

MIT © 2026 Aditya Verma
