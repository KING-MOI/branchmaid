# Contributing

Thanks for taking the time to help.

## Setup

```sh
git clone https://github.com/adityaverma/branchmaid
cd branchmaid
npm install
```

## Checks

```sh
npm run lint       # prettier --check
npm run typecheck  # tsc --noEmit
npm test           # vitest
npm run build      # emit dist/
```

Tests create throwaway git repositories in your temp directory, so you need
git 2.41 or newer on your PATH.

## Pull requests

- Keep each pull request focused on one change.
- Add or update a test when you change behaviour.
- Run `npm run format` before committing.
