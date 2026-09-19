# `capacity` — what this machine can take right now

The eleventh of the thirteen calls. `dungeonmaster siegelense capacity [--spec <specName>] [--pool <n>] [--json]`.

Spec: `siegelense-tooling.md` 2502-2515 (the call), 1463-1531 (Part 3 — profiling, phase zero, the stagger),
1569-1600 (the worked answer and the one hard edge), 217-237 (what the registry makes safe).
Ledger row: `build-ledger.md` "The thirteen calls, individually", `capacity` at spec line 2430.

---

## 1. Requirements

| # | Requirement | Spec line |
|---|---|---|
| R1 | Answers `suggested`, `ceiling`, `why`, `measured`, `profile` — one JSON document | 2506-2509 |
| R2 | `suggested` comes from a MEASURED profile, never a typed number | 2512 |
| R3 | A spec that grows a second server re-measures rather than being wrong — keyed by the spec's CONTENT hash | 1471, 2512 |
| R4 | With no profile yet, `suggested` is `2`, and that pair profiles itself | 1517-1520, 2513 |
| R5 | Counts instances **this session did not start** | 1585-1586, 2514 |
| R6 | Counts RESERVATIONS, not only running instances — the thundering-herd cure | 225 |
| R7 | `measured` carries free memory, cores, 1-minute load average, siege instances already up, free disk | 1574 |
| R8 | `profile` carries the spec, `steadyMB`, `peakMB`, `fromRuns` — the numbers behind the judgement | 1575, 1583 |
| R9 | `why` is a SENTENCE naming the figures it reasoned from, so the caller can check the arithmetic | 1582 |
| R10 | `ceiling` is the POLICY cap — a knob, three here, not a fact about anything | 1581 |
| R11 | `suggested` is never above `ceiling` | 1580 |
| R12 | Reads the sample group matching the pool it is about to open — **never a blend across groups** | 1488-1490, 2526-2527 |
| R13 | Inverts the STAGGERED high-water mark `steady × (N−1) + peak`, not `peak × N` and not `steady × N` | 1524-1529 |
| R14 | `suggested = floor((freeMem − headroom) / peak)` clamped to the ceiling — headroom is subtracted | 1472 |
| R15 | Advisory. The caller decides | 1588 |
| R16 | Exactly one hard edge: `start` refuses outright when the machine plainly cannot hold another, and says why | 1588-1590, 2514 |
| R17 | `start` refuses past the pool size (the chunk-2 marker's own NOT YET, which needed a measured profile from `capacity`) | 1533, 1540 |
| R18 | Needs no live instance of its own — starts nothing | 2275 |
| R19 | Reachable as `dungeonmaster siegelense capacity`, routed through `CALL_ROUTES`, with its own `--help` page | 2270 |

---

## 2. The two judgement calls

### 2a. `why` is built from real figures, and names them in MB

The spec's illustrative sentence is
`'profile 2.6GB peak; free RAM 5.2GB less headroom; 1 siege instance already up'`.

Its three clauses are kept. Two departures, both deliberate:

- **MB, not GB.** GB at one decimal cannot be reconciled with `measured.freeMemMB`, and the sentence's stated job
  (line 1582-1583) is that the judgement be *checkable rather than trusted*. The spec's own example cannot be made
  self-consistent either way: 5320MB renders as 5.2GB only on a 1024 divisor, and 2600MB renders as 2.6GB only on a
  1000 divisor. MB is what `measured` and `profile` already carry, so the sentence and the blocks agree by
  construction.
- **`less 512MB headroom`, not `less headroom`.** Headroom is the one term in the arithmetic that appears nowhere
  in `measured`, so a reader cannot recompute `suggested` without it.

Built clause by clause from measured values, never a fixed string:

```
profile 2600MB peak / 1800MB steady at pool size 1, from 9 runs; free RAM 5320MB less 512MB headroom; 1 siege instance already up
```

With no profile:

```
no measured profile for dungeonmaster-web, so the default pair of 2 profiles itself; free RAM 5320MB less 512MB headroom; nothing else up
```

Clamped by policy, the sentence says so:

```
… ; 2 siege instances already up (1 still reserving); capped at the policy ceiling of 3
```

### 2b. "Plainly cannot hold another" = `suggested === 0`

`capacity` stays advisory everywhere else. `instanceStartBroker` calls it once, after its opportunistic stale reap
and **before** `instanceReserveBroker`, and throws `CapacityRefusedError` carrying the `why` sentence when
`suggested === 0`. That single condition covers both refusals the spec asks for, and the `why` sentence says which
one fired:

| Cause | Measurable form | Which requirement |
|---|---|---|
| memory | a MEASURED sample group exists and `availableMB < peakMB` — one more staggered instance does not fit under free memory less headroom | R16 |
| policy | `siegeInstances >= ceiling` | R17 |

Two guards keep this from over-refusing:

1. **A machine with no profile never refuses on memory.** With no sample group there is no measurement, so nothing
   is *plain*; `suggested` falls back to the no-profile default (R4), which is only ever 0 when the policy ceiling
   is already full.
2. **The reap runs first.** A machine full of dead lanes is reaped, then measured, so a cold fleet never refuses a
   live boot.

`instanceStartBroker` and its proxy/test are inside the owned paths, so this lands without touching a shared file.

---

## 3. The arithmetic

Let `sample` be the chosen group, `H = capacityStatics.memory.headroomMB`, `C = capacityStatics.policy.ceiling`.

```
live        = registry rows with state 'alive' that are not stale        (R5, R6)
reserved    = live rows with bootedAtMs === null                          (R6)
siege       = live.length
availableMB = freeMemMB − H − sample.peakMB × reserved
memoryAllows = availableMB < sample.peakMB
                 ? 0
                 : floor((availableMB − sample.peakMB) / sample.steadyMB) + 1
ceilingLeft  = max(0, C − siege)
suggested    = min(memoryAllows, ceilingLeft)
```

- `memoryAllows` is the inversion of `steady × (N−1) + peak ≤ availableMB` (R13). Only the instance currently
  booting is at its peak; the rest have settled.
- A **booted** instance's memory is already absent from `freeMemMB`, so it is not debited twice. A **reservation**
  has claimed a port pair and is about to pay its peak but has not yet, so its peak IS debited (R6).
- With no sample group: `suggested = min(capacityStatics.noProfile.suggested, ceilingLeft)` (R4, R11).

**`headroomMB = 512`** is the knob that reproduces the spec's own worked example exactly:
`free 5320 − 512 = 4808`; `(4808 − 2600) / 1800 = 1.22 → 1`; `+1 = 2`; `min(2, 3 − 1) = 2` — the spec's
`suggested: 2, ceiling: 3` at line 1571-1572. It is a knob, not a fact.

### Which sample group (R12)

`capacity` takes `--pool <n>`, the size of the pool it is about to open. Selection, never a blend:

1. the group with the LARGEST `poolSize ≤ n`;
2. failing that (every group measured a bigger pool), the SMALLEST group;
3. failing that (no samples at all), `null` → the no-profile default.

`--pool` defaults to `capacityStatics.policy.ceiling`. A caller who has not said what pool they are opening is
answered against the most CONTENDED group the profile holds, which is the direction spec lines 1504-1507 name as
safe: solo-measured peak is optimistic for a pool of three, and computing against it is "the expensive mistake".
`start` uses that default for the same reason — a refusal should err toward refusing rather than toward an OOM.

### Which spec

`--spec` is OPTIONAL, defaulting to `capacityStatics.defaults.specName`, which is **derived** from
`laneSpecStatics.specs['dungeonmaster-web'].name` rather than typed — the browsered spec, the more expensive of the
two built-ins, so a bare `capacity` answers conservatively. The `why` sentence and `profile.spec` both name which
spec was read, so a bare call is never silently about the wrong lane. This is what keeps `capacity {}` (line 2505)
a real form while a profile stays keyed by one spec's content hash (R3).

---

## 4. Build list

Every path below is inside the owned set.

| File | Folder type | What |
|---|---|---|
| `statics/capacity/capacity-statics.ts` (+ `.test.ts`) | statics | `policy.ceiling: 3`, `memory.headroomMB: 512`, `noProfile.suggested: 2`, `defaults.specName` derived from `laneSpecStatics` |
| `contracts/capacity-measured/capacity-measured-contract.ts` (+ test, stub) | contracts | `freeMemMB`, `cores`, `loadAvg1`, `siegeInstances`, `diskFreeMB` (nullable) |
| `contracts/capacity-profile/capacity-profile-contract.ts` (+ test, stub) | contracts | `spec`, `poolSize`, `steadyMB`, `peakMB`, `fromRuns` — the ONE group that was read |
| `contracts/capacity-suggestion/capacity-suggestion-contract.ts` (+ test, stub) | contracts | `suggested`, `ceiling`, `memoryAllows`, `ceilingLeft`, `availableMB` — the transformer's output |
| `contracts/capacity-answer/capacity-answer-contract.ts` (+ test, stub) | contracts | `suggested`, `ceiling`, `why`, `measured`, `profile` (nullable). `.strict()` |
| `contracts/capacity-args/capacity-args-contract.ts` (+ test, stub) | contracts | `specName`, `poolSize` |
| `transformers/capacity-sample-select/…-transformer.ts` (+ test) | transformers | the group-selection rule, R12 |
| `transformers/capacity-suggest/…-transformer.ts` (+ test) | transformers | the arithmetic, R13/R14 |
| `transformers/capacity-why-render/…-transformer.ts` (+ test) | transformers | the sentence, R9 |
| `transformers/capacity-args-parse/…-transformer.ts` (+ test) | transformers | argv → `CapacityArgs` |
| `errors/capacity-refused/capacity-refused-error.ts` (+ test) | errors | what `start` throws, R16/R17 |
| `brokers/capacity/read/capacity-read-broker.ts` (+ proxy, test) | brokers | registry + machine + profile → `CapacityAnswer` |
| `responders/siegelense/capacity/siegelense-capacity-responder.ts` (+ proxy, test) | responders | one JSON document on stdout |
| `brokers/instance/start/instance-start-broker.ts` (+ proxy, test edits) | brokers | the hard refusal |

**No `--human`.** `capacity` ships no table renderer, so its help entry carries no `--human` flag and
`SiegelenseFlow` refuses the flag by name — the same opt-out `profile`, `start`, `run`, `results`, `kill`,
`compare` and `snapshots` already take.

**Not touched:** `siegelense-flow.ts`, `siegelense-help-statics.ts`, `siegelense-call-statics.ts`,
`siegelense-help-render-transformer`. Their edits go in `tmp/siegelense-wiring/capacity.md` for the coordinator.

## 5. Tests

Unit, per file. The three that must assert real values:

1. **`capacitySampleSelectTransformer`** — a profile with groups at pool size 1 (`peak 2600`) and 3 (`peak 2810`):
   `--pool 1` selects the 1-group and `--pool 3` selects the 3-group, each asserted `toStrictEqual` on the whole
   group. And in `capacityReadBroker`: the same two-group profile yields a different `suggested` per requested
   pool, with `answer.profile.peakMB` proving which group was read — no mean of 2600 and 2810 is ever produced.
2. **`capacityReadBroker`** — a registry holding an instance whose `owner` is a pid this process is not, and a
   second that is only a RESERVATION: `measured.siegeInstances` counts both and `suggested` drops against the same
   machine reading with an empty fleet.
3. **`capacityReadBroker`** — a spec with `samples: []`: `suggested` is `2`, `profile` is `null`, and `why`
   matches the no-profile sentence naming the spec and the default.

Plus: `suggested` clamped by the policy ceiling; `suggested: 0` on a machine whose free memory is under
`peak + headroom`; `instanceStartBroker` throwing `CapacityRefusedError` before it reserves, and NOT throwing when
`suggested >= 1`.

No integration test: `capacityReadBroker` reads no tree of its own — every read is through
`registryReadBroker`/`machineReadBroker`/`profileReadBroker`, each of which already owns its own coverage, and the
call starts nothing (R18).
