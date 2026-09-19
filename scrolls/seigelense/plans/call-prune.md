# `prune`, the citation resolver, and `cleanup`'s `assetsAged`

One chunk, three deliverables that are really one: the citation resolver is the call. `prune` without it is `rm`
with extra steps.

---

## 1. Requirements, one row per distinct thing the spec says

Every citation is `scrolls/seigelense/siegelense-tooling.md` unless named otherwise.

| #   | Requirement                                                                                                      | Spec line     |
|-----|------------------------------------------------------------------------------------------------------------------|---------------|
| R1  | `prune` reclaims asset space deliberately rather than waiting for the age-out window                              | 2420          |
| R2  | Selector `olderThan: '7d'` — everything past the window                                                           | 2423          |
| R3  | Selector `instance: 'inst_9b2c'` — one instance's assets                                                          | 2424          |
| R4  | Selector `kind: 'video'` — and it COMBINES with `olderThan` (`kind: 'video', olderThan: '2d'`)                    | 2425          |
| R5  | Answers `freedMB`                                                                                                 | 2426          |
| R6  | Answers `removed[]`                                                                                               | 2426          |
| R7  | Answers `refused[]`, each row `{ id, why }`                                                                       | 2427–2428     |
| R8  | It REFUSES rather than warns — anything still cited STAYS                                                         | 2431          |
| R9  | Three citation kinds protect: a `VERIFIED` prelude, an open issue record, an open quest's `WALKED` line           | 2431, 256–263 |
| R10 | The refusal NAMES THE CITING FILE — a path and a run id the caller can open, never a bare claim                   | 2436          |
| R11 | The reference resolves through the quest id `start` recorded                                                      | 2437, 250–252 |
| R12 | An instance with no quest has nothing citing it and no protection — `unowned` working as intended                 | 2438          |
| R13 | `prune` acts on ASSETS and touches no instance; `cleanup` acts on STALE INSTANCES                                 | 2441–2442     |
| R14 | Assets AGE OUT by default over a configurable window                                                               | 244           |
| R15 | Video is the big one: it ages out FIRST and SEPARATELY                                                            | 248           |
| R16 | `prune` refuses a LIVE instance's assets, whoever started it                                                      | 312           |
| R17 | What is GONE answers as gone, never as empty — a pruned instance keeps a TOMBSTONE                                | 330–332       |
| R18 | The tombstone reads `pruned at 03:14, olderThan 7d` — when, and by which rule                                     | 331           |
| R19 | Never prune on `start` to make room                                                                                | 274           |
| R20 | `prune` needs the registry and the OS — no driver, no boot, no pool slot                                          | 299           |
| R21 | `cleanup` answers `assetsAged: { instances, freedMB }`                                                            | 2449          |
| R22 | `cleanup` never prunes evidence any of the three citations references                                              | 2453–2454     |
| R23 | `cleanup`'s `leftAlone` carries the citation refusal too, with the same named-file `why`                          | 1409          |
| R24 | Every call is `dungeonmaster siegelense <name>`                                                                    | 2270          |
| R25 | A clean walk raises no issue, so an issue-only rule unprotects a clean walk's baselines — hence the `WALKED` row  | 265–268       |

### Graded before the build

- **R9's middle row (an open ISSUE record) cannot be built.** There is no issue entity anywhere in this repo.
  `signoffContract` (`packages/shared/src/contracts/signoff/signoff-contract.ts`) carries `verdict`, `evidence`,
  `toSettle`, `workItemId`, `at` — no `instanceId`, no `runId`. `questNoteKindContract` enumerates
  `open-question | tooling-error | out-of-scope | walk-reset | walked` — no `issue`. A walker's defect becomes a
  failing test on disk or a quest note, never a record with typed ids a resolver can match. Build the two that can
  be; report the third as a GAP in the answer itself, never as "nothing cites this".
- **R15's video half is provably zero today.** No built step writes a `.webm`; `stepStatics.verbs.all` is six verbs
  and `video` is not among them. `kind: 'video'` therefore matches nothing — which is honest, not a silent zero,
  and the help entry says so.

---

## 2. The citation resolver

### What it answers

```
citationResolveBroker({ entry })
  → { references: CitationReference[], gaps: CitationGap[], blocked: ContentText | null }
```

- `references` — every citation found. Non-empty means REFUSE.
- `gaps` — every citation KIND that was not checked, and why. Never silently empty.
- `blocked` — a reason this instance's citation status could not be established at all (guild unknown, quest record
  unreadable). Non-null means REFUSE. Deleting is the irreversible move; refusing is not.

### How each kind resolves

| Kind               | Where it lives                                                              | Match                                                                                                        |
|--------------------|------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------|
| `walked-note`      | `<dmHome>/guilds/<guildId>/quests/<questId>/quest.json` → `planningNotes.questNotes[]` | `kind === 'walked'` AND `instanceId` re-parsed through siegelense's `instanceIdContract` equals the row's id, AND the quest is OPEN (`questStatusMetadataStatics.statuses[status].isTerminal === false`) |
| `verified-prelude` | `<quest.worktreePath>/.quest-plans/**.md`, one level of subdirectories        | a line containing the `VERIFIED` marker that ALSO names either this instance id or a `run_N` this instance's evidence tree actually holds |
| `open-issue`       | nowhere                                                                      | **UNRESOLVABLE** — reported as a `CitationGap`                                                               |

The quest id on the registry row is the entry point for all three (R11). `questId === null` → no quest, no citation,
no gap, no protection (R12). `questId` set but `guildId` null → `blocked`, because the quest folder resolves off the
guild and we will not guess.

### Why the `VERIFIED` match is shaped that way

A prelude's `VERIFIED` line names the RUN, not the instance (`siege-verification-remainder.md:929` —
`VERIFIED  run_7 · 2026-09-14 · prelude reached the entry, all produces: asserted`). The quest scopes it; the run id
identifies it. So a line naming `run_7` protects an instance that HAS a `run_7`. A line naming the instance id
directly is the stronger form and is matched too. No planner writes preludes yet (Part 7 item 3b, NOT STARTED), so
this resolver reads a directory that exists and files that do not yet carry the marker — it returns zero references
today and the moment a prelude lands it returns one, with no further work.

---

## 3. Build list, file by file

Every `contracts/` row is three files (`-contract.ts`, `-contract.test.ts`, `.stub.ts`); every `brokers/` and
`responders/` row is three (`-broker.ts` / `-responder.ts`, `.proxy.ts`, `.test.ts`); every `transformers/` and
`statics/` row is two.

### statics

| File                                             | Holds                                                                            |
|--------------------------------------------------|----------------------------------------------------------------------------------|
| `statics/prune/prune-statics.ts`                 | default window `7d`, video window `2d`, the `olderThan` unit table, bytes-per-MB |
| `statics/citation/citation-statics.ts`           | `.quest-plans` dirname, the `VERIFIED` marker, the markdown extension, the walked note kind |

### contracts

| Folder                        | Shape                                                                                              |
|-------------------------------|----------------------------------------------------------------------------------------------------|
| `contracts/prune-asset-kind/` | `z.enum(['video','shot','transcript','log'])`                                                       |
| `contracts/prune-asset/`      | `{ path, kind, sizeBytes, modifiedAtMs }`                                                           |
| `contracts/prune-query/`      | `{ instanceId: InstanceId\|null, kind: PruneAssetKind\|null, olderThan: ElapsedText }` `.strict()`  |
| `contracts/prune-args/`       | `{ query: PruneQuery, human: boolean }` `.strict()`                                                 |
| `contracts/prune-removal/`    | `{ id, kind, freedBytes, freedMB, tombstoned }`                                                     |
| `contracts/prune-refusal/`    | `{ id, why }`                                                                                       |
| `contracts/prune-answer/`     | `{ freedMB, freedBytes, removed[], refused[], unresolved: CitationGap[] }` `.strict()`               |
| `contracts/citation-kind/`    | `z.enum(['verified-prelude','open-issue','walked-note'])`                                           |
| `contracts/citation-reference/` | `{ kind, instanceId, runId: RunId\|null, citingFile, why }`                                       |
| `contracts/citation-gap/`     | `{ kind, why }`                                                                                     |
| `contracts/citation-resolution/` | `{ references[], gaps[], blocked: ContentText\|null }`                                            |
| `contracts/cleanup-answer/`   | **EDIT** — grows `assetsAged: { instances, freedMB }`                                               |

`freedBytes` sits beside the spec's `freedMB` deliberately: `Megabytes` is `.int()`, so a real reclaim of a few
kilobytes renders as `0` — a reported zero over a real deletion is the one number this call must never get wrong.

### brokers

| Folder                                                | Job                                                                     |
|-------------------------------------------------------|-------------------------------------------------------------------------|
| `brokers/locations/prune-asset-paths-find/`            | `<evidenceDir>` → `{ runsDir, heartbeat, apiLog, webLog, driverLog, bootFailure, shutdownReason }` |
| `brokers/locations/citation-quest-file-path-find/`     | `{ guildId, questId }` → `<questFolder>/quest.json`                     |
| `brokers/locations/citation-quest-plans-path-find/`    | `{ worktreePath }` → `<worktreePath>/.quest-plans`                      |
| `brokers/citation/resolve/citation-resolve-broker.ts`  | the entry — loads the quest, dispatches both layers, assembles gaps     |
| `brokers/citation/resolve/walked-note-layer-broker.ts` | the `WALKED` half                                                       |
| `brokers/citation/resolve/verified-prelude-layer-broker.ts` | the prelude half                                                   |
| `brokers/prune/assets-list/prune-assets-list-broker.ts`| one instance's evidence tree → `PruneAsset[]`, resolver-driven          |
| `brokers/prune/run/prune-run-broker.ts`                | the whole call                                                          |
| `brokers/cleanup/run/assets-age-layer-broker.ts`       | `cleanup`'s `assetsAged`, over the same two brokers                     |
| `brokers/cleanup/run/cleanup-run-broker.ts`            | **EDIT** — calls the new layer, adds citation rows to `leftAlone`       |

### transformers

| Folder                                    | Job                                                            |
|-------------------------------------------|----------------------------------------------------------------|
| `transformers/prune-older-than-parse/`    | `'7d'` → ms; refuses anything else by name                     |
| `transformers/prune-asset-classify/`      | a file name → `PruneAssetKind \| null`, by extension           |
| `transformers/prune-args-parse/`          | argv → `PruneArgs`                                             |
| `transformers/prune-answer-render/`       | `PruneAnswer` → the operator's table (`--human`)               |
| `transformers/cleanup-answer-render/`     | **EDIT** — prints `ASSETS AGED:`                               |

### responders

`responders/siegelense/prune/siegelense-prune-responder.ts` — JSON by default, the table on `--human`.

### tests

- One unit test per file above (10 contracts, 10 brokers, 4 transformers, 1 responder, 2 statics).
- `brokers/prune/run/prune-run-broker.integration.test.ts` — a REAL temp tree via `installTestbedCreateBroker`,
  modelled on `profile-sample-record-broker.integration.test.ts`. The four assertions that must be real:
  1. a cited instance is REFUSED and the refusal string carries the real citing file path and the real run id;
  2. an uncited instance past the window IS removed and `freedBytes` equals the bytes actually on disk;
  3. `prune { instance }` takes that instance's assets and the neighbour's files still exist afterwards;
  4. a live instance's assets are never taken, whatever the window says.

**Write order: the refusal path and its tests BEFORE the delete path.** Deleting is the one irreversible thing here.

---

## 4. What changes for the coordinator

`cleanupAnswerContract` grows `assetsAged`, which breaks three `toStrictEqual` blocks in
`packages/siegelense/src/flows/siegelense/siegelense-flow.integration.test.ts` and two in
`packages/siegelense/src/responders/siegelense/cleanup/siegelense-cleanup-responder.test.ts` —
both files this agent does not own. The exact edits go in `tmp/siegelense-wiring/prune.md`.

---

## 5. Three decisions the build made that the plan above did not

**`instancePruneLayerBroker` became `pruneInstanceReclaimBroker`, its own domain.** `cleanup` ages
assets through the same reclaim, and `enforce-import-dependencies` refuses a cross-domain import of
a LAYER file — the same wall the ledger records `compareReadBroker` hitting. One entry file at
`brokers/prune/instance-reclaim/` is what lets `prune` and `cleanup` share one refusal rule instead
of keeping two copies of it.

**`cleanupRunBrokerProxy` constructs the age proxy FIRST, and the order is load-bearing.**
Constructed last, its chain re-stamps `pathJoinAdapter`'s and `osHomedirAdapter`'s sticky defaults
after the lock and reap chains, and six cleanup tests then fail with
`Failed to read file at /home/default/.dungeonmaster/siegelense/boot.lock`. Measured both ways; the
proxy carries the finding as a comment.

**The integration suite exercises deletion with `--older-than 0s`.** There is no adapter in this
package for backdating an mtime, so a file the suite wrote is seconds old; `0s` is the explicit
"everything up to this instant" form the parser accepts. A separate sweep at `7d` over the same
fresh tree is what proves the window protects evidence rather than the test simply choosing a window
nothing matched.
