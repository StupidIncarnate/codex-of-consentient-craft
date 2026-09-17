# `dungeonmaster siegelense profile` — build plan

The call: **what one instance of a spec costs.** Reads what was measured; starts nothing. Its consumer is
`capacity`, which reads the sample group matching the pool it is about to open.

Spec source: `scrolls/seigelense/siegelense-tooling.md`. Ledger row: `build-ledger.md:172` — *NOT STARTED*,
with `SpecHash` and the `profiles/<hash>/` resolver already delivered by chunk 1.

---

## 1. Requirements

Every row cites the spec line it comes from. This is the table the work is graded against.

| #   | Requirement                                                                                                         | Spec line  |
|-----|---------------------------------------------------------------------------------------------------------------------|------------|
| R1  | `profile` is reached as `dungeonmaster siegelense profile`, and takes the spec to report on                          | 2270, 2520 |
| R2  | The answer carries `processes` — how many processes one instance of this spec runs (api · vite · chromium = 3)       | 2521, 1476 |
| R3  | The answer carries `hash` — the spec's CONTENT hash, not its name                                                     | 2521, 1471 |
| R4  | The answer carries `measuredAt` — the date of the most recent measurement                                             | 2521, 1480 |
| R5  | The answer carries `fromRuns` — how many instances the profile was measured from                                      | 2521, 1480 |
| R6  | The answer carries `bootMs`                                                                                           | 2521, 1479 |
| R7  | The answer carries `samples` — `{ poolSize, steadyMB, peakMB, runs }` per group                                        | 2522-2523  |
| R8  | Samples are grouped by POOL SIZE and **never averaged across groups**                                                 | 2526, 1489 |
| R9  | Every sample carries the pool size it was taken at — a schema without the field cannot satisfy the invariant          | 1488       |
| R10 | Keyed by the spec's content hash: add a process, the hash changes, measurement restarts by construction               | 1471, 2513 |
| R11 | Needs no live instance — it reads the asset tree, so a session that only wants to read starts nothing                 | 2275-2276  |
| R12 | Something must SAMPLE: while an instance runs, sum the RSS of every process in its group, every few seconds           | 1469       |
| R13 | Two numbers are recorded per sample: STEADY (what it settles at) and PEAK (what it spikes to)                         | 1470       |
| R14 | `bootMs` is genuinely measured, not typed by anyone                                                                   | 1479, 1483 |
| R15 | A profile's MEMORY figures travel between machines; its TIMING does not                                               | 1513-1515  |
| R16 | The profile records how many instances were running when each sample was taken, rather than averaging the conditions  | 1511       |
| R17 | With no profile yet the answer is honest emptiness — the "suggested is TWO" default belongs to `capacity`, not here   | 1517, 2513 |
| R18 | `--human` is refused by name: `profile` has no human table renderer                                                   | repo §3.A  |

---

## 2. Where the samples come from

Nothing writes a profile today. The measurement path is part of this job.

### Storage layout

Under the resolver chunk 1 already delivered (`locationsProfilesPathFindBroker` → `<root>/profiles/<specHash>`):

```
profiles/<specHash>/
  samples/<instanceId>.json     one instance's memory record — written by that instance's DRIVER, per beat
  boots/<instanceId>.json       one instance's boot time     — written once by the CLIENT half of `start`
```

**One writer per file, and never the same file from two processes.** The driver owns its sample record; the
`start` client owns its boot record. Nothing locks, nothing read-modify-writes across processes, and a
SIGKILLed driver leaves every beat it already took on disk because each beat rewrites the whole record.

Two directories rather than two keys in one document, because the two halves are measured by two different OS
processes at overlapping times. Folding them into one file would make the profile the second place in this
design needing a lock.

### Who writes what

| Writer                                        | File                          | When                                    |
|-----------------------------------------------|-------------------------------|-----------------------------------------|
| `driverHeartbeatTickBroker` → `profileSampleRecordBroker` | `samples/<instanceId>.json` | every beat, once RSS was measurable |
| `instanceStartBroker` → `profileBootRecordBroker`         | `boots/<instanceId>.json`   | once, after the driver answers `ping` |

Both call sites wrap the write so a failed profile write never fails the thing it rode along with: a beat is
the only defence a SIGKILLed driver leaves behind, and a successful boot must not be torn down because a
profile file could not be written. Both report to stderr rather than swallowing.

### The pool-size bucket, and why an observation holds several

Pool size can CHANGE inside one instance's life — a second instance starts while the first is still running. A
record holding one pool size would then have to pick one and blend beats taken under both, which is the
averaging R8 forbids, one level down. So each instance's record holds a bucket PER pool size:

```jsonc
{
  "instanceId": "inst_7f3a",
  "specHash": "7f3a…",
  "firstBeatAtMs": 1700000000000,
  "measuredAtMs": 1700000600000,
  "pools": [
    { "poolSize": 1, "peakMB": 2600, "steadySumMB": 12600, "steadyBeats": 7 },
    { "poolSize": 3, "peakMB": 2810, "steadySumMB":  9600, "steadyBeats": 5 }
  ]
}
```

- `poolSize` at a beat = registry rows with `state: 'alive'` **and** `bootedAtMs !== null` — instances actually
  running and costing memory, never a reservation that has booted nothing. Floored at 1: the beating instance
  is itself one of them.
- **PEAK** takes every beat. **STEADY** takes only beats at least `profileStatics.settle.afterMs` after this
  record's first beat — "what it settles at" is not the first reading. `steadySumMB`/`steadyBeats` are kept
  rather than a running mean so the answer can pool beats across runs without a mean of means.

### Folding to the answer

`profileReadBroker` reads every record under `samples/` and `boots/` and folds, per pool size:

- `peakMB` = the MAX across contributing runs. Capacity planning divides by the worst case, not the typical one.
- `steadyMB` = `floor(Σ steadySumMB / Σ steadyBeats)` across contributing runs — pooled over beats, inside one
  pool-size group only. Where a group has no settled beats at all (every contributing instance was killed
  inside the settle window), `steadyMB` falls back to that group's `peakMB`, which is the only memory figure
  those runs produced.
- `runs` = how many records carry a bucket for that pool size.
- `fromRuns` = how many sample records exist at all — instances measured, which is what "from 14 instances"
  counts. With one pool size per run (the common case) `fromRuns` equals the sum of the groups' `runs`, which
  is the arithmetic the spec's own example shows.
- `bootMs` = floored mean of every boot record's `bootMs`, or `null` with none.
- `measuredAt` = the newest `measuredAtMs` across records, rendered `YYYY-MM-DD`, or `null` with none.
- `processes` = `spec.processes.length + (spec.browser ? 1 : 0)` — the spec's own example counts chromium as
  one of its three.

**The known limit, stated rather than papered over:** the heartbeat ticker starts once the lane is up, so a
PEAK taken from beats is the highest RSS observed *after* boot, and the boot spike itself is only caught if a
beat lands while it is still resident. This is what the sampler can see from where it runs; nothing inside the
boot window samples anything today.

---

## 3. Build list

Folder type per file. Everything is new unless the row says EDIT.

### statics

| File                                             | Holds                                                           |
|--------------------------------------------------|-----------------------------------------------------------------|
| `statics/profile/profile-statics.ts` (+ test)     | `dirs.samples`, `dirs.boots`, `extensions.record`, `settle.afterMs` |

### contracts

| File                                                                | Shape                                                        |
|---------------------------------------------------------------------|--------------------------------------------------------------|
| `contracts/profile-pool-size/` (+ test, stub)                        | branded int ≥ 1 — a pool always holds the instance beating     |
| `contracts/profile-observation/` (+ test, stub)                      | the on-disk per-instance sample record above                   |
| `contracts/profile-boot/` (+ test, stub)                             | the on-disk per-instance boot record                           |
| `contracts/spec-profile/` (+ test, stub)                             | the `profile` ANSWER: processes, hash, measuredAt, fromRuns, bootMs, samples |

`measuredAt` is `contentTextContract.nullable()`, following `machineReadingContract.lastOomAt` — a formatted
display string this package already brands that way.

### transformers

| File                                                     | Job                                                                   |
|----------------------------------------------------------|------------------------------------------------------------------------|
| `transformers/profile-args-parse/` (+ test)               | argv → `SpecName`; `--spec` required, `--json` accepted, else refuses   |
| `transformers/profile-observation-merge/` (+ test)        | one beat folded into a record — the settle rule and the bucket picker   |
| `transformers/profile-samples-group/` (+ test)            | records → groups. **The never-average-across-pool-sizes rule lives here** |
| `transformers/profile-measured-date-render/` (+ test)     | `EpochMs` → `YYYY-MM-DD`                                               |

### brokers

| File                                                             | Job                                                            |
|------------------------------------------------------------------|-----------------------------------------------------------------|
| `brokers/locations/profile-dirs-find/` (+ proxy, test)            | `{ specHash }` → `{ samplesDir, bootsDir }`                      |
| `brokers/profile/sample-record/` (+ proxy, test, integration test) | one beat → the record on disk                                   |
| `brokers/profile/boot-record/` (+ proxy, test)                    | one measured boot → the record on disk                          |
| `brokers/profile/read/` (+ proxy, test)                           | the whole `profile` call                                        |
| `brokers/driver/heartbeat-tick/` — **EDIT**                       | calls the sampler after the beat lands; a failure never kills the beat |
| `brokers/instance/start/` — **EDIT**                              | records the measured `bootMs`; a failure never kills the boot    |

### responders

| File                                        | Job                                                   |
|---------------------------------------------|--------------------------------------------------------|
| `responders/siegelense/profile/` (+ proxy, test) | `{ specName }` → one JSON document on stdout      |

### handed to the coordinator, not built here

`tmp/siegelense-wiring/profile.md` — the `CALL_ROUTES` entry, the `siegelenseHelpStatics.calls.profile` block
and the flow-level integration cases. `siegelense-flow.ts` and both help/call statics are shared files this
agent must not touch.

---

## 4. Tests

| Test                                      | Asserts                                                                                        |
|-------------------------------------------|-------------------------------------------------------------------------------------------------|
| `profile-statics.test.ts`                 | the settle window and both directory names, by value                                            |
| every contract test                       | a valid record parses to its exact object; pool size 0 and a negative peak are refused           |
| `profile-args-parse-transformer.test.ts`  | `--spec x` → `x`; missing `--spec` refuses naming the flag; unknown flag refuses; positional refuses |
| `profile-observation-merge-transformer.test.ts` | first beat opens a record; a beat inside the settle window raises peak and adds NO steady beat; a beat past it adds one; a beat at a NEW pool size opens a SECOND bucket and leaves the first untouched |
| `profile-samples-group-transformer.test.ts` | **two runs at pool size 1 and two at pool size 3 come back as two groups, each with its own steadyMB, peakMB and runs — never one blended row**; peak is the max across runs; steady is pooled over beats; a group with no settled beat falls back to its peak |
| `profile-measured-date-render-transformer.test.ts` | a known epoch renders its exact date                                                   |
| `locations-profile-dirs-find-broker.test.ts` | both absolute paths, exactly, under `profiles/<hash>/`                                       |
| `profile-sample-record-broker.test.ts`    | a null RSS writes nothing; a first beat writes the opening record verbatim; a later beat merges onto the record already on disk; the pool size counts only booted-alive rows |
| `profile-sample-record-broker.integration.test.ts` | against a REAL testbed dir: three beats at pool size 1 then two at pool size 3 leave one file on disk holding two buckets, and `profileReadBroker` folds it into two groups with their own numbers |
| `profile-boot-record-broker.test.ts`      | the written record's exact content, including the measured `bootMs`                             |
| `profile-read-broker.test.ts`             | the whole answer for two runs; the empty answer with nothing measured; `hash` changes with the spec's content; an unparseable record is skipped and reported |
| `driver-heartbeat-tick-broker.test.ts`    | the sampler receives the beat's OWN measured rss and timestamp; a sampler failure still returns a successful beat and reports on stderr |
| `siegelense-profile-responder.test.ts`    | the exact JSON document written to stdout                                                       |

---

## 5. What this plan does not build

- `capacity` — a separate agent's call. This one only makes the numbers it reads exist.
- A `--human` table. `profile` answers JSON only, and refuses `--human` by name through the flow's own
  derived-from-help rule.
- Cross-machine reuse of memory figures (R15). The profile tree lives under the dungeonmaster home, which is
  per machine; nothing here copies a profile between machines, and the timing half correctly re-measures
  because a fresh machine has no boot records.
