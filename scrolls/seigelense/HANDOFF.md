# Siegelense build — handoff

**The work is unfinished and was stopped deliberately, not because it ran out of road.** Two chunks
of roughly four are delivered. This file says where the work is, what holds, what does not, and the
one thing most likely to mislead you.

## Re-issue this instruction to continue

Give a new session the text below. It is the instruction this build ran under, verbatim.

> We must implement the tooling described in `scrolls/seigelense/siegelense-tooling.md` in all its
> nitty gritty detail so that I can manually test everything once without finding holes that are
> documented as requirements.
>
> You must use sub agents for everything including planning, work, ward runs, and manual
> verification. Commit as you see fit.
>
> The general flow you should run is:
>
> - sub agent plans features against the doc that makes sense for a chunk. It has to dictate what to
>   build and in what order; parallelization is good but not required.
> - send sub agents to work on features as the plan dictates, including unit and int tests. I don't
>   think yall need e2e tests for this.
> - send sub agents to review code against plan and look for holes code may have or blindspots.
> - send sub agent to manually use the tool to make sure it adheres to the requirements of the doc.
> - send sub agent to review what the plan promised and delivered and mark all sections in the doc
>   that were delivered properly in the detail specified in the doc so we have a running mark of
>   what requirements are covered vs not
> - start over
>
> Do this until the planner sub agent has said there's nothing left to implement. Then send a sub
> agent or more to validate the doc's requirements are all met by manually running the tool.
>
> Before committing, always do `ward --uncommitted --committed` until green. You can save a full ward
> till the feature is completely finished. Agents modifying files should run `ward -- -- {files}` on
> what they change for quick sanity checks and so they don't collide with other parallel agents.
>
> This is an actual package to be put in packages folder so it must adhere to our arch that all sub
> agents should be pulling as well as testing standards.
>
> If hiccups with the flow or blockers happen, send out sub agents sonnet to fix them and unblock.
>
> Move to a worktree before you start. Only parallel 3 sub agents at a time. Use opus for planning,
> sonnet for everything else.

**The worktree already exists** — do not carve a new one. Use `worktrees/siegelense`, branch
`siegelense`. Everything below is relative to that worktree root.

**Manual verification means driving the real CLI and the real web UI**, not a script calling brokers.
That clarification came mid-build and is the reason several of the worst defects were caught.

**Your first act should be chunk 3's plan**, with opus, against the spec and the ledger. The ledger
is current; trust it for what the spec contains, and verify the code yourself for what is done.

## Where the work is

| | |
|---|---|
| Worktree | `worktrees/siegelense` — carved with `mcp__dungeonmaster__create-worktree` |
| Branch | `siegelense` |
| Spec | `scrolls/seigelense/siegelense-tooling.md`, 2,898 lines |
| Coverage ledger | `scrolls/seigelense/build-ledger.md` — one row per spec section |
| Plans | `scrolls/seigelense/plans/chunk-01-registry-spine.md`, `chunk-02-driver-and-batch.md` |

The spec carries inline status markers under the headings that have been delivered. They read
`> **Status: DELIVERED (chunk N)** — …` or `PARTIAL` or `BLOCKED`. Match that format exactly when
you add more, so they stay findable by a search.

## The search tools cannot see this worktree. Read this before dispatching anyone.

**`discover`, `get-project-map` and `get-project-inventory` are blind to `packages/siegelense`, and stale for
every other package on this branch.** The MCP server is rooted at the main checkout, which sits on `master`,
and `packages/siegelense` has never existed on `master`. Measured:

| Call | Answers | Truth |
|---|---|---|
| `get-project-inventory({ packageName: 'siegelense' })` | `## siegelense (0 files) (empty)` | the package holds a full tree |
| `discover({ glob: 'packages/siegelense/src/brokers/step/**' })` | `count: 0` | eight broker folders |

No rebuild fixes it. The tools point at a different tree.

**An empty answer reads exactly like a package with nothing in it**, which is the documented path to deciding
code is missing and writing a second copy of it. The blindness also reaches past this package:
`git diff master...siegelense` spans 75 files in `shared`, `testing`, `mcp`, `server`, `ward` and `cli`, so
for those the tools serve `master`'s version rather than this branch's.

Search here with `Read` for contents, `ls -R` for structure, and a `python3 -c` one-liner over `os.walk` plus
a regex. Put this in every agent brief; an agent told to `discover` first will otherwise report a true thing
absent.

## What a person can do today

The repo is built, linked and `init`-ed, so these work at a terminal right now:

```
dungeonmaster siegelense                          # prints the fleet; says so when empty
dungeonmaster siegelense driver --instance <id>   # launches the driver for one instance
```

Three MCP tools are registered: `siegelense-start`, `siegelense-run`, `siegelense-kill`. **Your MCP
client must reconnect before it can see them** — they were registered after this session's
connection opened. Until then, drive them by spawning the MCP server over stdio, the way
`packages/mcp/src/flows/mcp-server/mcp-server-flow.integration.test.ts` does.

`dungeonmaster init` creates `<repoRoot>/.siegelense`, pointing at the real dungeonmaster home, and
ignores it in git and in every check glob that already excludes `worktrees`.

## What is built

Two workspace packages: `packages/siegelense` and `packages/siegelense-recipes`. The second is
empty on purpose — an empty recipes package is a real answer where a missing one is not.

**Chunk 1, the disk spine.** The registry and its races: a port pair claimed before anything binds
it, a reservation written before a boot, a boot lock that admits one boot at a time across
processes, and a short-lived registry lock around every read-mutate-write. The heartbeat file with
its child process-group ids, which is the only defence against a SIGKILLed driver. Evidence paths
partitioned by the owning quest's guild, with `unowned/` as a real partition rather than a fallback.
The `dungeonmaster init` step.

**Chunk 2, the driver and the batch.** A per-instance driver process, separate from the MCP process
on purpose so an MCP rebuild cannot kill live instances. Lane boot and teardown. Six step verbs and
a dispatcher. A run executor whose return is an index rather than a payload, whose transcript
flushes per step, and whose counts cover only its own window. The no-pick rule: an ambiguous target
throws carrying its candidates, a zero-match throws naming near misses. `start`, `run` and `kill`,
reachable as three MCP tools and a CLI command.

## What is NOT built

Ten of the thirteen tools are unregistered — `results`, `capacity`, `profile`, `status`, `cleanup`,
`prune`, `compare`, `snapshots`, `recipes`, `docs`. Their names are pinned in
`siegelenseToolsStatics` so nobody can invent a fourteenth or drop one; nothing handles them.

No recipes. No evidence read path. No retention or pruning. No `look`, `health`, `hold`, `video`,
`reset`, `seed`, `until`, `request`, `resize` or `before`. No map. No settle detector. No profiling.

The ledger has the full picture, row by row. Read it before planning — it is the map of what the
spec contains, and it is current as of this handoff.

## The source-condition bug: SOLVED. Read the mechanism before you spawn anything.

**A driver spawned from inside a Jest worker resolved `@dungeonmaster/shared/contracts` to TypeScript source
instead of compiled `dist/`.** Three sessions failed on it. It is fixed. The mechanism is worth knowing,
because the same trap catches any spawn from a Jest worker in this repo.

**The chain, in order:**

1. Ward's unit and integration runners inject `NODE_OPTIONS=--conditions=source` into the Jest process
   (`packages/ward/README.md` section 5).
2. `packages/testing/src/jest.setup.js` strips that variable back out of the live `process.env`.
3. **A child spawned with `env` OMITTED does not read the live object.** Node's "default: inherit
   `process.env`" resolves against a STALE, PRE-STRIP snapshot taken inside the Jest worker. The strip never
   reaches the child.
4. `instance-start-broker.ts` spawned the driver with no `env` field — the one call site relying on that
   default. So the child ran with `--conditions=source` active, and Node dutifully resolved the package's
   `source` export condition to `./contracts.ts`.

**The fix:** `instance-start-broker.ts` now builds an explicit env snapshot from live `process.env` and passes
it as `env:` on the spawn. `laneBootBroker` already did exactly this for its own spawns, which is why the
"twin" experiment sometimes succeeded — it went through the other path.

**Why three sessions of measurement missed it, which is the reusable lesson.** Every ruled-out row below was
measured in the PARENT, against the live `process.env` — where the strip HAD worked, so `NODE_OPTIONS` really
did read as `undefined`. Nobody measured what the CHILD received. The parent and the child disagreed, and only
one of them was ever asked.

**Do not re-check these. Each was ruled out by live measurement, and none of them was the cause:**

| Ruled out | How |
|---|---|
| `NODE_OPTIONS`, `NODE_PATH`, `TS_NODE_PROJECT` | all undefined **in the parent** — the measurement that misled everyone |
| `process.execArgv` | empty |
| the resolved binary path | correct |
| the same spawn outside Jest | succeeds every time — because nothing injects the condition there |
| worktree hermeticity | the crash's own stack names paths inside the worktree throughout, never the main checkout |
| `detached: true` | reproduced without it |
| numeric-fd stdio vs pipe | reproduced with a real `fs.openSync` fd |
| `spawnSync` vs async `spawn` | reproduced both ways |
| concurrent process launches | dozens in parallel from Bash and from a plain Node parent, no crash |
| ward's `--detectOpenHandles` | reproduced under bare `npx jest --runInBand` |
| a Node 22.17 `require(esm)` race | Node 21.6.0 crashes too, through the old CJS loader. The `ModuleJobSync` frames were a symptom of Node 22's TypeScript support |
| the twin spawn running alone | crashed twice, identically. The earlier twin SUCCESS was the other spawn path, which already passed an explicit env |

## The teardown suite is GREEN. All fifteen tests pass against real spawned drivers.

`DRIVER_BOOT_BLOCKER` is `''` and the gate is gone. Two independent full runs of
`packages/siegelense/src/flows/driver/driver-flow.integration.test.ts` pass every test — the single-instance
clean kill, the SIGKILLed driver's orphans reaped by a second process, and killing one of three parallel
instances while the other two keep answering ping and keep every one of their own process groups alive.

**The suite paid for itself immediately by catching two real defects**, and the second was invisible until the
first was fixed.

| Defect | Where | What it was |
|---|---|---|
| The socket directory was never created | `adapters/net/unix-serve/net-unix-serve-adapter.ts` | Nothing ever made `<os.tmpdir()>/dm-siege-sockets`. **Binding a unix socket whose parent directory is absent fails with `EACCES`, not `ENOENT`** — which is why three sessions read it as a permissions or contention problem. The directory only ever existed on this machine as a leftover from an earlier successful run. Fixed with a `mkdirSync(dirname(socketPath), { recursive: true })` before the bind |
| A driver SIGKILLed inside the first 5 seconds leaked its whole lane | `responders/siegelense/driver/driver-serve-layer-responder.ts` | `instanceKillBroker`'s orphan reap reads `heartbeat.json` for the pgids to signal, but the heartbeat ticker's first tick waits `instanceLifecycleStatics.heartbeat.intervalMs` — 5 seconds. A driver killed in that window left no heartbeat file, so the reap found zero pgids and the lane processes never died. Fixed by writing one beat CONCURRENTLY with standing up the socket, closing the window to effectively zero |

**Stale sockets were already handled** and still are: the adapter unlinks an existing socket file before
binding, because a SIGKILLed driver leaves its socket file behind and a unix socket path is not removed when
its process dies.

**One leak remains, found while verifying and not covered by any of the fifteen tests.** The driver's own
top-level process does not exit after a successful `kill` — its socket server is never closed, so the Node
event loop stays alive. The idle-timeout backstop (`driver-idle-wait-layer-responder.ts`) eventually reaps it,
which makes this a slow leak rather than a permanent one. Every existing test checks lane pgids, ports, home
and evidence — never the driver's own process — which is exactly why it slipped through.

## One thing to verify rather than trust

**`siegelense-start` was proven broken by a real run, then fixed, and the fix has not been
re-verified by a person.** Its unit tests pass. Drive it yourself early.

## The proxy-mock specifier question, settled

`'process'` and `'node:process'` DO merge into one `jest.mock()` factory, and the fix reaches every
package. Read the merge at
`packages/testing/src/transformers/mock-calls-merge-by-module/mock-calls-merge-by-module-transformer.ts:31`,
not at the collector — `proxy-mock-collector-middleware.ts` normalises relative specifiers only, which
is why reading that file alone makes the bug look open. The ledger's last row carries the full trace.

## The lesson this build kept teaching

Eleven defects were found **after** the code went green, and each needed a different kind of check:

| Found by | What only it found |
|---|---|
| reading the code | the boot lock's check-then-act race |
| code review | no cross-process lock on the registry; two locks that could hang forever; a failed step that never captured its shot; a hung `waitFor` that never stopped its batch |
| **driving the real CLI** | the symlink pointing at the wrong tree; a gitignore entry that never matched a symlink; `start` unable to boot at all |
| a coverage audit | a lock that never got the fix its sibling already had |
| a full-repo ward | our own statics breaking lint in ten unrelated packages |
| an agent auditing itself | a session field its teardown never read |

**Two of those had passing tests sitting on top of them**, and the reason matters more than the
bugs. The symlink test set both roots to the same value, so the wrong one was indistinguishable from
the right one. And the shared mock-staging helper re-wrapped cross-realm errors, so a unit test
could not reproduce the shape production produces — the test infrastructure was guaranteeing a whole
class of bug reached production. Both are fixed; the habit that catches them is not.

So: a green ward is necessary and nowhere near sufficient. Drive the thing.

## Work found and fixed that the spec never asked for

- `dungeonmaster create-package` seeded a jest config that could not run an integration test
  importing `@dungeonmaster/testing`
- `@dungeonmaster/hooks` failed a fresh-repo install while printing `undefined` as its reason
- `ward --committed` refused any run whose scope named a deleted file
- the proxy-mock transformer keyed its dedup on the raw import specifier
- the shared mock-staging helper re-wrapped cross-realm errors
- our own `locationsStatics` additions broke lint in ten packages until the generic fragments moved
  out. **Do not put a bare extension in `locationsStatics`** — a guard in `packages/local-eslint`
  now refuses it, and its test explains why.

## How to run the flow

Plan a chunk with opus against the spec and the ledger; build it with sonnet agents, three at a
time; review the code against the plan; **drive the real CLI and the real MCP tools**; update the
ledger and the spec markers; repeat.

Ward discipline that cost time to learn here:

- Scope to files while agents work in parallel: `npm run ward -- -- <files>`.
- `npm run ward -- --uncommitted --committed` before every commit. Check its **exit code** —
  a pipeline's exit code is the last command's, so `ward | tail && git commit` will commit on red.
- Only the coordinator builds. A build with no lock rewrites every package's output and breaks every
  other agent's checks mid-run.
- After changing `locationsStatics`, build `@dungeonmaster/shared` before any lint — this repo's own
  ESLint rules read it compiled.
- The driver runs **compiled** output. Source changes it executes need
  `npm run build --workspace=@dungeonmaster/siegelense` to take effect.

**Tell every agent not to dispatch its own sub-agents.** Several did, and a fork inherits the
parent's full context, reads the parent's brief as its own, and races its own parent editing the same
files. One corrupted a work item that way.

## Two no-op commits

`98064a67f` and its revert `36fdd618a` net to exactly zero content. They exist because an agent built
a reproduction by committing. A hook blocks rewriting history while other sessions share the
checkout, so they were left in place.
