# DEF-107: `linkPresent` in the manifest and status paths reads as broken

| | |
|---|---|
| Kind | defect |
| Status | ready |
| Package | siegelense |
| Found | 2026-09-28, walkthrough cases SL-029, SL-051 |
| Moved from | `scrolls/walkthrough/LEDGER.md`, 2026-09-30 |

## What is wrong

Items 2 and 5 of DEF-107 are open.

(2) `linkPresent` (`repo-local-path-contract.ts:39`, `linkPresent: z.boolean()`) means the `.dungeonmaster-assets` symlink exists. The user could not tell what it means.
(5) SL-051: with `DUNGEONMASTER_HOME=<repo>/.dungeonmaster` (the `npm run siegelense` script) every manifest path reads `linkPresent: false` although each path is repo-local and readable. The flag must not read as broken when the home is already inside the repo.

The contract has about 35 users, orchestrator included. Today `linkPresent` appears in the manifest, kill result, evidence listing and status paths.

## What should happen

Items 1, 3 and 4 are fixed (see History). Items 2 and 5, the `linkPresent` flag, follow the user's DEF-159 decision of 2026-09-30: when the home in use is inside the repo, print the real path and emit no `linkPresent` at all; when it is outside, print through the link and say so plainly only when the link is missing or points at another home. Build this together with DEF-159.

## Where to look

- `packages/siegelense/src/contracts/repo-local-path/repo-local-path-contract.ts:39`
- `packages/siegelense/src/brokers/locations/repo-link-path-find/locations-repo-link-path-find-broker.ts:45-57` (returns `linkPresent: false` with the real home path)
- every contract and renderer that embeds it: `instance-manifest`, `kill-result`, `instance-evidence-listing`, `instance-status`; also search `packages/orchestrator` for `repoLocalPathContract`.

## History

Items 1, 3 and 4 fixed, built (`e79f23046`, merge `1f0e102ca`): `evidenceComplete` became `lastRunSaved`; one `memory` field (`instance-status-contract.ts:47`); `lastOomAt` removed.
