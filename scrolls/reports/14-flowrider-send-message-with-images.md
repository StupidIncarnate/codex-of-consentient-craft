# Work item 14 — flowrider — flow: send-message-with-images

## 0. Identity

- **Work item id**: `156d650c-fa18-48a0-a043-18f114f0b178`
- **Session id**: `42edd7ea-612e-464e-b382-a5713d077d85`
- **Operation item id**: `339d7ed2-43c1-4023-8af8-a0511cb25caf`
- **Role**: `flowrider` · **Model**: `claude-opus-5` (166/166 assistant records; `MODELS {'claude-opus-5': 166}`)
- **Operation text** (verbatim from the rendered prompt): `[flowrider] Flowrider: author the test suites that prove this flow — flow: send-message-with-images`
- **dependsOn**: chained after work item [13] (flowrider, `paste-image-into-composer`, session `5c841160-080c-4eea-adf6-e7736b92121e`), which itself followed the `pt 2: Ward gate (changed files)` command item [12]. `flowIds=['send-message-with-images']`, `packageNames=[]`.
- **Status**: `complete`. Signalled `operationStatus: 'done'` at 249.0m; reviewer commit `f2aaeabab` pushed.
- **Window**: `2026-09-02T12:03:57.730Z` leads to `2026-09-02T16:13:14.136Z` (ledger). Transcript span `2026-09-02T12:04:12.983Z` leads to `2026-09-02T16:13:31.266Z` = **4:09:18 = 249.3 min**.
- **Sub-agents**: 18 total. 14 dispatched directly by the flowrider (`Agent` x14 in the main session), 4 more nested one level deeper by `agent-af05d16a34f6c746b`. Confirmed from `.meta.json` `spawnDepth`:

| depth | agents | agentType/model |
|---|---|---|
| 1 | a1333d035fab064a0, af17f22a0d15817a1 | `Explore`/`sonnet` |
| 1 | a2783f34a8cd98f13, a1792ff3b57982e69, a18736f1239617752, abda90e772a79327a, a607a08d9cdd05297, af05d16a34f6c746b, ab46a7b4fc19d41dc, a20e184886cb97c2e, a993e2dc8516d885d, af8b4694f9e631e56, a940d4ee18099c9df, a24cdcac64cb4c836 | `general-purpose`/`sonnet` |
| 2 | a2cc341278a378d59, ab1afb224c2fc8050, a1b14c861aab14dbb, a21bc837ad5c17e42 | `Explore`/`None` (model unset in meta) |

Every dispatched agent was `sonnet`, as the prompt requires (`Dispatch with subagent_type: "general-purpose" and model: "sonnet"`). No agent ran on opus but the flowrider itself.

---

## 1. Chronological breakdown — where the time went

Phase boundaries are taken from the main-session `timeline`. Every `### INJECTED PROMPT: <task-notification>` line is a sub-agent return.

| # | Clock (UTC) | Elapsed | Min | What happened | Evidence |
|---|---|---|---|---|---|
| P1 | 12:04:13–12:11:25 | 0.0–7.2m | **7.2** | Orientation. `get-agent-prompt` (36,202-byte result), `get-quest` (37,508 bytes), `get-qa-checklist`, then `get-architecture` + `get-testing-patterns` + `get-syntax-rules` in one message; 10 `discover` calls and 13 `Read`s of web widgets/harnesses. Two `Explore` agents dispatched at 1.2m and 1.4m and both back by 7.2m. | `0.6m … say: "58 units across 5 walk paths. Let me load the repo standards and survey what exists."` · `7.2m 110s 8900 … "Both explorers are back."` |
| P2 | 12:11:25–12:14:00 | 7.2–9.8m | **2.6** | Spec correction (`modify-quest` at 7.3m — three spec statements that did not match the implementation), then the map. The `Write` call itself carried a 133-second thinking gap. | `7.4m 10s 13020 … say: "Now my map."` · `9.6m 133s CALL Write(file_path=…/.quest-plans/339d7ed2-…)` · `<- result 34,602 bytes` |
| P3 | 12:14:00–12:47:00 | 9.8–42.8m | **33.0** | Group 1 out (below-browser): `a2783f34a8cd98f13` server integration + `a1792ff3b57982e69` shared static. The static returned at 12.4m and was signed at 12.6m; the server agent ran 31.0m. Six units signed on its return. | `12.7m 1785s` gap → `42.4m … "Group 1 is complete: six units proved with witnessed reds, two covered by passing assertions but never driven red."` |
| P4 | 12:47:00–12:55:30 | 42.8–51.3m | **8.5** | Group 2 dispatched: `a18736f1239617752` (red-first rework on the two server units that never went red) alongside `abda90e772a79327a` (first browser walk). The rework returned at 51.1m; 2 more units signed → 9 of 58. | `51.1m 342s … "Both server units now bite under a real break."` |
| P5 | 12:55:30–13:44:30 | 51.3–100.3m | **49.0** | Wait on the chat-route browser walk (37.3m), then its rework. Eight units came back proved and eight passed without ever going red; the flowrider corrected the spec (`SEND_BUTTON` is *absent* in flight, not disabled), signed nine, and sent `a607a08d9cdd05297` to drive the other eight red (9.8m). 26 of 58 signed. | `51.3m → 88.6m 2238s` · `89.1m … "18 of 58 signed. Now the rework: eight units in that spec passed without ever going red"` · `99.9m 589s … "All eight went red."` |
| P6 | 13:44:30–14:20:00 | 100.3–135.9m | **35.6** | Group 3: `af05d16a34f6c746b` — what actually reaches the CLI (rewritten `-p` path, prompt trailer, follow-up spawn). It spawned 4 nested `Explore` agents of its own. All ten units proved red. 36 of 58. | `101.6m → 135.0m 1999s` · `135.0m … "All ten proved with witnessed reds."` |
| P7 | 14:20:00–15:05:00 | 135.9–181.0m | **45.1** | Group 4: `ab46a7b4fc19d41dc` — the rejection path, plus a typecheck sweep over the two specs already written. Longest single wait of the item. Nine units proved red-then-green; typecheck went 50 → 0 across three specs. 45 of 58. | `137.2m → 180.5m 2600s` · `180.6m … "All nine proved red-then-green, and typecheck went from 50 errors to 0 across the three specs."` |
| P8 | 15:05:00–15:25:20 | 181.0–201.3m | **20.3** | Group 5: `a20e184886cb97c2e` — Shift+Enter newline and text-only send. Returned `NEXT: wall`. Surfaced a measured product defect (`'one'+Shift+Enter+'two'` reads back `'onetwo\n'`). 50 of 58 signed plus a new observable. | `182.0m → 200.7m 1118s` · `200.7m … "Group 5 found a genuine product defect. Shift+Enter at the end of the composer inserts the newline, but every character typed afterwards lands *before* it"` |
| P9 | 15:25:20–15:51:10 | 201.3–227.2m | **25.9** | Final test-writing dispatch: `a993e2dc8516d885d` carrying group 5's rework AND group 6's create-surface walk in one agent so the two Playwright runs stayed sequential. 6 signed, 2 recorded unconfirmable. Then re-read the checklist. | `202.3m → 226.3m 1434s` · `201.3m … "Final dispatch: the group 5 rework plus group 6's create-surface walk, in one agent so the two Playwright runs stay sequential."` |
| P10 | 15:51:10–16:01:35 | 227.2–237.4m | **10.2** | Gap-fill + own diff read. `af8b4694f9e631e56` (follow-up POST body shape — a unit the checklist re-read revealed nobody had covered), 6 `Bash` reads of the diff and the new specs, then `a940d4ee18099c9df` to fix a tautological assertion the diff read exposed. | `227.2m … "nothing asserted the **follow-up route's request body shape**"` · `228.7m … "the expected side of \`check-both-states-produce-same-body-shape\` is built from \`chatBody\` itself, so one half of the object compares \`chatBody\` to \`chatBody\` — a tautology"` |
| P11 | 16:01:35–16:13:31 | 237.4–249.3m | **11.9** | One reviewer (`a24cdcac64cb4c836`, 11.0m), which built, warded twice, committed `f2aaeabab` and pushed. Flowrider corrected its own count 57/2 → 55/4, wrote the ward tooling note, checked the tree clean, signalled. | `237.5m → 248.7m 673s` · `248.8m … "Reviewer passed and committed \`f2aaeabab\`. Correcting my own count: **55 confirmed, 4 unconfirmable**"` |
| | | | **249.3** | | |

### Time by category

Derived from the assistant-to-assistant gap census on the main session (`TOTAL span covered by assistant-to-assistant gaps: 249.2 min`; `TOTAL in gaps>=60s: 13929s = 232.2 min`; `Active (gaps<60s) time: 17.1 min`).

| Category | Minutes | % | How it was measured |
|---|---|---|---|
| Orientation / reading | **8.2** | 3.3% | P1 (7.2) + the 1.0m diff-reading block at 227.8–228.7m |
| Planning (map + spec correction) | **2.6** | 1.0% | P2 |
| Sub-agent dispatch — waiting | **209.4** | 84.0% | Sum of the 10 non-reviewer task-notification gaps: 1785+342+2238+589+1999+2600+1118+1434+147+308 = 12,560s |
| Review cycles | **11.2** | 4.5% | The single reviewer wait, 673s at 237.5→248.7m |
| Verification / ward run by this session | **0.0** | 0% | The prompt's `[BUILD]` rule forbids it; zero `npm run ward` / `npm run build` calls appear in the main session's 10 `Bash` calls |
| Idle or stall | **0.0** | 0% | No gap is unaccounted for; every ≥60s gap ends in either a notification or the flowrider's own next tool call |
| Other (routing, sign-off, own long thinking) | **17.9** | 7.2% | 249.3 − (8.2+2.6+209.4+11.2) — the 17.1m of sub-60s activity plus the 0.8m residue of the eight own-thinking gaps ≥60s not already inside P1/P2 |

**The single largest fact about this work item: the opus session was actively generating tokens for 17.1 of 249.3 minutes (6.9%). 220.6 minutes — 88.5% — were spent blocked on serialized sonnet sub-agents.**

---

## 2. Chronological token buckets

Main session, verbatim (`python3 tmp/transcript-digest.py buckets 42edd7ea-612e-464e-b382-a5713d077d85 --minutes 15`):

```
BUCKETS of 15 min
WINDOW              APIs  CALLS   OUT-TOK    CTX-IN-TOK  RESULT-BYTES  TOP TOOLS
09-02 12:04-12:19    77     41   153,535    17,980,025       602,675  Readx13, mcp__dungeonmaster__discoverx10, Agentx4, Bashx3
09-02 12:34-12:49     6      2    54,060     2,237,958         5,807  mcp__dungeonmaster__modify-questx1, Agentx1
09-02 12:49-13:04     6      2    16,378     2,332,630        23,640  Agentx1, mcp__dungeonmaster__modify-questx1
09-02 13:19-13:34     6      2    33,180     2,395,488        12,469  mcp__dungeonmaster__modify-questx1, Agentx1
09-02 13:34-13:49     8      2    36,670     3,308,395        18,928  mcp__dungeonmaster__modify-questx1, Agentx1
09-02 14:04-14:19     2      0     9,504       852,974             0  
09-02 14:19-14:34     5      2    32,867     2,161,516        19,883  mcp__dungeonmaster__modify-questx1, Agentx1
09-02 15:04-15:19     7      2    29,153     3,132,789        14,453  mcp__dungeonmaster__modify-questx1, Agentx1
09-02 15:19-15:34     7      2    34,977     3,224,212        15,706  mcp__dungeonmaster__modify-questx1, Agentx1
09-02 15:49-16:04    34     13    43,885    16,686,216        49,020  Bashx6, mcp__dungeonmaster__modify-questx3, Agentx3, mcp__dungeonmaster__get-qa-checklistx1
09-02 16:04-16:19     8      3     9,193     4,091,595           485  Bashx1, mcp__dungeonmaster__modify-questx1, mcp__dungeonmaster__signal-backx1
```

Six of the seventeen 15-minute windows in the item's span produce **no row at all** (12:19–12:34, 13:04–13:19, 13:49–14:04, 14:34–15:04 (two windows), 15:34–15:49). Those are windows in which the opus session made zero API calls because it was waiting.

### Sub-agent token spend, attributed to the bucket each sub-agent started in

| Bucket start | Sub-agents started | sub-out | sub-input (uncached) | sub-cache_read | sub-cache_creation |
|---|---|---|---|---|---|
| 12:04 | a1333d035, a1792ff3b, a2783f34a, af17f22a0 | 196,871 | 764 | 86,198,893 | 3,294,551 |
| 12:34 | a18736f12 | 27,308 | 122 | 6,452,138 | 326,854 |
| 12:49 | abda90e77 | 198,735 | 528 | 97,390,238 | 1,470,584 |
| 13:19 | a607a08d9 | 32,351 | 162 | 11,776,796 | 501,072 |
| 13:34 | a2cc34127, ab1afb224, af05d16a3 | 164,820 | 362 | 37,786,256 | 1,698,080 |
| 13:49 | a1b14c861, a21bc837a | 17,144 | 120 | 3,056,502 | 463,600 |
| 14:19 | ab46a7b4f | 198,543 | 506 | 89,950,079 | 1,152,379 |
| 15:04 | a20e18488 | 100,029 | 228 | 25,349,437 | 790,958 |
| 15:19 | a993e2dc8 | 95,733 | 302 | 37,493,450 | 893,782 |
| 15:49 | a24cdcac6, a940d4ee1, af8b4694f | 81,183 | 306 | 19,492,300 | 1,751,658 |
| **TOTAL** | **18** | **1,112,717** | **3,400** | **414,946,089** | **12,343,518** |

### Totals

| | output | input (uncached) | cache_read | cache_creation | context-in total |
|---|---|---|---|---|---|
| Main session (opus) | 453,402 (140,796 thinking) | 332 | 57,116,500 | 1,286,966 | 58,403,798 |
| 18 sub-agents (sonnet) | 1,112,717 | 3,400 | 414,946,089 | 12,343,518 | 427,293,007 |
| **Grand total** | **1,566,119** | **3,732** | **472,062,589** | **13,630,484** | **485,696,805** |

`cache_read` is 97.2% of all context-in. `cache_creation` is 2.8%. Uncached input is 3,732 tokens — negligible. **The item's token cost is essentially the price of re-reading a large, mostly-static context 1,866 times** (166 main + 1,700 sub-agent assistant turns).

---

## 3. Was the prompt fit for the work?

The rendered prompt (`result … get-agent-prompt`) is **36,212 chars** — comfortably under the 50,000 `mcpToolResultStatics.maxVerbatimChars` ceiling, so nothing spilled. It matches `flowriderPromptStatics.prompt.template` byte for byte with `$ARGUMENTS` replaced by:

```
## Operation Context

Quest ID: 1be07040-b9ec-476c-a439-0b4fbb0123cd
Work Item ID: 156d650c-fa18-48a0-a043-18f114f0b178
Operation Item ID: 339d7ed2-43c1-4023-8af8-a0511cb25caf
Your operation item: [flowrider] Flowrider: author the test suites that prove this flow — flow: send-message-with-images
```

Grepping the rendered payload for the optional blocks returns zero for every one of them:

```
Work item context -> 0
packagesAffected -> 0
packageNames -> 0
wardMode -> 0
Dev Server -> 0
Base branch -> 0
Failed ward result -> 0
```

That is the documented, correct render for a flowrider — `workItemToPromptTransformer` serves four ids and nothing else, and `workItemContextBlockStatics` is only appended for a *sub-agent* fetch carrying both ids. The **scope block is accurate but empty of scope**: the operation item's `packageNames=[]`, so nothing in the prompt names a package. The prompt compensates by construction (step 2: "Each node's package tags come from your step-1 `get-quest` render"), and the flowrider found the packages correctly — but it cost a survey.

### What drove behaviour, well

**"Grouping is by file, with one extra rule: never two browser walks against the same package at once. Playwright writes one report path per package."** (step 4)

This is the most load-bearing sentence in the file and the session obeyed it exactly. Every browser-walk sub-agent ran with an empty window on either side — measured from the roster: abda90e ends 13:31:56 and a607a08d starts 13:34:08; a607a08d ends 13:43:31 and af05d16a starts 13:45:48; af05d16a ends 14:18:42 and ab46a7b4 starts 14:21:22; ab46a7b4 ends 15:04:22 and a20e18 starts 15:06:11; a20e18 ends 15:24:05 and a993e2dc starts 15:26:33. **Zero overlaps.** The flowrider even restated it back at 90.0m: `"It has to run alone — Playwright writes one report path per package, so a second browser walk started now would overwrite the report this one is reading."` And at 201.3m it went further than the rule required, packing a rework and a fresh walk into ONE agent rather than two: `"the group 5 rework plus group 6's create-surface walk, in one agent so the two Playwright runs stay sequential."`

That rule is also the direct cause of the 249 minutes. It is correct and it is expensive; §6 fix 1 addresses the cost without breaking the rule.

**"Sign this group's `PROVED` lines NOW, before you send the next group."** (step 5)

Observed 13 times — `mcp__dungeonmaster__modify-quest` x13, one per group return, at 7.3m, 12.6m, 42.8m, 51.2m, 89.0m, 100.2m, 135.4m, 181.0m, 201.0m, 226.9m, 231.3m, 237.3m, 248.9m. Running counts appear in the flowrider's own prose at every step (`"9 of 58 signed"`, `"26 of 58"`, `"36 of 58"`, `"45 of 58"`, `"50 of 58"`, `"57 of 59"`). No transcription backlog ever formed.

**"A defect you measure is a new observable, not a verdict."** (Recording what you claim)

Two defects were added to the spec as observables rather than dropped into a sign-off: the create-surface image drop (`quest-new-responder.ts:54`) and the Chromium end-of-content newline. The unit count moved from 58 to 59 as a result, and the flowrider recorded it: `"All 59 units now carry a verdict."`

### Where the prompt's step script did not match the work

**1. The `PROVE` line in the brief template is wrong for an e2e-only file set.** The template says, verbatim:

```
PROVE
  npm run ward -- --only lint,test -- <this brief's own paths>
```

`test` expands to `unit,integration,e2e`. For a file set that is one `.e2e.ts` plus one `.harness.ts`, `unit` and `integration` have no counterpart and ward answers `DISCOVERY MISMATCH`. `agent-abda90e772a79327a` hit exactly that and had to reason its way out:

> `The originally-specified --only lint,test hit a DISCOVERY MISMATCH on unit/integration (neither check type has a counterpart for a .e2e.ts/.harness.ts pair) — resolved per ward-discipline by narrowing to --only lint,e2e rather than widening scope.`

The flowrider learned from it and hand-wrote `--only lint,e2e` into brief 6 (a607a08d) — but then over-corrected to `--only lint,typecheck,e2e` in briefs 7–11, which the same prompt explicitly forbids (below).

**2. `typecheck is deliberately out` was overridden by the flowrider itself.** The prompt's rationale is unambiguous:

> **`--only lint,test` keeps typecheck out, and typecheck is the one that builds.** Ward runs it as `tsc -b`, which writes the shared `dist/`, so a wave of sub-agents running it at once hands each other type errors on correct code. Your reviewer's `--staged` run is the typecheck.

The flowrider wrote `--only lint,typecheck,e2e` into five briefs (ab46a7b4, a20e18, a993e2dc, af8b4694, a940d4ee) and announced the reason at 137.2m: `"plus a typecheck sweep over the two specs already written. A previous agent flagged noUncheckedIndexedAccess errors in them and left them unfixed, which would land on my reviewer's full ward run."` The reasoning is sound — the flowrider was buying down a known red before the reviewer inherited it — and the concurrency hazard the rule guards against did not exist here, because browser walks were serialized anyway. But the prompt gives the session no vocabulary for "typecheck is safe when only one sub-agent is out", so the session simply broke the rule silently.

**3. The `NEXT: wall` lookup table is a trap for a sub-agent that has no definition of `wall`.** The prompt's own routing is a hard lookup:

> | `wall` | stop sending work out. Let anything running finish, then go to step 9. |

and step 9, then step 10, then `signal blocked`, which halts the entire quest. `agent-a20e184886cb97c2e` returned:

> `**NEXT:** wall — two items need a person's call: (1) whether 'onetwo\n' … is an acceptable UX or a real widget bug …; (2) whether the RED FIRST instruction for :245 should be updated/dropped …`

Neither is an environment wall. The flowrider correctly refused the lookup, treated it as a rework, and kept going — but it did so by silently overriding an instruction the prompt states as a table with no exceptions. **The brief template hands a sub-agent `NEXT: pass | rework | wall — <what a person must change>` with no explanation of what `wall` means, while the [WALL] rule that defines it lives only in the flowrider's own prompt, which the sub-agent never sees.**

**4. Nothing in the prompt tells a sub-agent that its siblings' uncommitted work will already be in the tree.** Three separate sub-agents spent turns diagnosing their own pass's earlier output as foreign:

> `abda90e772a79327a`: `"git status shows packages/server/src/flows/quest/quest-flow.integration.test.ts and packages/server/test/harnesses/server-app/server-app.harness.ts modified, and an untracked .quest-plans/... file — none of these were touched by me … they appear to be a concurrent session's work on this shared branch."`

> `ab46a7b4fc19d41dc`: `"none of these were touched by me; they appear to be a concurrent session's work sharing this worktree."`

> `af05d16a34f6c746b`: `"git status shows unrelated pre-existing uncommitted changes … not touched by me, confirmed by git diff --stat against those paths showing only large pre-existing diffs unrelated to any of my 3 tiny one-line breaks."`

Those files are `a2783f34a8cd98f13`'s output from group 1 of the *same* pass. The prompt's own design guarantees this — "the pass reaches the reviewer entirely uncommitted" — but the brief template's `DO NOT TOUCH` block says only `<other sub-agents' files>`, which does not tell the reader they will *see* those files as dirty.

**5. What the prompt was missing that the flowrider had to invent.** Nothing in the prompt covers the *serialization cost*. Step 5's parallelism rule ("Every test file in ONE group goes out in a SINGLE message") is written for the file-disjointness case; the browser-walk exception then forces N sequential 20–45 minute waits with no guidance on what the operator should do with those minutes. The flowrider invented the correct behaviour — it ended its turn on a plain message six times, exactly as `[HELPERS]` says ("With everything you can do done and a helper still out, end your turn on a plain message and no tool call") — but it had no work to overlap because the prompt gives it none.

---

## 4. What went well

**1. Zero e2e/Playwright discipline violations of the kind CLAUDE.md warns about. (0 min lost)**

The repo's headline warning is that e2e must run under `dev:no-watch`, never `dev`. Across all 18 sub-agents and 285 Read calls there is **not one `npm run dev` invocation**. Every browser walk went through the project's own `packages/web/playwright.config.ts`, whose `webServer` block is:

```
command: 'npm run dev:no-watch --workspace=@dungeonmaster/server',
```

I searched every sub-agent transcript for the documented mystery-failure signatures. The counts look alarming until you read the contexts:

| symptom | raw hits | actual failures |
|---|---|---|
| `Unexpected end of JSON input` | 3 | **0** — all three are the same string inside the `playwright.config.ts` comment the agent was reading |
| `ECONNREFUSED` | 20 | **0** — the config comment, a `claude-mock` harness comment about IPv4/IPv6, and `get-testing-patterns`' own `toStrictEqual` example |
| `net::ERR` | 1 | **0** |
| `waitForResponse` | 222 | **0** — the Playwright API the specs legitimately call |
| `Test timeout of 10000ms exceeded` | 2 | **1 real**, in `ab46a7b4fc19d41dc`: `locator.waitFor: Test timeout of 10000ms exceeded. Call log: - waiting for getByTestId('CHAT_INPUT') to be visible` — a test-authoring bug on its own new spec, not a restarting server |

Iteration was scoped, not full-suite: of the 38 `npx playwright test` invocations, **36 carried `--grep "<one test name>"`** and only two ran the whole spec file (both by `abda90e772a79327a`, at 30.1m and 38.7m, and the second was its final confirmation run). Every ward test run used `--onlyTests "<one name>"` on a single spec path — 70 scoped ward runs across all agents. The prompt's own instruction did not ask for that; `get-testing-patterns` and the ward snippet did, and they landed.

**2. The `never two browser walks at once` rule held perfectly.** Five browser walks, five clean windows, zero report-path collisions. Measured in §3.

**3. The flowrider found real defects instead of writing green tests around them. (roughly 46 min, roughly 294k sub-agent output tokens)**

Three findings, all with measured values rather than inferences:

- **Product defect** — `quest-new-responder.ts` destructures only `{message, questType}` and drops `images`, so a brand-new quest's first pasted image never reaches the agent. Measured live by `a993e2dc8516d885d`: `"-p prompt's final lines: ## User Request\n\nA[Pasted Image 1]B — the bare, unsubstituted [Pasted Image 1] placeholder"` and `"readQuestImagesDir → imagesDirExists: false, imagesDirFileNames: []"`. The red test was then **deleted** so nothing ships red, and the unit recorded `unconfirmable` with a `toSettle`.
- **Chromium/widget defect** — end-of-content Shift+Enter pins the newline: `"'one' + Shift+Enter + 'two' reads back as 'onetwo\n', never 'one\ntwo'"`, verified three ways.
- **Spec inaccuracy caught before it became a false green** — at 88.6m: `"SEND_BUTTON is *absent* during flight, not disabled — the composer swaps it for STOP_BUTTON in the same React commit."`

**4. The flowrider read the diff and found a tautology its sub-agent had shipped. (5.1 min, roughly 18k tokens)**

At 228.7m, after `git status` / `git diff --stat` / `wc -l` and four `python3 -c` scans of its own new specs:

> `"In send-images-create-surface.e2e.ts:181-195, the expected side of check-both-states-produce-same-body-shape is built from chatBody itself, so one half of the object compares chatBody to chatBody — a tautology. More importantly, if *both* routes dropped their images the assertion would still pass."`

It dispatched `a940d4ee18099c9df` to tighten it, and the tightened version was empirically confirmed: `"the agent verified empirically that the original shape passed **green** while both routes dropped their images."` **This is step 6 doing exactly what step 6 exists for**, and it caught a false green the sub-agent and the reviewer would both have passed.

**5. Re-reading the checklist at the end found a genuinely uncovered unit. (3.4 min, roughly 14.5k tokens)**

At 227.0m the flowrider called `get-qa-checklist` a second time and found: `"nothing asserted the **follow-up route's request body shape**. Group 3 drove a follow-up send and checked the spawned -p, but never the body."` The prompt's step 9 asks for this re-read; the session did it and it paid.

**6. The flowrider corrected its own arithmetic against the reviewer.** At 248.8m: `"Correcting my own count: **55 confirmed, 4 unconfirmable** — I'd said 57/2, missing that the two defect records are also unconfirmable verdicts."` And it noticed the reviewer had mis-attributed a note: `"attributed the note to me when I hadn't written one. Writing it now."`

**7. The reviewer's ward discipline was clean and it found a real tooling bug.** Its six test/build commands, in order: `npm run build` (5.9m, own command, unpiped), `npm run ward -- --staged` (6.3m), `ward -- detail` (7.2m), `npm run ward -- -- <8 explicit paths>` (8.0m), `ward -- detail` (9.4m), `git commit` (10.7m). Build first, unpiped, foreground, ward run **twice** — exactly the `[BUILD]` budget. And the second run existed because the first was blind:

> `Tooling gap: npm run ward -- --staged diffs against origin only, so it is blind to untracked new files — it silently scoped only to packages/server on the first ward run here and missed all 6 new packages/web files entirely.`

The flowrider wrote that up as a durable `tooling-error` quest note at 248.9m, id `ward-staged-blind-to-untracked-files`. **This affects every reviewer of every operator role whose deliverable is new files.**

---

## 5. What agents did that they should not have

### Finding 1 — Every sub-agent re-loaded the same 94,985 bytes of repo standards; 13 loads in this item alone

Every one of the 12 `general-purpose` sub-agents made the identical three MCP calls, and every one got byte-identical results:

```
agent-a1792ff3b57982e69  94,985 bytes  [('get-architecture', 19056), ('get-syntax-rules', 24528), ('get-testing-patterns', 51401)]
agent-a18736f1239617752  94,985 bytes  [(...identical...)]
… (12 rows, all 94,985) …
GRAND TOTAL sub-agent orientation result bytes: 1,139,820  (~284,955 tokens at 4 chars/token)
```

The main session loaded the same three itself at 0.6m (`MAIN SESSION orientation result sizes: {'get-architecture': 19056, 'get-testing-patterns': 51401, 'get-syntax-rules': 24528}`). **13 × 94,985 = 1,234,805 bytes, about 309k tokens of identical text in one work item.** Because it lands at the top of each sub-agent's context and every later turn re-reads it, its true cost is roughly 309k × (turns per agent) in cache_read — a material share of the 472M cache_read total.

- **Cost**: roughly 309k tokens of first-load; the "minutes to first Edit" column shows the wall-clock tail — `a2783f34a8cd98f13` 10.6m, `ab46a7b4fc19d41dc` 10.4m, `abda90e772a79327a` 9.7m before the first edit, against `a1792ff3b57982e69` 0.4m and `a940d4ee18099c9df` 0.9m for the small ones.
- **Prompt stance**: **required**. Both the flowrider prompt ("Load the repo's standards first") and the brief template (`FIRST\n  get-architecture, get-syntax-rules, get-testing-patterns`) mandate it, and the flowrider wrote that `FIRST` block into all 11 test-writing briefs.

### Finding 2 — 24 forbidden `npm run build` invocations by test-writing sub-agents

Every brief carried the `PROVE` block verbatim, ending `no npm run build · no run-ward MCP tool · no commit · never widen the ward`. Seven sub-agents ran it anyway:

| agent | `npm run build` calls | brief said |
|---|---|---|
| a993e2dc8516d885d | 8 | `no npm run build` |
| a2783f34a8cd98f13 | 4 | `no npm run build` |
| ab46a7b4fc19d41dc | 4 | `no npm run build` |
| a1792ff3b57982e69 | 2 (workspace-scoped) | `no npm run build` |
| a18736f1239617752 | 2 | `no npm run build` |
| a940d4ee18099c9df | 2 | `no npm run build` |
| a607a08d9cdd05297 | 1 | `no npm run build` |
| af05d16a34f6c746b | 1 | `no npm run build` |
| **subtotal (forbidden)** | **24** | |
| a24cdcac64cb4c836 (reviewer) | 1 | **allowed** — `[BUILD]` gives the reviewer the build |

`a993e2dc8516d885d`'s pattern is the clearest instruction failure: `npm run build; echo "BUILD_EXIT_CODE=$?"` seven times in 23.7 minutes, at 5.1m, 5.6m, 6.6m, 7.5m, 16.3m, 18.7m, 20.8m, 22.0m — a build before nearly every ward run.

- **Cost**: builds are not individually timed in the transcript, but the whole time-inside-test-and-build-commands census gives the envelope: `a993e2dc8516d885d 23.7 wall / 16 runs / 5.7 min in-runs / 24.1%`. A conservative 20–30 s per repo build puts 24 builds at **8–12 minutes** of pure waste, plus the concurrency hazard the rule exists to prevent.
- **Prompt stance**: **forbidden**, in the brief the agent was reading.

### Finding 3 — 38 raw `npx playwright test` invocations bypassing ward, one of them from inside a package directory

`agent-abda90e772a79327a` ran `npx playwright test` **26 times** (20.5m through 38.7m) and only reached for ward at 39.3m. `agent-a20e184886cb97c2e` ran it **12 times**, every one prefixed with a `cd` into the package:

```
5.2m  cd /home/…/packages/web && npx playwright test src/flows/quest-chat/send-text-only-and-newline.e2e.ts --project=chromium --reporter=line 2>&1 | tail -100
```

Both forms are named in the `<dungeonmaster-ward>` snippet every session receives (`ALWAYS use npm run ward. Never npx jest/eslint/tsc/playwright`) and the second is named in `<dungeonmaster-wardDiscipline>` (`Never cd into a package`).

- **Cost**: not additive wall-clock — a raw playwright run is not slower than a ward-wrapped one. The cost is that lint never ran during 26 iterations, so `abda90e772a79327a` discovered its lint state only at 39.3m, in the last three minutes of a 42.4-minute agent. Its `--only lint,test` run then hit `DISCOVERY MISMATCH` and it had to run ward a second time at 40.2m.
- **Prompt stance**: the brief template's `PROVE` block names ward and says `never widen the ward`; it does not say "and use nothing else to run a test". The `<dungeonmaster-ward>` snippet does, and both agents ignored it.

### Finding 4 — `--only typecheck` ran in seven sub-agents, five of them because the flowrider put it in the brief

The flowrider's own prompt calls this out as load-bearing: *"`--only lint,test` keeps typecheck out, and typecheck is the one that builds."* Yet:

- Unauthorized (brief said `lint,test` or `lint,e2e`): `a2783f34a8cd98f13` ran `--only lint,typecheck` 3× (20.4m, 22.9m, 24.0m); `af05d16a34f6c746b` ran `--only lint,typecheck` and `--only typecheck` (24.0m, 26.8m).
- Authorized by the flowrider against its own prompt: briefs for `ab46a7b4fc19d41dc`, `a20e184886cb97c2e`, `a993e2dc8516d885d`, `af8b4694f9e631e56`, `a940d4ee18099c9df` all read `PROVE npm run ward -- --only lint,typecheck,e2e -- …`.

`ab46a7b4fc19d41dc`'s final run reports `typecheck PASS (7414 files)` — a full `tsc -b` across the monorepo, inside a sub-agent, exactly what the rule forbids.

- **Cost**: `ab46a7b4fc19d41dc` alone budgeted 43.0 min with 3.9 min inside runs; the two whole-repo typechecks are the bulk of that. Estimated **4–6 minutes** across all seven.
- **Prompt stance**: **forbidden by the prompt, permitted by the brief** — an internal contradiction the flowrider created and never flagged.

### Finding 5 — Three sub-agents each spent turns misdiagnosing their own pass's uncommitted work as a foreign session

Quoted in full in §3 item 4. `abda90e772a79327a`, `ab46a7b4fc19d41dc` and `af05d16a34f6c746b` each ran extra `git status` / `git diff --stat` calls and wrote a paragraph of their return explaining files that belonged to `a2783f34a8cd98f13`, a sibling in the same pass.

- **Cost**: roughly 1–2 turns and roughly 0.5 min each, about **2 minutes and roughly 4k output tokens**. Small individually; it recurs on every multi-group flowrider item.
- **Prompt stance**: **permitted** — nothing in the prompt or template addresses it.

### Finding 6 — Eight units in the first browser walk passed without ever being driven red, requiring a whole extra sub-agent

`abda90e772a79327a` (42.4 min) came back with `"eight units red-proved and eight that passed without ever going red"` (flowrider at 88.6m). The flowrider then had to dispatch `a607a08d9cdd05297` purely to drive those eight red — 9.4 min, 32,351 output tokens, 12,278,030 context-in. The same shape had already happened in group 1: `"six units proved with witnessed reds, two covered by passing assertions but never driven red"` (42.5m), requiring `a18736f1239617752` — 7.3 min, 27,308 output tokens.

- **Cost**: **16.7 minutes of serialized wall clock and 59,659 sub-agent output tokens** on two rework agents whose entire job was re-running a step the original brief already demanded.
- **Prompt stance**: **required and violated**. The brief template's `RED FIRST` block is explicit ("Watch it fail before you make it pass"), and the flowrider pasted it into both briefs. What the template lacks is any *return-side* enforcement: `PROVED:` asks for `<the red I witnessed>` but nothing rejects a `PROVED` line whose red field is empty. The flowrider had to detect the omission by reading prose.

### Finding 7 — `agent-a20e184886cb97c2e` returned `NEXT: wall` for two product questions

Quoted in §3 item 3. Taken literally, the prompt's lookup would have sent the flowrider to step 9 and `signal-back(operationStatus: 'blocked')`, halting the whole quest over a UX question about a newline.

- **Cost**: **zero, because the flowrider ignored the table.** The exposure is what matters: a session that followed the prompt exactly would have blocked quest `1be07040` at 200.7m with 8 units unwritten.
- **Prompt stance**: the flowrider's own `[WALL]` rule defines a wall correctly; the *brief template* propagates only the word `wall` to a sub-agent that has never read that rule.

### Finding 8 — The first reviewer ward run checked nothing this item produced

`npm run ward -- --staged` at 6.3m scoped itself to `packages/server` alone and exited 0 while never seeing the six brand-new `packages/web` files — 5 `.e2e.ts` specs and `composer-send.harness.ts`. The reviewer caught it and ran a second, explicitly-scoped ward at 8.0m, which is what actually exercised them (`lint PASS 8/8, typecheck PASS 7416/7416, integration PASS 32/32, e2e PASS 28/28`).

- **Cost**: **roughly 1.7 minutes** of a wasted ward run, and — far more significantly — one of the reviewer's two permitted ward runs. Had it not noticed, a suite of six unlinted, untypechecked, unrun files would have been committed and signed off.
- **Prompt stance**: **required.** `flowriderReviewerStatics` step 6 hardcodes `npm run ward -- --staged` and calls it "what typechecks every package this suite touched" — a claim the tool does not honour for untracked files.

### Finding 9 — Duplicated orientation against the previous flowrider on the same quest

Item [13] (`5c841160-080c-4eea-adf6-e7736b92121e`, flow `paste-image-into-composer`) ran 09:00 to 12:04 and finished 15 seconds before item [14] started. It is the adjacent flow on the same quest, over the same package set.

| | item [13] | item [14] |
|---|---|---|
| wall clock | 184.0 min | 249.3 min |
| sub-agents | 8 | 18 |
| main-session output tokens | 347,646 | 453,402 |
| main-session context-in | 29,816,937 | 58,403,798 |
| sub-agent output / context-in | 758,467 / 227,473,437 | 1,112,717 / 427,293,007 |
| distinct files Read (session + sub-agents) | 64 | 120 |
| total Read calls | 168 | 298 |

**The measured duplication:**

- **30 of item [14]'s 120 distinct files (25.0%) had already been read by item [13].** Item [14] spent **93 of its 298 Read calls (31.2%)** on files item [13] had already opened.
- Top re-reads (item-14 reads / item-13 reads): `chat-input-widget.tsx` **14 / 6**; `pasted-image-persist-broker.ts` **7 / 2**; `composer-paste.harness.ts` **7 / 16**; `claude-mock.harness.ts` **7 / 1**; `quest-chat-responder.ts` **6 / 1**; `pasted-image-statics.ts` **5 / 5**; `quest.harness.ts` **5 / 3**; `playwright.config.ts` **3 / 5**.
- **Standards duplication across the two items**: item [13] loaded the 94,985-byte triple 7 times (main + 6 sub-agents with orientation calls); item [14] loaded it 13 times. **20 loads of the same roughly 95 KB in 7 hours 13 minutes of consecutive work on one quest**, about **475k tokens**.

**Quantifying the duplicated orientation in minutes.** Item [14]'s own orientation phase P1 is 7.2 min, and its per-sub-agent orientation tail is visible in minutes-to-first-Edit: the four large sub-agents that had to re-derive the same web/server topology took 9.7m (abda90e), 10.4m (ab46a7b4), 10.6m (a2783f34) and 5.2m (af05d16a) before their first edit, against 0.4m–2.8m for the five small ones handed a narrow, pre-scoped brief. Taking the small agents' 1.5m median as the floor, the four large ones spent **(9.7−1.5)+(10.4−1.5)+(10.6−1.5)+(5.2−1.5) = 29.9 minutes** on orientation that a shared handoff would have shortened. Adding P1's 7.2 min and the two Explore agents that mapped the server and orchestrator paths item [13] had already crossed, the recoverable duplication is **about 30–37 minutes and about 475k tokens** on this item.

- **Prompt stance**: **required by omission.** Nothing in `flowriderPromptStatics` mentions a sibling flowrider, a previous item on the same quest, or a durable map to inherit. Step 3 says "Dispatch explorer sub-agents where the code is too large to read yourself" with no suggestion that the previous item wrote a map at `.quest-plans/<its operationItemId>-map.md` on the same branch. Item [13]'s map was sitting on disk the whole time and item [14] never read it (`.quest-plans/` appears in item [14]'s Read set only as its own `Write` target).

---

## 6. Suggested fixes

Ranked by estimated saving per flowrider item.

### Fix 1 — Overlap the below-browser group with the browser walks (≈35–45 min/item)

**File**: `packages/orchestrator/src/statics/flowrider-prompt/flowrider-prompt-statics.ts`, step 4's grouping rule and step 5's dispatch rule.

Today the rule reads "never two browser walks against the same package at once", and the session correctly infers from it that *nothing* runs beside a browser walk. But the constraint is only about **Playwright's report path** — a Jest integration agent, a shared-statics agent, or a red-first rework on a *non-e2e* file collides with nothing. In this item, `a2783f34a8cd98f13` (31.0 min of pure server-integration Jest work) ran entirely alone in P3, and `a18736f1239617752` (7.3 min) ran alone in P4 apart from an overlapping browser walk that had not yet reached its first Playwright call.

Concrete edit — replace step 4's grouping paragraph with:

```
**Grouping is by file, with one extra rule: never two BROWSER WALKS against the same package at once.**
Playwright writes one report path per package. That constraint binds browser walks ONLY. A
below-browser group — integration tests, unit tests, a statics test — collides with nothing and
SHOULD go out alongside the first browser walk rather than ahead of it. Your longest waits are
browser walks; fill them.
```

**Estimate**: P3 (33.0 min) and P4 (8.5 min) would have collapsed into P5's 49-minute window. **About 35 min saved on this item.**

### Fix 2 — Make the `PROVE` line's check types match the file kinds (≈4–8 min/item, plus removes a prompt self-contradiction)

**File**: same file, the brief template's `PROVE` block.

The hardcoded `--only lint,test` guarantees `DISCOVERY MISMATCH` for a browser-walk brief, and the flowrider's workaround (`--only lint,typecheck,e2e`) breaks the typecheck rule in the same stroke. Replace:

```
PROVE
  npm run ward -- --only lint,test -- <this brief's own paths>
```

with:

```
PROVE
  A browser brief:      npm run ward -- --only lint,e2e -- <this brief's own paths>
  A below-browser brief: npm run ward -- --only lint,unit,integration -- <this brief's own paths>
  Pick the ONE line matching this brief's file kind. NEVER add typecheck — it runs `tsc -b`,
  which writes the shared dist/. Your parent's reviewer's --staged run is the typecheck, and a
  type error your brief leaves behind is a rework, not a failure.
  DISCOVERY MISMATCH on a check type = ward answering, not failing. --passWithNoTests is never the fix.
  no npm run build · no run-ward MCP tool · no commit · never widen the ward
```

**Estimate**: removes `abda90e772a79327a`'s double ward run (roughly 1 min), removes the 7 whole-repo typechecks (roughly 4–6 min), and removes the flowrider's incentive to author a brief that contradicts its own prompt.

### Fix 3 — Refuse a `PROVED` line with no witnessed red (≈15–20 min/item)

**File**: same file, the brief template's `RETURN` block.

Finding 6 cost 16.7 minutes of serialized rework across two agents. The `PROVED` shape already asks for the red; nothing rejects its absence. Add one line to the `RETURN` block:

```
RETURN
  PROVED:
    <unit-id> — <file:line> · <the assertion, quoted> · <the wrong value that turns it
     red> · <the red I witnessed, QUOTED — the actual failing output, not "verified">
  A unit whose red you did not witness goes under NOT PROVED with "no red witnessed", NEVER
  under PROVED. Your parent transcribes PROVED lines into a quest sign-off without opening
  the test, so a PROVED line with an unquoted red puts a verdict on record that nothing backs.
```

And in step 5, after "Sign only what came back under `PROVED`":

```
**A `PROVED` line whose red is not QUOTED is a `NOT PROVED` line.** Read the red field, not the
verdict word. Send those units straight back out in the same message as the next group — they
are the cheapest rework there is, and batching them costs you nothing.
```

**Estimate**: `a18736f1239617752` (7.3 min) and `a607a08d9cdd05297` (9.4 min) both become unnecessary or fold into the next group's window. **About 16 min saved on this item.**

### Fix 4 — Hand the next flowrider the previous flowrider's map (≈30 min/item on every item after the first)

**Files**: `packages/orchestrator/src/statics/flowrider-prompt/flowrider-prompt-statics.ts` step 3, and the map path convention in step 4.

Item [14] re-derived a topology item [13] had already mapped, at a measured cost of 30–37 min and roughly 475k tokens (§5 finding 9). Item [13]'s map was on the branch at `.quest-plans/<its operationItemId>-map.md` and nothing pointed item [14] at it. Add to step 3, before "Dispatch explorer sub-agents":

```
**A sibling flowrider may already have mapped this code.** Every flowrider on this quest writes a
map to `.quest-plans/<operationItemId>-map.md` on this branch. Before you dispatch a single
explorer, run `git log --name-only -n 30 --grep=flowrider` and read every `.quest-plans/*-map.md`
it names. Those files carry the MIRROR specs, the TRAPS and the harness inventory for the flows
that ran before you, over the same packages. Reading them costs you one Read each; re-deriving
what they hold costs you an explorer agent and ten minutes per sub-agent that has to rediscover
it. Cite what you took from a sibling map in your own map's MIRROR block.
```

**Estimate**: cuts P1 and the four large sub-agents' orientation tails. **About 25–30 min and about 300k tokens per item** on the 2nd and later flowrider items of a quest. This quest ran three flowrider items; the fix pays twice.

### Fix 5 — Cache the standards triple across a pass (≈285k tokens/item)

**Files**: the brief template's `FIRST` block in `flowrider-prompt-statics.ts` (and identically in `codeweaver-prompt-statics.ts` / `siegemaster-prompt-statics.ts`), or the MCP responders behind `get-architecture` / `get-syntax-rules` / `get-testing-patterns`.

12 sub-agents × 94,985 identical bytes is roughly 285k tokens per flowrider item, roughly 475k across the two adjacent items measured here. Two possible edits, in preference order:

1. **MCP-side**: add a `sections` argument to the three tools so a brief can request only what its file kind needs — a browser brief does not need the folder-type table, a below-browser brief does not need the Playwright traps. `get-testing-patterns` is the largest at 51,401 bytes and the most reducible.
2. **Prompt-side**: change the `FIRST` block from an unconditional three-call preamble to a conditional one, and have the flowrider paste the 10–15 rules that actually bind this brief into the brief's own `TRAPS` — which it is already doing for `git -C`, `&&` chaining and the blocked grep. Replace `FIRST\n  get-architecture, get-syntax-rules, get-testing-patterns` with:

```
FIRST
  get-syntax-rules only. The architecture and testing-pattern rules that bind THIS brief are
  pasted into TRAPS above; do not re-fetch them.
```

**Estimate**: option 2 removes roughly 70k bytes per sub-agent (`get-architecture` 19,056 + `get-testing-patterns` 51,401), **about 210k tokens per flowrider item**, at the cost of a longer TRAPS block the flowrider is already writing.

### Fix 6 — Fix `ward --staged` blindness to untracked files (≈2 min/item; correctness, not speed)

**File**: the ward `--staged` file-set resolution in `@dungeonmaster/ward` — the same place `--changed` computes its set. It must union `git ls-files --others --exclude-standard` into the diff-derived set, exactly as `gitWorkingTreeFilesBroker` already does for the commit-before-signal gate.

This is the flowrider's own recorded finding, quest note `ward-staged-blind-to-untracked-files`:

> `The --staged run scoped itself to packages/server alone and never saw a single web file, while still exiting 0 — so a reviewer trusting it would have signed off a suite that was never linted, typechecked or run.`

Until that lands, add a one-line hedge to `flowriderReviewerStatics` step 6, after the `npm run ward -- --staged` block:

```
**`--staged` is blind to untracked files.** It takes its set from a diff against origin, which
lists MODIFIED tracked files only — and most of what a flowrider pass produces is NEW files. Read
the ward run's own scope line. If it names fewer packages than `git status` showed you at step 3,
that run checked nothing you are here to grade: re-run it as `npm run ward -- -- <every path from
step 3>`. That second run is your second of two, so do not spend one before you have read the scope.
```

**Estimate**: 1.7 min per reviewer pass, and it closes a silent false-green that this item only escaped because one sonnet reviewer happened to read a scope line.

### Fix 7 — Tell sub-agents what they will see in `git status`, and what `wall` means (≈2 min/item; prevents a quest-halting misroute)

**File**: `flowrider-prompt-statics.ts`, the brief template's `TRAPS` and `RETURN` blocks.

Two one-line additions. To `TRAPS`:

```
  `git status` will already be dirty when you arrive. Earlier sub-agents on THIS pass wrote those
  files and nothing commits until the reviewer runs. They are not another session's work. Leave
  them alone and do not investigate them.
```

To `RETURN`, replacing the bare `wall — <what a person must change>`:

```
  NEXT: pass | rework — <what is left> | wall — <an ENVIRONMENT block: a denied command, a
   missing credential, an unreachable service. A product question, a UX judgement call or a spec
   that turned out to be untrue is `rework`, NEVER `wall` — a wall halts the whole quest.>
```

**Estimate**: roughly 2 min of misdiagnosis per item (finding 5), and it removes the exposure in finding 7 — a literal reading of the prompt would have blocked this quest at 200.7m with 8 units unwritten.

### Fix 8 — Restate the "no build, no raw playwright" ban where the sub-agent will actually see it (≈8–12 min/item)

**File**: `flowrider-prompt-statics.ts`, the brief template's `PROVE` block.

24 forbidden builds and 38 raw `npx playwright test` calls happened while the words `no npm run build` sat in the brief. The line is in a `·`-separated run of four items at the end of a block, which is where an instruction goes to be skimmed. Give each its own line and a reason:

```
PROVE
  <the one ward line for this brief's file kind, from Fix 2>
  DISCOVERY MISMATCH on a check type = ward answering, not failing. --passWithNoTests is never the fix.
  NO `npm run build`. Ward's typecheck already builds, and a build you run beside a sibling
    sub-agent hands it type errors on correct code. Your reviewer is the only session here that builds.
  NO `npx playwright`, `npx jest`, `npx tsc`, `npx eslint`. Ward is the only test runner on this
    pass — a raw runner skips lint entirely, so you find your lint state at the end instead of
    at each step. Never `cd` into a package; scope ward with paths after `--`.
  NO run-ward MCP tool — it grades the whole branch and lands the red on your parent's work item.
  NO commit. Never widen the ward.
```

**Estimate**: 8–12 min of build waits removed, and lint moves from the last three minutes of a 42-minute agent to every iteration.

---

## 7. Raw figures appendix

### `python3 tmp/transcript-digest.py summary 42edd7ea-612e-464e-b382-a5713d077d85`

```
FILE      /home/brutus-home/.claude/projects/-home-brutus-home-projects-codex-of-consentient-craft-worktrees-try-2-paste-images-into-web-chat-render-inline-s-1be07040/42edd7ea-612e-464e-b382-a5713d077d85.jsonl
LINES     492
START     2026-09-02T12:04:12.983000+00:00
END       2026-09-02T16:13:31.266000+00:00
WALL      4:09:18.283000  (249.3 min)
TYPES     {'queue-operation': 30, 'attachment': 129, 'user': 84, 'last-prompt': 42, 'atis-latch': 41, 'assistant': 166}
MODELS    {'claude-opus-5': 166}

TOKENS (this transcript only, excludes subagents)
  assistant API responses : 166
  input (uncached)        : 332
  cache_read              : 57,116,500
  cache_creation          : 1,286,966
  output                  : 453,402
  of which thinking       : 140,796
  TOTAL context-in        : 58,403,798

TOOL CALLS (71 total)
     14  Agent
     13  Read
     13  mcp__dungeonmaster__modify-quest
     10  mcp__dungeonmaster__discover
     10  Bash
      2  ToolSearch
      2  mcp__dungeonmaster__get-qa-checklist
      1  mcp__dungeonmaster__get-agent-prompt
      1  mcp__dungeonmaster__get-quest
      1  mcp__dungeonmaster__get-architecture
      1  mcp__dungeonmaster__get-testing-patterns
      1  mcp__dungeonmaster__get-syntax-rules
      1  Write
      1  mcp__dungeonmaster__signal-back

TOOL RESULT BYTES fed back: 763,066

SUBAGENTS 18  (run `subagents` subcommand for the roster)
```

### `python3 tmp/transcript-digest.py subagents 42edd7ea-612e-464e-b382-a5713d077d85`

```
09-02 12:05:26  +   3.8m  agent-a1333d035fab064a0  Explore/sonnet  turns= 79 out=20,615 ctx-in=5,898,090
           desc: Map server-side image send path
           tools: {'ToolSearch': 1, 'Read': 31, 'mcp__dungeonmaster__discover': 26}
09-02 12:05:38  +   2.9m  agent-af17f22a0d15817a1  Explore/sonnet  turns= 59 out=17,901 ctx-in=7,831,650
           desc: Map orchestrator prompt+spawn path
           tools: {'ToolSearch': 1, 'Read': 20, 'mcp__dungeonmaster__discover': 22}
09-02 12:14:57  +  31.0m  agent-a2783f34a8cd98f13  general-purpose/sonnet  turns=222 out=151,865 ctx-in=74,438,087
           desc: Server integration tests for image persist
           tools: {'ToolSearch': 1, 'mcp__dungeonmaster__get-architecture': 1, 'mcp__dungeonmaster__get-syntax-rules': 1, 'mcp__dungeonmaster__get-testing-patterns': 1, 'Read': 39, 'mcp__dungeonmaster__discover': 27, 'Edit': 31, 'Bash': 30}
09-02 12:15:15  +   1.3m  agent-a1792ff3b57982e69  general-purpose/sonnet  turns= 22 out=6,490 ctx-in=1,326,381
           desc: Shared locations statics imagesDir test
           tools: {'ToolSearch': 1, 'Read': 2, 'mcp__dungeonmaster__get-architecture': 1, 'mcp__dungeonmaster__get-syntax-rules': 1, 'mcp__dungeonmaster__get-testing-patterns': 1, 'Edit': 2, 'Bash': 5}
09-02 12:47:55  +   7.3m  agent-a18736f1239617752  general-purpose/sonnet  turns= 61 out=27,308 ctx-in=6,779,114
           desc: Red-first cycle for two server units
           tools: {'ToolSearch': 2, 'mcp__dungeonmaster__get-architecture': 1, 'mcp__dungeonmaster__get-syntax-rules': 1, 'mcp__dungeonmaster__get-testing-patterns': 1, 'Read': 5, 'mcp__dungeonmaster__discover': 3, 'Edit': 5, 'Bash': 16, 'Write': 1}
09-02 12:49:32  +  42.4m  agent-abda90e772a79327a  general-purpose/sonnet  turns=264 out=198,735 ctx-in=98,861,350
           desc: Browser walk: chat-route image send
           tools: {'ToolSearch': 1, 'mcp__dungeonmaster__get-architecture': 1, 'mcp__dungeonmaster__get-syntax-rules': 1, 'mcp__dungeonmaster__get-testing-patterns': 1, 'Read': 39, 'mcp__dungeonmaster__discover': 29, 'Bash': 52, 'Write': 4, 'Edit': 32}
09-02 13:34:08  +   9.4m  agent-a607a08d9cdd05297  general-purpose/sonnet  turns= 81 out=32,351 ctx-in=12,278,030
           desc: Red-first rework on chat-route e2e
           tools: {'ToolSearch': 1, 'Read': 3, 'mcp__dungeonmaster__get-architecture': 1, 'mcp__dungeonmaster__get-syntax-rules': 1, 'mcp__dungeonmaster__get-testing-patterns': 1, 'mcp__dungeonmaster__discover': 1, 'Edit': 15, 'Bash': 24}
09-02 13:45:48  +  32.9m  agent-af05d16a34f6c746b  general-purpose/sonnet  turns=107 out=143,128 ctx-in=33,057,446
           desc: Browser walk: images reach the agent
           tools: {'ToolSearch': 1, 'mcp__dungeonmaster__get-architecture': 1, 'mcp__dungeonmaster__get-syntax-rules': 1, 'mcp__dungeonmaster__get-testing-patterns': 1, 'Read': 10, 'Agent': 4, 'Edit': 14, 'mcp__dungeonmaster__discover': 1, 'Write': 2, 'Bash': 23}
09-02 13:46:21  +   1.1m  agent-a2cc341278a378d59  Explore/None  turns= 18 out=7,669 ctx-in=673,271
           desc: Locate pastedImageStatics and claude-mock harness details
           tools: {'ToolSearch': 1, 'mcp__dungeonmaster__discover': 4, 'Bash': 3, 'Read': 4}
09-02 13:48:27  +   2.4m  agent-ab1afb224c2fc8050  Explore/None  turns= 56 out=14,023 ctx-in=5,753,981
           desc: Trace chat message pipeline from POST to spawn prompt
           tools: {'ToolSearch': 1, 'mcp__dungeonmaster__get-project-map': 1, 'mcp__dungeonmaster__discover': 20, 'Read': 15, 'Bash': 3}
09-02 13:53:01  +   0.7m  agent-a1b14c861aab14dbb  Explore/None  turns= 21 out=3,917 ctx-in=676,571
           desc: Check tsconfig strict flags for noUncheckedIndexedAccess
           tools: {'ToolSearch': 1, 'mcp__dungeonmaster__discover': 4, 'Bash': 2, 'Read': 7}
09-02 13:56:23  +   2.3m  agent-a21bc837ad5c17e42  Explore/None  turns= 39 out=13,227 ctx-in=2,843,651
           desc: Find existing follow-up chat e2e spec sending a message
           tools: {'ToolSearch': 1, 'mcp__dungeonmaster__discover': 13, 'Bash': 2, 'Read': 10}
09-02 14:21:22  +  43.0m  agent-ab46a7b4fc19d41dc  general-purpose/sonnet  turns=253 out=198,543 ctx-in=91,102,964
           desc: Browser walk: rejected send
           tools: {'Bash': 34, 'ToolSearch': 2, 'mcp__dungeonmaster__get-architecture': 1, 'mcp__dungeonmaster__get-syntax-rules': 1, 'mcp__dungeonmaster__get-testing-patterns': 1, 'Read': 41, 'mcp__dungeonmaster__discover': 25, 'Edit': 40, 'Write': 2}
09-02 15:06:11  +  17.9m  agent-a20e184886cb97c2e  general-purpose/sonnet  turns=114 out=100,029 ctx-in=26,140,623
           desc: Browser walk: newline and text-only
           tools: {'ToolSearch': 2, 'mcp__dungeonmaster__get-architecture': 1, 'mcp__dungeonmaster__get-syntax-rules': 1, 'mcp__dungeonmaster__get-testing-patterns': 1, 'Read': 17, 'mcp__dungeonmaster__discover': 9, 'Write': 1, 'Bash': 22, 'Edit': 14}
09-02 15:26:33  +  23.7m  agent-a993e2dc8516d885d  general-purpose/sonnet  turns=151 out=95,733 ctx-in=38,387,534
           desc: Newline rework plus create-surface walk
           tools: {'ToolSearch': 1, 'mcp__dungeonmaster__get-architecture': 1, 'mcp__dungeonmaster__get-syntax-rules': 1, 'mcp__dungeonmaster__get-testing-patterns': 1, 'Read': 22, 'mcp__dungeonmaster__discover': 13, 'Edit': 14, 'Bash': 35, 'Write': 1}
09-02 15:51:54  +   3.4m  agent-af8b4694f9e631e56  general-purpose/sonnet  turns= 35 out=14,542 ctx-in=4,456,039
           desc: Follow-up POST body shape
           tools: {'ToolSearch': 1, 'mcp__dungeonmaster__get-architecture': 1, 'mcp__dungeonmaster__get-syntax-rules': 1, 'mcp__dungeonmaster__get-testing-patterns': 1, 'Read': 8, 'Edit': 3, 'Bash': 4}
09-02 15:56:00  +   5.0m  agent-a940d4ee18099c9df  general-purpose/sonnet  turns= 57 out=18,008 ctx-in=6,178,441
           desc: Tighten create-surface body assertion
           tools: {'ToolSearch': 1, 'mcp__dungeonmaster__get-architecture': 1, 'mcp__dungeonmaster__get-syntax-rules': 1, 'mcp__dungeonmaster__get-testing-patterns': 1, 'Read': 5, 'mcp__dungeonmaster__discover': 2, 'Edit': 9, 'Bash': 12}
09-02 16:01:40  +  11.0m  agent-a24cdcac64cb4c836  general-purpose/sonnet  turns= 61 out=48,633 ctx-in=10,609,784
           desc: Flowrider reviewer
           tools: {'ToolSearch': 4, 'mcp__dungeonmaster__get-agent-prompt': 1, 'mcp__dungeonmaster__get-architecture': 1, 'mcp__dungeonmaster__get-syntax-rules': 1, 'mcp__dungeonmaster__get-testing-patterns': 1, 'mcp__dungeonmaster__get-qa-checklist': 1, 'mcp__dungeonmaster__get-quest': 1, 'Bash': 16, 'Read': 7, 'mcp__dungeonmaster__get-quest-summary': 1, 'mcp__dungeonmaster__discover': 4}

SUBAGENT TOTALS  agents=18 turns=1700 output=1,112,717 context-in=427,293,007
```

### Main-session gap census (script over the raw jsonl; every gap ≥60s between consecutive assistant records)

```
     3.9m ->    4.9m        61s =   1.0m
     5.4m ->    7.2m       110s =   1.8m
     7.4m ->    9.6m       133s =   2.2m
    11.3m ->   12.6m        78s =   1.3m
    12.7m ->   42.4m      1785s =  29.7m
    43.7m ->   45.3m        97s =   1.6m
    45.4m ->   51.1m       342s =   5.7m
    51.3m ->   88.6m      2238s =  37.3m
    90.0m ->   99.9m       589s =   9.8m
   100.3m ->  101.6m        79s =   1.3m
   101.6m ->  135.0m      1999s =  33.3m
   135.9m ->  137.2m        77s =   1.3m
   137.2m ->  180.5m      2600s =  43.3m
   182.0m ->  200.7m      1118s =  18.6m
   201.3m ->  202.3m        62s =   1.0m
   202.4m ->  226.3m      1434s =  23.9m
   228.7m ->  231.1m       147s =   2.4m
   231.8m ->  237.0m       308s =   5.1m
   237.5m ->  248.7m       673s =  11.2m
TOTAL in gaps>=60s: 13929s = 232.2 min of 249.3
TOTAL span covered by assistant-to-assistant gaps: 249.2 min
Active (gaps<60s) time: 17.1 min
```

### Orientation result bytes per sub-agent (script over the raw jsonl)

```
agent-a1792ff3b57982e69  94,985 bytes  [('get-architecture', 19056), ('get-syntax-rules', 24528), ('get-testing-patterns', 51401)]
agent-a18736f1239617752  94,985 bytes  [identical triple]
agent-a20e184886cb97c2e  94,985 bytes  [identical triple]
agent-a24cdcac64cb4c836  94,985 bytes  [identical triple]
agent-a2783f34a8cd98f13  94,985 bytes  [identical triple]
agent-a607a08d9cdd05297  94,985 bytes  [identical triple]
agent-a940d4ee18099c9df  94,985 bytes  [identical triple]
agent-a993e2dc8516d885d  94,985 bytes  [identical triple]
agent-ab46a7b4fc19d41dc  94,985 bytes  [identical triple]
agent-abda90e772a79327a  94,985 bytes  [identical triple]
agent-af05d16a34f6c746b  94,985 bytes  [identical triple]
agent-af8b4694f9e631e56  94,985 bytes  [identical triple]

GRAND TOTAL sub-agent orientation result bytes: 1,139,820  (~284,955 tokens at 4 chars/token)
MAIN SESSION orientation result sizes: {'get-architecture': 19056, 'get-testing-patterns': 51401, 'get-syntax-rules': 24528}
```

### Minutes to first Edit, and ctx-in at that point

```
agent-a1792ff3b57982e69  firstEdit=0.44m  ctx@=74,225
agent-a18736f1239617752  firstEdit=0.54m  ctx@=108,568
agent-a940d4ee18099c9df  firstEdit=0.88m  ctx@=97,242
agent-af8b4694f9e631e56  firstEdit=1.74m  ctx@=165,508
agent-a607a08d9cdd05297  firstEdit=2.76m  ctx@=120,717
agent-a993e2dc8516d885d  firstEdit=4.77m  ctx@=187,017
agent-a20e184886cb97c2e  firstEdit=5.07m  ctx@=203,885
agent-af05d16a34f6c746b  firstEdit=5.23m  ctx@=210,527
agent-abda90e772a79327a  firstEdit=9.67m  ctx@=298,020
agent-ab46a7b4fc19d41dc  firstEdit=10.35m ctx@=214,748
agent-a2783f34a8cd98f13  firstEdit=10.59m ctx@=310,474
agent-a24cdcac64cb4c836  firstEdit=none   (reviewer made no edits)
```

### Test/build command census, and symptom search

```
agent                  build  npxPW  wardRun  wardDet   symptoms
a1792ff3b57982e69          2      0        2        0   {'econnrefused': 1}
a18736f1239617752          2      0        3        2   {'econnrefused': 1}
a1b14c861aab14dbb          0      0        0        0   {'unexpected_end_json': 1, 'econnrefused': 1}
a20e184886cb97c2e          0     12        1        1   {'unexpected_end_json': 1, 'econnrefused': 2, 'net_err': 1, 'waitForResponse': 21}
a21bc837ad5c17e42          0      0        0        0   {'econnrefused': 1, 'waitForResponse': 6}
a24cdcac64cb4c836          1      0        6        2   {'econnrefused': 1, 'waitForResponse': 27}
a2783f34a8cd98f13          4      0       14        4   {'econnrefused': 2}
a2cc341278a378d59          0      0        0        0   {'econnrefused': 1}
a607a08d9cdd05297          1      0        8        6   {'econnrefused': 1, 'waitForResponse': 7}
a940d4ee18099c9df          2      0        4        2   {'econnrefused': 1, 'waitForResponse': 1}
a993e2dc8516d885d          8      0        8        4   {'econnrefused': 1, 'waitForResponse': 24}
ab46a7b4fc19d41dc          4      0       12        7   {'econnrefused': 1, 'waitForResponse': 48, 'test_timeout': 2}
abda90e772a79327a          0     26        2        0   {'unexpected_end_json': 1, 'econnrefused': 3, 'waitForResponse': 34}
af05d16a34f6c746b          1      0        8        6   {'econnrefused': 1, 'waitForResponse': 34}
af17f22a0d15817a1          0      0        0        0   {'econnrefused': 1}
af8b4694f9e631e56          0      0        2        1   {'econnrefused': 1, 'waitForResponse': 20}
TOTAL                     25     38       70       35   {'econnrefused': 20, 'unexpected_end_json': 3, 'net_err': 1, 'waitForResponse': 222, 'test_timeout': 2}
```

Symptom contexts, checked individually: all 3 `Unexpected end of JSON input` and 18 of 20 `ECONNREFUSED` hits are the strings inside `packages/web/playwright.config.ts`'s own `webServer` comment or inside `get-testing-patterns`' `toStrictEqual` example, read by the agent — not failures. `waitForResponse` is the Playwright API the specs call. **One** real timeout, in `ab46a7b4fc19d41dc`: `Error: locator.waitFor: Test timeout of 10000ms exceeded. Call log: - waiting for getByTestId('CHAT_INPUT') to be visible`.

### Time spent inside test/build commands (issue-to-result deltas on matching Bash calls)

```
agent                   wall(m)  runs  in-runs(m)      %
a1792ff3b57982e69           1.3     4         0.3  22.7%
a18736f1239617752           7.3     5         1.2  16.4%
a20e184886cb97c2e          17.9    13         2.0  11.3%
a24cdcac64cb4c836          11.0     4         1.8  15.9%
a2783f34a8cd98f13          31.0    18         3.5  11.2%
a607a08d9cdd05297           9.4     9         2.3  24.2%
a940d4ee18099c9df           5.0     6         1.2  23.0%
a993e2dc8516d885d          23.7    16         5.7  24.1%
ab46a7b4fc19d41dc          43.0    16         3.9   9.1%
abda90e772a79327a          42.4    28         5.2  12.3%
af05d16a34f6c746b          32.9     9         2.1   6.4%
af8b4694f9e631e56           3.4     2         0.7  20.4%
TOTAL                     228.5              29.8  13.1%
```

### Cross-agent read duplication, within item [14]

```
TOTAL Read calls across 18 subagents: 285
files read by >=3 distinct agents: 29
  agents=8 reads=12  packages/web/test/harnesses/composer-send/composer-send.harness.ts
  agents=7 reads=13  packages/web/src/flows/quest-chat/send-images-chat-route.e2e.ts
  agents=7 reads=7   packages/web/test/harnesses/claude-mock/claude-mock.harness.ts
  agents=6 reads=7   packages/server/src/brokers/pasted-image/persist/pasted-image-persist-broker.ts
  agents=6 reads=6   packages/web/test/harnesses/composer-paste/composer-paste.harness.ts
  agents=6 reads=6   packages/server/src/responders/quest/chat/quest-chat-responder.ts
  agents=5 reads=13  packages/web/src/widgets/chat-input/chat-input-widget.tsx
  agents=5 reads=5   packages/web/test/harnesses/claude-mock/bin/claude
  agents=5 reads=5   packages/shared/src/statics/pasted-image/pasted-image-statics.ts
  agents=4 reads=14  packages/web/src/flows/quest-chat/send-images-reach-the-agent.e2e.ts
  agents=4 reads=11  packages/server/src/flows/quest/quest-flow.integration.test.ts
  agents=4 reads=5   packages/server/src/transformers/pasted-image-token-substitute/pasted-image-token-substitute-transformer.ts
  agents=4 reads=4   packages/web/test/harnesses/quest/quest.harness.ts
  agents=4 reads=4   packages/web/test/harnesses/followup/followup.harness.ts
  agents=4 reads=4   packages/server/src/adapters/fs/mkdir/fs-mkdir-adapter.ts
  agents=3 reads=5   packages/server/test/harnesses/server-app/server-app.harness.ts
  agents=3 reads=4   packages/web/src/flows/quest-chat/send-text-only-and-newline.e2e.ts
  agents=3 reads=4   packages/web/src/flows/quest-chat/send-images-create-surface.e2e.ts
  agents=3 reads=4   packages/server/src/responders/quest/followup/quest-followup-responder.ts
  agents=3 reads=3   packages/web/test/harnesses/environment/environment.harness.ts
  agents=3 reads=3   packages/web/src/flows/quest-chat/send-images-rejection.e2e.ts
  agents=3 reads=3   packages/web/src/brokers/quest/chat/quest-chat-broker.ts
  agents=3 reads=3   packages/web/playwright.config.ts
  agents=3 reads=3   packages/shared/src/statics/locations/locations-statics.ts
  agents=3 reads=3   packages/server/src/responders/quest/new/quest-new-responder.ts
```

### Cross-ITEM read duplication, item [13] `5c841160-…` vs item [14] `42edd7ea-…`

```
FLOWRIDER-14 distinct files read: 120  total reads 298
FLOWRIDER-13 distinct files read: 64   total reads 168
OVERLAP distinct files: 30  (25.0% of item-14's file set)
  reads item-14 spent on files item-13 had already read: 93 of 298
  top overlapping files (item-14 reads / item-13 reads):
     14 /   6  packages/web/src/widgets/chat-input/chat-input-widget.tsx
      7 /   2  packages/server/src/brokers/pasted-image/persist/pasted-image-persist-broker.ts
      7 /  16  packages/web/test/harnesses/composer-paste/composer-paste.harness.ts
      7 /   1  packages/web/test/harnesses/claude-mock/claude-mock.harness.ts
      6 /   1  packages/server/src/responders/quest/chat/quest-chat-responder.ts
      5 /   5  packages/shared/src/statics/pasted-image/pasted-image-statics.ts
      5 /   3  packages/web/test/harnesses/quest/quest.harness.ts
      4 /   1  packages/web/src/widgets/quest-chat/quest-chat-content-layer-widget.tsx
      3 /   2  packages/web/test/harnesses/environment/environment.harness.ts
      3 /   5  packages/web/playwright.config.ts
      3 /   2  packages/web/src/brokers/quest/chat/quest-chat-broker.ts
      3 /   4  packages/web/src/transformers/composer-serialize/composer-serialize-transformer.ts
      2 /   4  packages/web/test/harnesses/guild/guild.harness.ts
      2 /   1  packages/shared/src/contracts/pasted-image-upload/pasted-image-upload-contract.ts
      2 /   1  packages/web/src/flows/quest-chat/chat-stop-first-message.e2e.ts
      2 /   1  packages/web/test/harnesses/chat-control/chat-control.harness.ts
      2 /   4  packages/web/src/flows/quest-chat/composer-paste-draft-reload.e2e.ts
      2 /   1  packages/web/test/harnesses/navigation/navigation.harness.ts
      2 /   7  packages/web/src/flows/quest-chat/composer-paste-refusals.e2e.ts
      2 /   6  packages/web/src/statics/chat-composer/chat-composer-statics.ts
      1 /   4  packages/web/test/harnesses/e2e-fixtures.ts
      1 /   4  packages/web/src/adapters/dom/composer-insert-text/dom-composer-insert-text-adapter.ts
```

### `python3 tmp/transcript-digest.py summary 5c841160-080c-4eea-adf6-e7736b92121e` (item [13], for the comparison)

```
LINES     349
START     2026-09-02T09:00:11.336000+00:00
END       2026-09-02T12:04:11.626000+00:00
WALL      3:04:00.290000  (184.0 min)
MODELS    {'claude-opus-5': 112}
  assistant API responses : 112
  input (uncached)        : 224
  cache_read              : 29,016,058
  cache_creation          : 800,655
  output                  : 347,646
  of which thinking       : 127,936
  TOTAL context-in        : 29,816,937
TOOL RESULT BYTES fed back: 471,203
SUBAGENTS 8
SUBAGENT TOTALS  agents=8 turns=992 output=758,467 context-in=227,473,437
```

### Rendered-prompt fitness check

```
rendered flowrider prompt: 36,212 chars  (ceiling: mcpToolResultStatics.maxVerbatimChars = 50,000 — no spill)
"Work item context"  -> 0 occurrences
"packagesAffected"   -> 0
"packageNames"       -> 0
"wardMode"           -> 0
"Dev Server"         -> 0
"Base branch"        -> 0
"Failed ward result" -> 0
```

### Deliverable

Commit `f2aaeabab` — 8 files, 60 real test cases: 32 server integration cases against a real temp `DUNGEONMASTER_HOME` with real file writes, and 28 Playwright cases driving a real browser, a real server and the fake Claude CLI. Reviewer's ward: `lint PASS 8/8, typecheck PASS 7416/7416, integration PASS 32/32, e2e PASS 28/28`. 59 units settled: **55 `confirmed`, 4 `unconfirmable`**, plus two new defect observables added to the spec and one `tooling-error` quest note.
