# `snapshots` — the call, and the record it lists

One of the six unbuilt calls. This plan covers `dungeonmaster siegelense snapshots --instance <id>`, the
`SnapshotRecord` it lists, and the writer that mints the automatic `run_N:start` / `run_N:end` pair.

Spec: `scrolls/seigelense/siegelense-tooling.md`. Ledger row: `build-ledger.md`, "The thirteen calls,
individually", `snapshots` (line 177). Build-order item: Part 7 #14.

---

## 1. Requirements table

One row per distinct thing the spec says `snapshots` — and the record behind it — must do.

| # | Requirement | Spec line | In this chunk |
|---|---|---|---|
| R1 | `snapshots { instance }` returns a LIST of what `reset level: 'state'` can return to | 2469, 2472-2475 | yes |
| R2 | Each entry carries `name`, a time, and `manual` (a boolean) | 2473-2475 | yes — `atMs` rather than a rendered clock; see §6 |
| R3 | Two kinds of entry exist: manual names, and automatic ones | 2478 | yes |
| R4 | The automatic pair is `run_N:start` / `run_N:end`, one pair per run | 2630-2634 | yes |
| R5 | The automatic pair is minted by the RUN, at start and at end, not by a caller | 2630, 2643 | yes — `runExecuteBroker` |
| R6 | Automatic names are NAMESPACED so an explicit name can never collide | 2630 | yes — a manual name carrying the automatic suffix is refused at capture |
| R7 | A manual snapshot is NAMED, and placeable anywhere in a batch | 2622-2628 | broker half only — the `snapshot` STEP VERB is not built (§7) |
| R8 | A `reset` naming a snapshot that does not exist is an ERROR, never a fall-back to the nearest | 2478-2479, 2640-2641 | yes — `snapshotResolveBroker` + `SnapshotMissingError` |
| R9 | `level: 'state'` takes an explicit `to`, and a reset to the wrong point is the tainted-baseline failure | 2618-2620 | no — `reset` is not built (§7) |
| R10 | A snapshot covers the STATE subtree ONLY — logs, captures and the transcript sit outside it and survive | 1055-1061 | yes — the payload copies `lane.homePath`; `evidencePath` is never touched |
| R11 | Snapshots are gone with the instance — not evidence that outlives it | ledger row 177; 1060-1061 | yes — the store lives INSIDE the throwaway home, which `kill` removes |
| R12 | `snapshots` starts nothing and needs no live instance | 2275-2276 | yes — reads the home off disk, never the driver socket |
| R13 | Every answer carries an instance state, so a reading is never mistaken for a live one | 2239 (stated for `results`) | yes — `instanceState` on `SnapshotsAnswer`; see §5 |
| R14 | Every run also snapshots at start AND at end — mirrors the capture policy | 2643-2644 | yes |
| R15 | The manual and the automatic ones answer different questions; the automatic pair costs a copy per run boundary | 2636-2638 | yes — a real recursive copy, not a marker |
| R16 | Retention is a knob: keep the most recent N plus every manually named one | 2646-2648 | NO — knob documented, enforcement not built (§7) |
| R17 | A `reset` REPORTS the diff it undid, and names what it did NOT clear | 1063-1066, 2613-2614 | no — `reset` is not built (§7) |
| R18 | The three levels — `page`, `state`, `instance` — each declaring what they keep | 1047-1053 | no — Part 7 #14's other half (§7) |
| R19 | A cycle is two calls per turn: `run` with a `snapshot` step, then `reset … to:` next cycle | 2939-2965 | no — needs R7 and R9 |

`reset` itself is out of scope for this call (`snapshots` LISTS; `reset` CONSUMES). R8 is in scope
anyway because it is a rule about the LOOKUP, and the lookup primitive is what `reset` will call.

---

## 2. Where a snapshot record is written, and by what

**The store is `<throwawayHome>/.siegelense-snapshots/`.** Two things in it:

```
<home>/.siegelense-snapshots/
  index.jsonl      one SnapshotRecord per line, append-only, in capture order
  1/  2/  3/ …     one payload directory per capture — a recursive copy of <home>
                   with .siegelense-snapshots itself excluded
```

**Why inside the home, and not under the evidence tree.** Two spec rules pin it there and nowhere else:

- R10: a snapshot covers the STATE subtree, and the state subtree IS `lane.homePath` — the evidence
  directory holds `api-server.log`, `web-server.log`, the shots and the transcript, and
  `laneTeardownBroker` never passes it to `fsRmAdapter`.
- R11: snapshots die with the instance. `laneTeardownBroker` removes exactly `session.homePath` and
  nothing else, so the only placement that dies on `kill` without editing teardown is inside that
  directory.

A store inside the tree it copies is recursive, so the copy EXCLUDES the store. That is also the
`<home>`-relative expression of R10's boundary: everything else in the home rewinds, the store does not.

**Who writes.** `runExecuteBroker` — once before the first step (`run_N:start`), once after the last
(`run_N:end`). Both through `snapshotCaptureBroker`, both `manual: false`. A capture failure is written
to stderr and the run continues: an evidence/restore-point write must never replace a walk's own
result (`step-dispatch-broker.ts` already follows that rule for a failure capture). **No record is
appended unless the payload landed**, so the list never advertises a restore point that is not there.

**Who reads.** `snapshotListBroker`, from the instance id alone —
`locationsInstanceHomePathFindBroker` resolves `<os.tmpdir()>/dm-siege-<id>` deterministically, so the
call needs no registry lookup for the path and no driver (R12). A killed instance's home is gone, the
index read answers `[]`, and `instanceState: 'killed'` on the answer is what tells that apart from a
live instance that has simply run nothing yet (R13).

---

## 3. File-by-file build list

Every path is under `packages/siegelense/src/` unless stated.

### contracts/ (each: `-contract.ts`, `-contract.test.ts`, `.stub.ts`)

| Folder | Shape |
|---|---|
| `contracts/snapshot-name/` | branded string, `^[A-Za-z0-9._:-]+$`, max `snapshotStatics.limits.maxNameLength` |
| `contracts/snapshot-ordinal/` | branded int `>= 1` — which payload directory a capture is |
| `contracts/snapshot-boundary/` | `z.enum(['start', 'end'])`, branded — which half of the automatic pair |
| `contracts/snapshot-record/` | `{ name, atMs, manual, path }`, `.strict()` |
| `contracts/snapshots-answer/` | `{ instanceId, instanceState, snapshots }` |
| `contracts/snapshots-args/` | `{ instanceId }`, `.strict()` |

### statics/

- `statics/snapshot/snapshot-statics.ts` (+ test) — `store.dirName` / `store.indexFileName`,
  `automatic.startSuffix` / `automatic.endSuffix`, `limits.maxNameLength`, `numbering.firstPayload`,
  `retention.keepAutomatic` (the knob R16 names; nothing enforces it this chunk, and the static's own
  comment says so).

These stay OUT of `locationsStatics`, for the reason `evidenceFileStatics`' header already gives: that
file's `no-bare-location-literals` ban is repo-wide, so a fragment landing there claims every other
package's unrelated use of the same string.

### errors/

- `errors/snapshot-missing/snapshot-missing-error.ts` (+ test) — names the snapshot asked for AND lists
  what exists. R8: the message is how a caller learns the tool did not substitute a neighbour.
- `errors/snapshot-index-unreadable/snapshot-index-unreadable-error.ts` (+ test) — a PRESENT but
  unparseable index throws rather than reading as empty, the same reasoning `RegistryUnreadableError`
  carries: collapsing "broken" into "empty" is how a session concludes there is nothing to return to.

### brokers/ (each: `-broker.ts`, `-broker.proxy.ts`, `-broker.test.ts`)

| Folder | In → out |
|---|---|
| `brokers/locations/snapshot-paths-find/` | `{ homePath, ordinal }` → `{ storeDir, index, payload }`; pure, `pathJoinAdapter` real, empty proxy — mirrors `locations-run-paths-find-broker` exactly so it queues no `pathJoinAdapter` one-shots |
| `brokers/snapshot/index-read/` | `{ homePath }` → `readonly SnapshotRecord[]` in capture order; absent index ⇒ `[]` via `fsStatAdapter` |
| `brokers/snapshot/capture/` | `{ homePath, name, manual }` → `SnapshotRecord`; copies, then appends |
| `brokers/snapshot/resolve/` | `{ homePath, name }` → `SnapshotRecord`, else `SnapshotMissingError` |
| `brokers/snapshot/list/` | `{ instanceId }` → `SnapshotsAnswer` |

### transformers/ (each: `-transformer.ts`, `-transformer.test.ts`)

- `transformers/snapshot-auto-name/` — `{ runId, boundary }` → `SnapshotName` (`run_4` + `:start`).
- `transformers/snapshot-index-collapse/` — `{ records }` → latest-per-name, ordered by `atMs`
  ascending. One rule in one place, so `list` and `resolve` can never disagree about which `clean` is
  current.
- `transformers/snapshots-args-parse/` — argv → `SnapshotsArgs`. `--instance` required (there is no
  bare fleet form: a snapshot belongs to one instance), `--json` accepted, everything else refused by
  name. Modelled on `kill-args-parse-transformer`.

### responders/

- `responders/siegelense/snapshots/SiegelenseSnapshotsResponder` (+ proxy, test) — calls
  `snapshotListBroker`, writes one JSON document to stdout. No registry-miss check of its own: an
  unknown id is a REAL answer with `instanceState: 'unknown'` and `snapshots: []`, the same shape
  `resultsReadBroker` gives (spec 2319: "`pruned` and `unknown` are real answers, not empty results").

### brokers/run/ — the writer

- `brokers/run/execute/run-execute-broker.ts` — two `snapshotCaptureBroker` calls, one per run
  boundary, both fire-and-forget-on-failure. Its proxy gains a `snapshotCaptureBrokerProxy()` child and
  a `capturedSnapshots()` reader.

### OUTSIDE my owned paths — one file

- `adapters/fs/cp/fs-cp-adapter.ts` (+ proxy, test) — `readdir` plus one `fs.cp` per child, skipping
  one top-level entry by name. **It cannot be a single `fs.cp` of the whole tree**: `fs.cp` refuses a
  destination inside its own source (`EINVAL: cannot copy <home> to a subdirectory of self
  <home>/.siegelense-snapshots/1`), and the store lives inside the home precisely so `kill` removes
  it. Copying each child separately makes every destination a sibling path rather than a descendant.
  There is no recursive-copy adapter anywhere in the repo
  (`packages/siegelense/src/adapters/fs/**` and `packages/shared/src/adapters/fs/**` both checked),
  and a snapshot that is not a copy is not a snapshot. A brand-new adapter folder, so it collides with
  no other agent's work; flagged in the report regardless.

---

## 4. Test list

Behaviour, never wiring. Every assertion below names a real value.

**Unit**

| File | Cases |
|---|---|
| `snapshot-name-contract.test.ts` | accepts `clean`, `after-cycle-1`, `run_4:start`; rejects empty, a space, over the length cap |
| `snapshot-ordinal-contract.test.ts` | accepts 1; rejects 0, -1, 1.5 |
| `snapshot-boundary-contract.test.ts` | accepts `start`/`end`; rejects `middle` |
| `snapshot-record-contract.test.ts` | full parse; `.strict()` rejects a stray key |
| `snapshots-answer-contract.test.ts` | full parse with two rows; rejects a bad `instanceState` |
| `snapshots-args-contract.test.ts` | full parse; `.strict()` rejects a stray key |
| `snapshot-statics.test.ts` | `toStrictEqual` on the whole object |
| `snapshot-missing-error.test.ts` | the message names the asked-for name AND every available name |
| `snapshot-index-unreadable-error.test.ts` | the message names the index path |
| `locations-snapshot-paths-find-broker.test.ts` | exact three paths for a home; `payload: null` when `ordinal` is null |
| `snapshot-index-read-broker.test.ts` | absent index ⇒ `[]`; two lines ⇒ two records, in order; a malformed line ⇒ throws |
| `snapshot-capture-broker.test.ts` | copies the home's children into the payload with the store never among them; appends exactly one line whose parsed content is the returned record; ordinal advances 1→2; a manual name carrying `:start` is refused (R6); a copy failure appends nothing |
| `snapshot-resolve-broker.test.ts` | resolves `clean` to its record; **`clean2` against an index holding `clean` THROWS and does not return `clean`** (R8); the latest `clean` wins over an earlier one |
| `snapshot-list-broker.test.ts` | four automatic rows come back with the exact names and `manual: false`; `instanceState` rides along for alive / killed / unknown; a killed instance's absent home ⇒ `[]` with `killed` |
| `snapshot-auto-name-transformer.test.ts` | `run_4` + `start` ⇒ `run_4:start`; `run_12` + `end` ⇒ `run_12:end` |
| `snapshot-index-collapse-transformer.test.ts` | duplicate `clean` collapses to the later one; ordering is `atMs` ascending |
| `snapshots-args-parse-transformer.test.ts` | `--instance <id>` parses; missing `--instance` refuses naming the flag; `--human` refuses by name; a positional refuses |
| `siegelense-snapshots-responder.test.ts` | writes the exact JSON document for a staged answer; a broker throw propagates |
| `fs-cp-adapter.test.ts` | each child is copied to its own sibling path with `recursive`/`force`; the excluded name never appears among the copied pairs; a sibling whose name merely STARTS with the excluded one still is |
| `run-execute-broker.test.ts` (added cases) | one run captures `run_1:start` then `run_1:end`, both `manual: false`, in that order; the start half has already landed by the time step 1 dispatches; a second call with `run_2` adds `run_2:start` / `run_2:end`; a failing batch still captures the end half; a capture failure does not fail the run |

**Integration** — `brokers/snapshot/capture/snapshot-capture-broker.integration.test.ts`, against a real
`installTestbedCreateBroker` temp dir (broker-level integration tests are precedented repo-wide —
`packages/orchestrator/src/brokers/quest/hydrate/`, `packages/ward/src/brokers/git/diff-committed/`):

1. Capture `run_1:start`, `run_1:end`, `run_2:start`, `run_2:end` against a real home holding real
   files; read them back through `snapshotIndexReadBroker` + collapse and assert the FOUR names in
   order with `manual: false` on each.
2. Assert the payload directory for `run_1:start` holds a byte-identical copy of a file that was in the
   home at capture time and does NOT contain `.siegelense-snapshots` (R10 + the recursion exclusion).
3. Mutate the home after `run_1:start`, capture `run_1:end`, and assert the two payloads differ — the
   copy is real, not a marker.
4. `snapshotResolveBroker` against that real index: `run_1:start` resolves; `run_1:strt` throws naming
   itself and does not hand back `run_1:start` (R8, on real files).

---

## 5. Does `snapshots` carry an `instanceState`? Yes.

Every other read call in this package does (`results`, `status`, `compare` all resolve through
`instanceStateResolveBroker`), and here it is load-bearing rather than decorative: `snapshots: []` means
two completely different things depending on the state.

| `instanceState` | `snapshots: []` means |
|---|---|
| `alive` | the instance is up and has run nothing yet — a `run` will populate it |
| `killed` / `dead` | the home is gone; the restore points died with the instance, exactly as R11 says |
| `unknown` | there is no such instance id |
| `pruned` | the row survives as a tombstone; the home did not |

Without the field those four are one indistinguishable empty array, which is the "clean-looking result"
failure the spec bans for a stored ref (line 2078).

---

## 6. One deviation from the spec's worked example, stated

The spec prints `at: '20:03:11'` — a rendered wall-clock time. This build returns `atMs`, epoch
milliseconds, because:

- every other JSON answer in this package carries raw epoch ms (`lastBeatMs`, `startedAtMs`,
  `prunedAtMs`), and rendering happens in a `--human` transformer;
- `snapshots` has no `--human` renderer in this chunk, so there is nowhere for a rendered string to be
  the right answer;
- a caller diffing two snapshots' ages needs the number back, and a `HH:MM:SS` string has already lost
  the date.

If a `--human` table is added later it renders `atMs` through `elapsedRenderTransformer`, the same way
`status --human` already does.

---

## 7. Scope boundary — what is NOT built, and why

### The `snapshot` step verb — NOT built

`{ step: 'snapshot', as: 'clean' }` (spec 2622-2628) is the only producer of `manual: true` entries.
Registering it is not a one-file change:

| File | Why it has to change |
|---|---|
| `statics/step/step-statics.ts` | `verbs.all` gains `'snapshot'`, and `verbs.browser` must NOT |
| `statics/step/step-statics.test.ts` | asserts `verbs.all` with `toStrictEqual` |
| `contracts/step/step-contract.ts` | a seventh member of the `z.discriminatedUnion('step', …)` |
| `contracts/step/step-contract.test.ts`, `step.stub.ts` | the new member |
| `contracts/step-verb/*` | the enum derives from `verbs.all`, so its own tests move |
| `brokers/step/dispatch/step-dispatch-broker.ts` | its first act is `if (session === null) throw BrowserStepUnsupportedError` — every verb shipped so far is a browser verb, and a disk verb has to branch before that |
| `brokers/step/dispatch/run-verb-layer-broker.ts` + both proxies and tests | the dispatch branch |

That is the shared core of the step surface, edited while two other agents run ward in this same
checkout, and only two of those files (`step-statics.ts`, `brokers/step/dispatch/`) are on this agent's
permitted-with-flag list. The cost/benefit is bad: the verb buys one boolean's second value, and the
machinery underneath it — capture, index, resolve, the name namespace, the refusal of a manual name in
the automatic namespace — is all built and tested here. Wiring the verb later is a mechanical job
against a `snapshotCaptureBroker({ homePath, name, manual: true })` that already exists and already has
tests.

**Consequence, stated plainly:** until the verb lands, every row `snapshots` returns carries
`manual: false`. The field is not decorative — `snapshotCaptureBroker` writes and
`snapshotIndexReadBroker` reads both values, and the unit and integration tests drive both — but no
CLI path reaches `manual: true`.

### `reset`, and the three levels — NOT built

Part 7 #14's other half. `page` needs browser-storage clearing, `state` needs a restore (the inverse of
the copy this chunk writes) plus the undone-diff report, `instance` needs a re-boot and a re-seed, and
`seed`/recipes do not exist. Building it would mean shipping none of it finished. The lookup rule R8 —
the one part of `reset` that is a rule about SNAPSHOTS rather than about restoring — is built here, as
`snapshotResolveBroker`, so `reset` inherits it rather than re-deciding it.

### Retention (R16) — knob only

`snapshotStatics.retention.keepAutomatic` exists and nothing reads it. Enforcing it means deleting
payloads and rewriting an append-only index, and the spec itself calls retention "a knob, not a given"
with the unbounded case "usually fine" for a throwaway home. The home is under `/tmp` and dies on
`kill`, so the exposure is one instance's lifetime, not the machine's.

### `--human` — not built

No table renderer, so `snapshots` refuses `--human` by name. That refusal is automatic: `SiegelenseFlow`
derives `HUMAN_RENDERER_CALLS` from `siegelenseHelpStatics.calls[name].flags`, and the help entry in the
wiring note carries no `--human` row.

---

## 8. Wiring the coordinator owns

`siegelense-flow.ts`'s `CALL_ROUTES`, `siegelenseHelpStatics.calls.snapshots`,
`siegelenseHelpStatics.index.notBuiltYet`, and the flow-level integration cases. Written out verbatim in
`tmp/siegelense-wiring/snapshots.md`.
