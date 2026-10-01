# DEF-159: The assets link points at a different home than `npm run siegelense` writes to

| | |
|---|---|
| Kind | defect |
| Status | ready |
| Priority | P2: evidence is not reachable through the assets link |
| Package | siegelense |
| Found | 2026-09-28, walkthrough case SL-189 |
| Moved from | `scrolls/walkthrough/LEDGER.md`, 2026-09-30 |

## What is wrong

In this repo `.dungeonmaster-assets/siegelense-assets` points at `/home/brutus-home/.dungeonmaster/siegelense` (the user-global home), but this repo's siegelense calls run through `npm run siegelense` (DEF-111), which writes evidence to `<repo>/.dungeonmaster/siegelense`. None of that evidence is reachable through the link, and every manifest path reports `linkPresent: false` (DEF-107).

## What should happen

**Decided by the user, 2026-09-30: link only when needed.**

- When the home in use (`DUNGEONMASTER_HOME`) is inside the repo, siegelense prints the real path. It makes no link and emits no `linkPresent` flag, because the files are already readable. This covers this repo's `npm run siegelense` and `npm run prod`.
- When the home is outside the repo (a consumer's `~/.dungeonmaster`), siegelense prints paths through `.dungeonmaster-assets/siegelense-assets`, as today.
- When the link exists but points somewhere other than the home in use, siegelense says so once, in plain words, with the command to fix it.

This settles DEF-107 items 2 and 5 (`linkPresent` reading as broken) too.

## Where to look

`packages/siegelense/src/brokers/locations/repo-link-path-find/locations-repo-link-path-find-broker.ts`, `packages/siegelense/src/responders/install/link-create/install-link-create-responder.ts`.

## History

None.
