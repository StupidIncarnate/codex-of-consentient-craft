# DEF-159: The assets link points at a different home than `npm run siegelense` writes to

| | |
|---|---|
| Kind | defect |
| Status | needs decision |
| Package | siegelense |
| Found | 2026-09-28, walkthrough case SL-189 |
| Moved from | `scrolls/walkthrough/LEDGER.md`, 2026-09-30 |

## What is wrong

In this repo `.dungeonmaster-assets/siegelense-assets` points at `/home/brutus-home/.dungeonmaster/siegelense` (the user-global home), but this repo's siegelense calls run through `npm run siegelense` (DEF-111), which writes evidence to `<repo>/.dungeonmaster/siegelense`. None of that evidence is reachable through the link, and every manifest path reports `linkPresent: false` (DEF-107).

## What should happen

Decide which home the assets link follows in the dogfood repo. Either the link targets the home the npm script uses (`<repo>/.dungeonmaster/siegelense`), or the paths siegelense prints go through a link that matches the home in use. Decide with DEF-107 and DEF-111.

## Where to look

`packages/siegelense/src/brokers/locations/repo-link-path-find/locations-repo-link-path-find-broker.ts`, `packages/siegelense/src/responders/install/link-create/install-link-create-responder.ts`.

## History

None.
