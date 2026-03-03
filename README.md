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

## License

MIT © 2026 Aditya Verma
