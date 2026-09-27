# A19: `adapters` stops being a folder type; caller-facing lint rules turn on

| | |
|---|---|
| Phase | Phase 2 — delete every adapter |
| Source | `scrolls/gateway/followup-sustainability.md` "Finished when" (358-366) and item 29 (685-700); `scrolls/adapters-to-one-place.md` "Migration order" step 3 |
| Needs | [A18](a18-raw-calls-and-dependency-cleanup.md) |
| Unblocks | [B02](b02-contract-index-and-unused-contracts.md), [B14](b14-type-alias-and-adhoc-type-rules.md), [B18](b18-returns-say-what-happened.md), every Phase 3+ item that assumes `adapters` is gone |
| Packages touched | shared, eslint-plugin, mcp (folder-type doc/contract only) |
| Checks to run | lint, typecheck, unit, integration |
| Split | one agent |
| Runs alone | yes — this item changes shared, repo-wide lint config and folder-structure enforcement all at once; no other agent may be editing any package while this lands, since a package still mid-migration would suddenly fail the newly-turned-on rules |

## Why

Every adapter is gone (A00-A18). This item is the two mechanical flips that make that permanent: the folder type
itself stops existing, so nothing can create a new `adapters/` folder, and the three caller-facing lint rules that
have shipped commented-out since the gateway build turn on for real, so nothing can quietly reach for a raw
import again.

## Current state

Confirmed 2026-09-26 by reading the real files.

- `packages/eslint-plugin/src/brokers/config/dungeonmaster/config-dungeonmaster-broker.ts`, lines 148-155, reads:
  ```ts
  '@dungeonmaster/gateway-dependency-declared': 'error',
  // Ready — measured against every non-gateway package in scrolls/gateway-build/lint-measurements.md
  // — and turns on once callers migrate (migration order step 3 in scrolls/adapters-to-one-place.md).
  // '@dungeonmaster/raw-import-ban': 'error',
  // Ready — same measurement, same migration-order step 3 gate as raw-import-ban above.
  // '@dungeonmaster/platform-globals-ban': 'error',
  // Ready — same measurement, same migration-order step 3 gate as raw-import-ban above.
  // '@dungeonmaster/bin-program-spawn-ban': 'error',
  ```
  All three rules already exist and are already wired into `dungeonmasterCustomRules` — they are commented OUT,
  not unbuilt. This item's whole job for this file is to uncomment these three lines.
- `packages/shared/src/statics/folder-config/folder-config-statics.ts` has an `adapters:` entry (around line 154)
  with `fileSuffix: '-adapter.ts'`, `folderPattern: 'adapters/[package]/[operation]/…'`, and its own
  `allowedImports` list including `'@dungeonmaster/shared/adapters'` — confirming shared's adapters barrel really
  is baked into the architecture rules (see [A12](a12-adapters-shared.md)). Delete the whole `adapters:` entry.
- **Six OTHER folder types' own `allowedImports` arrays list `'adapters/'`** (confirmed by a direct search of the
  same file — hits beyond the `adapters:` entry's own block, at minimum for `brokers`, `responders` and several
  others; read each one) — every one of those has to drop the `'adapters/'` entry from its own list, not just the
  `adapters:` block itself.
- `packages/shared/src/contracts/folder-type/folder-type-contract.ts` is very likely a `z.enum([...])` built from
  `folderConfigStatics`'s keys (confirmed by the brands doc's "Found along the way" table: "`FolderType` is
  `z.string()` in mcp and `z.enum` in shared under the same brand text — Known bug"). Once `adapters` leaves
  `folderConfigStatics`, this enum drops it too — check whether it is generated (no code change needed beyond the
  statics) or hand-listed (needs its own edit).
- `packages/mcp/src/contracts/folder-type/folder-type-contract.ts` is the OTHER copy the same "Found along the
  way" row names — a bare `z.string()` under the identical brand text, so it enumerates nothing and needs no
  change here. **Do not fix the brand-collision bug itself in this item** — that is [B11](b11-unique-contract-names.md)'s
  job ("fixes the `FolderType` bug"); this item only removes `adapters` from whichever copy actually enumerates.
- `enforce-project-structure` (an eslint-plugin rule) reads `folderConfigStatics` to know which folders exist —
  removing the `adapters:` entry is what makes it refuse a new `adapters/` folder; no separate code change should
  be needed in the rule itself, but confirm by testing it (create a scratch `adapters/` folder somewhere under
  `<repoRoot>/tmp`, in a location it would lint, and confirm the rule now refuses it — delete the scratch folder
  after).
- The `<dungeonmaster-folderTypes>` session snippet (which every agent's context carries) is GENERATED from
  `folderConfigStatics` by code in `packages/mcp` (per the root `CLAUDE.md`'s "Regenerating .claude/settings.json"
  table and the gateway follow-up's own docs-to-update list). **Check whether removing the `adapters:` entry alone
  makes the generator stop emitting the `adapters/` row**, or whether the generator needs its own edit — if the
  snippet still lists `adapters/` after this item's statics change and a re-run of `dungeonmaster init`, that is a
  real finding to report, not something to silently patch around.

## Work

1. Delete the `adapters:` entry from `packages/shared/src/statics/folder-config/folder-config-statics.ts`.
2. Remove every OTHER folder type's `'adapters/'` entry from its own `allowedImports` array in the same file —
   read the whole file and fix every occurrence, not just the ones this item's own research already found.
3. Check `packages/shared/src/contracts/folder-type/folder-type-contract.ts`: if it is generated from
   `folderConfigStatics`'s keys, confirm `adapters` is gone automatically; if it is a hand-listed `z.enum`, remove
   `adapters` from the list by hand.
4. Confirm `enforce-project-structure` now refuses a scratch `adapters/` folder (test under `<repoRoot>/tmp`,
   delete the scratch folder afterward — never leave test scaffolding in the repo).
5. Uncomment the three lines in `config-dungeonmaster-broker.ts`:
   `'@dungeonmaster/raw-import-ban': 'error'`, `'@dungeonmaster/platform-globals-ban': 'error'`,
   `'@dungeonmaster/bin-program-spawn-ban': 'error'`.
6. Before step 5's `platform-globals-ban` line goes live, close its two known gaps (the follow-up doc's own words,
   item 29):
   - **Object shorthand.** The rule "misses a global used as an object shorthand, such as `{ fetch }`" — find the
     rule's implementation (`packages/eslint-plugin/src/brokers/rule/platform-globals-ban/`) and extend its global
     detection to catch a shorthand property whose key is a bare global identifier.
   - **`page.evaluate` callbacks.** The rule "does not special-case siegelense's `page.evaluate` callbacks, which
     run in the driven browser, not in siegelense's own process" — add a carve-out so a global referenced INSIDE a
     `page.evaluate(() => { … })` callback (or an equivalent template-literal source string, per
     [A13](a13-adapters-siegelense.md)'s `paste-layer-adapter.ts`/`storage-read-layer-adapter.ts` split) is not
     flagged, since that code runs in the browser process the gateway rule cannot see or reach.
7. At the SAME moment the three rules go live, also ban the old `@dungeonmaster/<folder>/...` import form (for
   example `@dungeonmaster/shared/adapters`, now deleted, or any other cross-package folder-path import that
   bypasses a package's real public surface) — read the gateway follow-up doc's own words: "Otherwise a caller
   that switched early and one that did not both keep passing." Confirm the mechanism for this ban (it may already
   be part of `raw-import-ban`'s own scope, or it may need a small addition — check the rule's real implementation
   before assuming either way).
8. Run the newly-enabled rules as a scan over the WHOLE repo before this item is done, and hand-check a sample of
   what they flag and what they let through, per the epic's own standing rule for every new lint rule.
9. Do NOT touch any teaching text in this item (the `<dungeonmaster-folderTypes>` snippet's PROSE, `CLAUDE.md`
   files, `get-architecture`, `get-folder-detail`) — that is [Z01](z01-gateway-folder-type-doc.md)-[Z04](z04-claude-md-and-agents-md.md)'s
   job, done last. This item only checks whether the SNIPPET-GENERATING CODE reacts correctly to the statics
   change (step above), not the words it teaches.

## Done when

- `folderConfigStatics` has no `adapters` key, and no other folder type's `allowedImports` mentions `'adapters/'`
  or `'@dungeonmaster/shared/adapters'`.
- A scratch `adapters/` folder under `<repoRoot>/tmp` fails `enforce-project-structure`.
- `raw-import-ban`, `platform-globals-ban` and `bin-program-spawn-ban` are all `'error'`, uncommented, in
  `config-dungeonmaster-broker.ts`.
- `platform-globals-ban`'s object-shorthand gap and its `page.evaluate` carve-out are both built and covered by a
  test.
- A full `npm run ward` (the operator's job, not a dispatched agent's) exits 0 with all three rules live.

## Traps

- **This item cannot land until every A0x package item (A00-A18) is fully done.** Turning these rules on while
  even one package still has a raw import left breaks that package's lint outright. Confirm with the operator
  before starting.
- The two `platform-globals-ban` gaps are REAL, unbuilt work, not documentation to update — do not skip them
  assuming "the rule is ready" from the comment's own words alone; the comment says the rule is ready against
  every NON-GATEWAY package's callers, which is a different claim from "the rule has no known gaps."
- `folderConfigStatics`'s `adapters:` entry removal is the trigger for several OTHER things (the folder-type
  contract, the generated session snippet, `enforce-project-structure`) — trace each one rather than assuming a
  single statics edit is the whole item.

## Concessions made while executing

<!-- Empty at the start. The operator fills this and mirrors it into EPIC.md's Concessions table. -->
