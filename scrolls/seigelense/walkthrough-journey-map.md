# Siegelense walkthrough — the journey map

The order a person drives the tool in, one stop per call. Written for a walkthrough where each stop is
driven live, its real stdout is read, and permutations are tried before moving on.

**Every command is `dungeonmaster siegelense <call>`.** There is no MCP tool behind any of them and
nothing to install. Seven of the thirteen calls are built.

## The order is forced by STATE, not by preference

A read call needs evidence, and evidence only exists once something has run. So the map threads one
instance's whole life rather than visiting the calls alphabetically.

| # | Stop | Needs | What only this stop can show |
|---|---|---|---|
| 1 | **Discovery** | nothing | the surface is reachable and self-documenting; the six unbuilt calls refuse BY NAME |
| 2 | **`start`** | nothing | a lane boots; the manifest carries every path the run will want; the fake-CLI safety gate; `queuedMs` / `aheadOfMe` |
| 3 | **`run`** | a live instance | steps are DATA in a batch; the return is a STATUS, never a payload; the no-pick rule; capture on every acting step |
| 4 | **`results`** | a finished run | six evidence kinds off DISK, starting nothing; `where` filtering, `fields` projection, the self-reporting cap |
| 5 | **`status`** | a live instance | the post-mortem — machine readings, RSS, orphans, `likelyCause`; the no-browsing rule |
| 6 | **`compare`** | TWO runs, one instance | the index delta between two runs; a READING, never a verdict; no cross-instance form |
| 7 | **`kill`** | a live instance | process-GROUP teardown; ports released; throwaway home removed; **evidence kept** |
| 8 | **after death** | a killed instance | `results` and `status` still answer — the fixer's normal case, not the edge |
| 9 | **`cleanup`** | a registry with rows | the operator's bookend: reap by staleness, release ports and locks, report `leftAlone` |

## What each stop is worth trying

Permutations that exercise a rule rather than repeat a happy path.

| Stop | Worth driving |
|---|---|
| Discovery | `--help` at both levels · each of the six unbuilt names · a name that is not a call at all · exit codes |
| `start` | no `--spec` · an unknown spec · `--quest` and `--guild` (they decide the evidence partition) · two starts at once, to see the boot queue · reaching it with no fake CLI set |
| `run` | each of the six verbs — `goto`, `waitFor`, `click`, `type`, `screenshot`, `eval` · `--steps-file` instead of `--steps` · `--stop-on never` · `expect: 'error'` on a step that SUCCEEDS · an ambiguous target, which must throw carrying its candidates · a target matching nothing, which must name near misses |
| `results` | every `kind` · `--step` · `--where-path` / `--where-method` / `--where-level` / `--where-steps` · `--fields` · `--since boot` · omitting `--run` against a finished instance, which must refuse |
| `status` | fleet vs `--instance` · `--human` vs JSON · an unknown id, which must NOT read as an empty fleet |
| `compare` | two real runs · the same run twice · a cross-instance attempt, which must refuse by naming the rule |
| `kill` | a live instance · the same id twice · an id that never existed |
| `cleanup` | with a live instance up (it must be LEFT ALONE) · with only tombstones |

## The six calls that are not built

`capacity` · `profile` · `prune` · `snapshots` · `recipes` · `docs`

Each refuses by name — "`capacity` is a siegelense call but is not built yet" — rather than as an
unknown subcommand. That is reachability, not delivery. Stop 1 shows the difference between that
refusal and the one an invented name gets.

## Two things that make a run readable afterwards

**Every path handed back is repo-local, through `<repoRoot>/.siegelense`.** A shot is only evidence
if the reader's own file tools reach it. The symlink points at the real dungeonmaster home.

**`run` returns an index; `results` returns payloads.** Collapsing the two is what the service exists
to avoid — a batch's real response bodies do not belong in the value that tells you the batch
finished.

## Findings log

Every defect the walk surfaces, in the order it was found. A defect goes to a sonnet sub-agent to fix
so the walk keeps moving; this table is how the walk keeps track of what is out and what landed.

| # | Stop | Defect | State |
|---|---|---|---|
| 0 | pre-walk | `start` printed its manifest and never exited — `detached: true` without `unref()` left the parent's event loop holding the driver. Measured: manifest at `bootMs: 4269`, command still alive ten minutes later | **FIXED** `ac3827f8f` |
| 0 | pre-walk | `aheadOfMe` counted killed tombstones as queued boots, so it climbed by one per failed boot and never came down. Read 3 on an empty fleet | **FIXED** `ac3827f8f` |
| 0 | pre-walk | a `screenshot` step whose name carried no extension failed with Playwright's `path: unsupported mime type "null"`, naming neither the step nor the field | **FIXED** `ac3827f8f` |
| 1 | Discovery | **Any unrecognized word booted the HTTP server.** `CliFlow` routed five commands and let everything else fall through to `CliServeResponder`, so `dungeonmaster seigelense` — two transposed letters — bound `dungeonmaster.port`, and a second attempt died on `EADDRINUSE`. The caller reads a port stack trace for a spelling mistake. `COMMANDS.start` was declared and never referenced, so `dungeonmaster start` only worked through the same hole | **FIXED** `766d4c175` |
**Landed in the working tree, not yet driven through the real binary** — a build rewrites every package's
output with no lock, so it waits until no agent is running. Rendering through source is not the same as
typing the command, and on this build that difference has mattered repeatedly.

| 1 | Discovery | The fleet listing shows `killed` rows with no explanation. A reader cannot tell a tombstone from a leak, and nothing on screen says the row is kept on purpose or that no built call removes it | **OUT** — sonnet |
| 1 | Discovery | The fleet table is unreadable. Columns are tab-separated with no padding, so nothing lines up and every row wraps. `LAST BEAT` prints raw epoch milliseconds (`1789545575971`) where `status --human` already renders a relative age for the same value. The `EVIDENCE` column repeats a full absolute path per row and ends by restating the instance id that already opened the row | **OUT** — sonnet, same agent |
| 1 | Discovery | **A step that fails for a REAL reason captures its shot and never reads it.** `step-dispatch-broker.ts`'s success path and its `expect: 'error'` path both compute `blank` and `pixelChange`; the catch that handles a genuine failure captures and goes straight to `throw`, so both come back `null`. Proved against `inst_0a06551513a643f78c98f195c1e01cc0` run_5: `step2.png` is a real 18,297-byte PNG flagged `why=failed`, with `blank=null, pixelChange=null`, while step 1 and step 3 either side of it carry both. **`blank` is the one field in this design that IS a verdict** — so a step that failed BECAUSE the page went white reports nothing saying so, on the one shot a fixer is most likely to open | **OUT** — sonnet |
| 2 | `start` | **A driver that dies during boot tells the caller nothing.** The driver writes its real cause to `driver.log` and exits; the parent keeps polling a socket that will never answer until the 3-minute boot deadline, then reports the symptom. Driven with no fake CLI set, the driver logged `Lane spec dungeonmaster-web requires a fake agent CLI … Refusing to boot against the real CLI`, and the caller got, three minutes later, `did not become ready: api, web never answered their ready path`. The cause was known in the first 50ms | **OUT** — sonnet |
| 2 | `start` | **Every failed boot leaks its reservation.** The row stays `alive` with `bootedAtMs: null`, holding a claimed port pair with no process behind it. Nothing retries it and nothing releases it; only `cleanup` reaps it, past the reservation ceiling. Two were sitting in the registry during this stop — `inst_829ad293…` (ports 38991/38993) and `inst_0d6e2f7e…` | **OUT** — sonnet, same agent |
| 2 | `start` | The fake-CLI gate itself HOLDS, and is worth recording as working: `dungeonmaster-web` refuses to boot against a real Claude CLI, so a driving session cannot spend real API usage by accident | **works as designed** |
| 2 | `start` | **A lane reaped by its own idle timeout reports a MEMORY death.** Three instances died at exactly 900s — `driverStatics.idle.timeoutMs` — having been booted and left alone. `status --instance` then said `LIKELY CAUSE: rss 622MB at last beat; no profile recorded for spec dungeonmaster-web; kernel OOM kills since boot: 1`, and `driver.log` was empty. The tool turned the lane off on a timer and then produced evidence pointing at memory pressure, which a session is told to bubble up as `rework`. Compounding it: a human driving the UI resets nothing, because `status` and `results` read off DISK and never touch the driver socket — only `run` does | **OUT** — sonnet |
| — | parked | `CliServeResponder` runs `xdg-open` unconditionally, with no flag, config knob or env var to stop it. Every server launch opens a browser tab | **PARKED** by request |

## The seeding gap: a manual runner cannot make Claude say anything

Not a defect — nothing is broken. It is the largest unbuilt thing the walk has reached, and it decides
whether a person can drive this tool at all, so it is recorded here rather than dispatched.

**The lane runs a MOCK Claude CLI, and that is correct.** `dungeonmaster-web` refuses to boot without
`CLAUDE_CLI_PATH` and `WARD_CLI_PATH`, in its own words: *"Refusing to boot against the real CLI — that
spends real API usage and produces a non-deterministic reading."* Every lane driven during this
walkthrough ran against `packages/web/test/harnesses/claude-mock/bin/claude`.

**The mock is a QUEUE CONSUMER.** Each spawn pops one JSON file, in counter order:

```
<home>/claude-queue/__by_cwd__/<guildPath, every non-[A-Za-z0-9._-] byte replaced by _>/0000.json
                                                                                        0001.json
                               metadata.json    ← the counter, so ordering is explicit
```

`<home>` is `/tmp/dm-siege-<instanceId>`, which `start` hands back in its manifest. So the queue IS
reachable by hand. What does not exist is any way to reach it THROUGH the tool.

| To make the app show a Claude message, you would want | State |
|---|---|
| a `seed` step, placeable anywhere in a batch | **not built** |
| recipes — named functions producing known state | **not built**; `packages/siegelense-recipes` is empty on purpose |
| a `file` step that writes into the lane | **not built** |
| any built call that enqueues a response | **none** |

The six built verbs are `goto`, `waitFor`, `click`, `type`, `screenshot` and `eval`. **None of them
writes a file.** So today a manual runner boots an instance, reads `home` off the manifest, derives the
guild path, encodes it, hand-writes `0000.json`, and only then clicks the control that spawns Claude.

**Two things make the hand-written route worse than that already sounds.** The queue lives inside the
THROWAWAY home, so `kill` deletes it and the evidence directory keeps no record of what the lane was
fed — a walk is reproducible only if whoever repeats it still has the JSON. And `eval` cannot stand in
for the missing `file` step: it runs in the BROWSER, and the queue is on the driver's disk.

This is Part 6 of `siegelense-tooling.md` and item 3 of its build order, whole and untouched.

## Ground rules for the walk

- Read the real stdout. A summary of a run is worth nothing; three of this build's worst defects were
  caught only because someone read the bytes a real command printed.
- A refusal is a feature. Check that its message names the flag to type, not an internal shape.
- Check the exit code separately from the output. A pipeline's exit code is the last command's.
