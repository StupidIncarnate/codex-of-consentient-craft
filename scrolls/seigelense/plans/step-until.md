# Plan — the `until` step verb

**Part 7 item 9.** Written before any code, against `siegelense-tooling.md` at commit `a47e6f4b1`. Every
line number below was re-derived from the file in this checkout, not copied from the ledger.

## Why this piece, and why it beat the others

The picking rule in `HANDOFF.md` runs in order, and this is where it lands.

**Rule 1 — does a built thing lie or half-work?** One candidate turned up while reading, and it is not a
lie so much as a boundary nobody wrote down. `waitFor` is a member of `stepStatics.verbs.targeting`, so
`runVerbLayerBroker` sends it through `stepTargetResolveBroker` BEFORE the wait
(`packages/siegelense/src/brokers/step/dispatch/run-verb-layer-broker.ts:79-92`), and that broker throws
`StepNoMatchError` at a count of zero
(`packages/siegelense/src/brokers/step/target-resolve/step-target-resolve-broker.ts:81-82`). So
`waitFor` cannot wait for an element to APPEAR: an element that has not rendered yet is a no-match, and
the step fails instantly instead of waiting. That is the spec's own design — `waitFor` is a targeting
step and ambiguity throws (line 2581, line 1642) — and it is exactly why `until { visible }` exists
beside it in the spec's worked batches (lines 2806, 3049). **So rule 1 does not point somewhere else; it
points here.**

**Rule 2 — what blocks a session from verifying a browser feature end to end?** Time. `waitFor` watches a
locator that already exists and nothing else. An app that writes a file, answers a request, logs a line
or renders after a socket push has nothing to be waited on, so a walk either races or sleeps. Every
other verb inherits that flakiness.

**Rule 3 — what unblocks the most other rows?** The spec's own live-update shape is two `look` calls
either side of a `seed` with an `until` between them (line 2959). `look` and `seed` both shipped last
round. `until` is the missing middle of the one batch shape this tool was built for.

**Rule 4 — what would a consumer hit first?** Not this. Item 17 wins on rule 4 and loses on 2 and 3.

## 1. The requirements, one row per thing the spec says

| # | Requirement | Spec line |
|---|---|---|
| R1 | `until` — "wait on something other than a locator state" | 2691 |
| R2 | `{ step: 'until', response: { method: 'POST', path: '/api/quests' }, timeoutMs: 15000 }` | 2694 |
| R3 | `{ step: 'until', file: 'guilds/<id>/quests/<id>/quest.json', timeoutMs: 10000 }` | 2695 |
| R4 | `{ step: 'until', predicate: 'document.querySelectorAll("[data-testid=QUEST_ROW]").length === 3' }` | 2696 |
| R5 | `{ step: 'until', console: /hydrated/ }` | 2697 |
| R6 | `{ step: 'until', visible: '[data-testid="SUBAGENT_CHAIN"]', timeoutMs: 20000 }` in the worked batch | 2806 |
| R7 | The live-update shape: `look`, `seed`, `until { predicate }`, `look` | 2954, 2959 |
| R8 | `until` carries a `node` label, echoed onto its reading | 3045-3049 |
| R9 | A hung `until` returns `status: 'timeout'` with `stoppedAt: { step, verb: 'until', error: 'visible … never resolved in 20000ms' }` — a FINDING, not a tool failure | 3089-3101 |
| R10 | "A timeout must name the step" | 137 |
| R11 | Part 7 item 9 — "wait on a response, a file or a predicate, not just a locator state" | 2090 |
| R12 | `docs { for: 'walking' }` serves `goto/click/look/until` | 2401 |
| R13 | `docs { for: 'operational' }` serves `until{file}` as part of a flow with NO SCREEN | 2408 |

**R13 is the constraint that shapes the whole verb.** `until { file }` must run on a browserless lane, so
`until` is not a member of `stepStatics.verbs.browser`. The browser narrowing happens per FORM, inside
the verb's own broker, the way `seed` already sits outside that list.

## 2. Two knowing departures from the spec's literal text

Both are recorded here because a later reader will otherwise read them as bugs.

**`console` takes a regex SOURCE STRING, not a regex literal.** The spec writes `console: /hydrated/`
(line 2697). A batch reaches the tool as JSON — `--steps <json>` or `--steps-file <path>` — and JSON
carries no regex literal. So the field is a string holding the pattern: `{ "step": "until", "console":
"hydrated" }`, compiled with `new RegExp(source, 'u')` and matched against each console line's own `text`
field. A caller who types `/hydrated/` gets a pattern that also requires literal slashes, so the contract
refuses a value wrapped in slashes BY NAME and shows the unwrapped form.

**`file` is HOME-RELATIVE and an absolute path is refused.** The spec's example
`guilds/<id>/quests/<id>/quest.json` (line 2695) is a path under the lane's throwaway home — that is
where the app writes when `DUNGEONMASTER_HOME` points at it. The path joins onto `lane.homePath`. A
value starting with `/` is refused, naming the home it would have been resolved against, rather than
silently waiting on a file outside the lane the walk is driving.

## 3. What gets built

### 3.A The contract

`contracts/step/step-contract.ts` gains an `until` member, `.strict()`:

```
step: z.literal('until')
visible:   selectorContract.nullable().default(null)
response:  untilResponseContract.nullable().default(null)     // { method, path }
file:      untilFilePathContract.nullable().default(null)
predicate: contentTextContract.nullable().default(null)
console:   untilConsolePatternContract.nullable().default(null)
timeoutMs: timeoutMsContract.nullable().default(null)
node:      nodeLabelContract.nullable().default(null)         // R8
expect:    stepExpectationContract.default(stepStatics.defaults.expect)
```

**Exactly one of the five condition fields, never zero and never two.** Enforced on the union's existing
`.superRefine`, next to the `target`/`ref` handle rule, which already has to live there because
`z.discriminatedUnion` takes only `ZodObject`s. The message lists all five forms with a worked example of
each — the same shape `HANDLE_MESSAGE` already uses.

Two new contracts under `contracts/`:

- `until-response/until-response-contract.ts` — `{ method, path }`, `.strict()`. `method` is the HTTP
  method to match, upper-cased; `path` is matched as a SUBSTRING of the recorded `url`, which is what
  `results { kind: 'network', where: { path } }` already does.
- `until-file-path/until-file-path-contract.ts` — the home-relative path, refusing a leading `/`.

`console`'s pattern can be a branded contract in its own folder or `contentTextContract` with a refine;
the agent picks, but the slash-wrapped refusal is required either way.

### 3.B The error

`errors/until-ceiling-hit/until-ceiling-hit-error.ts`. The message is the spec's own wording at line
3097, generalised over the five forms:

```
visible [data-testid="SUBAGENT_CHAIN"] never resolved in 20000ms
```

**On the two buffer forms it must say more, and this is the deliberate scoping the handoff asked for.**
`console` and `response` scan the browser's continuous buffer from the length it had when the step
STARTED, so a line that arrived during the previous step is not matched. If the ceiling is hit and a
match exists EARLIER in that buffer, the error says so and names how many lines back:

```
UNTIL TIMEOUT: response POST /api/quests never resolved in 15000ms — 0 of 12 network lines
since this step began matched. A match DID arrive earlier in this instance's buffer, 3 lines
before this step started: put the `until` before the step that triggers it, or read it back
with `results --kind network`.
```

Without that sentence a walker reads a bare timeout and re-runs the batch unchanged. With it, the one
mistake this form invites names itself.

### 3.C The verb broker

`brokers/step/until/step-until-broker.ts`, plus `.proxy.ts` and `.test.ts`. Takes the whole `LaneSession`
(like `stepSeedBroker`), routes on which condition field is non-null, and owns the ceiling:
`timeoutMs ?? driverStatics.run.defaultStepTimeoutMs`.

| Form | How it waits | Needs a browser |
|---|---|---|
| `visible` | `session.waitForMatch({ target, state: 'visible', timeoutMs })` — Playwright's own wait, which is what makes it wait for APPEARANCE where `waitFor` cannot. **It does NOT go through `stepTargetResolveBroker`**; pre-resolving is the whole reason `waitFor` cannot do this job | yes |
| `predicate` | a new `session.waitForPredicate({ source, timeoutMs })` over `page.waitForFunction` | yes |
| `console` | poll `session.readConsoleSince({ fromIndex })`, `JSON.parse` each line, test the pattern against `text` | yes |
| `response` | poll `session.readNetworkSince({ fromIndex })`, `JSON.parse` each line, match `method` exactly and `path` as a substring of `url` | yes |
| `file` | poll `fs.stat` on `lane.homePath` joined with the relative path | **no** |

Every form throws `UntilCeilingHitError` on the ceiling and nothing else. A real error underneath — a
predicate that throws, a malformed buffer line — propagates unchanged; only a CEILING is a timeout.

The two poll loops go in layer brokers beside it, not nested functions:
`until-buffer-match-layer-broker.ts` and `until-file-wait-layer-broker.ts`. **Recursion, not
`while (true)`** — the repo bans the loop form.

`driverStatics.run` gains `untilPollMs: 100`. Justification for the header: a buffer read is an
in-process array slice and a file probe is one `stat`, so the cost of the interval is nothing; 100ms is
well under the smallest interval a walk can meaningfully observe.

### 3.D The browserless refusal

On a lane with `browser === null`, the four browser forms refuse BY NAME **and name `file` as the form
that does work there** — R13 exists precisely because an operational flow has no screen. Either extend
`BrowserStepUnsupportedError` with an optional form, or add a new error; the agent picks. The message
must name the spec, the form the caller wrote, and the `file` form.

### 3.E The reading

One `ContentText` per form, each naming how long it actually waited:

```
[data-testid="SUBAGENT_CHAIN"] became visible after 1430ms
POST /api/quests answered 201 after 220ms
guilds/g1/quests/q1/quest.json appeared after 90ms
predicate became true after 310ms
console line matching /hydrated/ arrived after 55ms — "app hydrated in 240ms"
```

`after 0ms` is the honest answer for a condition that was already true, and a reader can tell it from a
real wait without another query.

### 3.F The wiring

| File | Change |
|---|---|
| `statics/step/step-statics.ts` | `'until'` joins `verbs.all` and NOTHING else — not `acting`, not `capturing`, not `targeting`, not `browser`. The comment says why `browser` excludes it: the `file` form runs on a headless lane |
| `brokers/step/dispatch/run-verb-layer-broker.ts` | route `until` in the SAME place `seed` is routed — before `const { browser: session } = lane` narrows, since `until { file }` needs no page |
| `brokers/run/execute/run-execute-step-layer-broker.ts` | `timedOut` currently reads `underlyingError instanceof WaitForCeilingHitError` (line 194). It must be true for `UntilCeilingHitError` too, or R9 fails and a hung `until` reports `status: 'failed'` |
| `adapters/playwright/session/playwright-session-adapter.ts` + `browser-session-contract.ts` + the adapter proxy | add `waitForPredicate({ source, timeoutMs })` |
| `statics/docs/docs-statics.ts` | see 3.G |

### 3.G The docs, which are part of the feature and not paperwork

Finding 13 in the handoff's log is a docs page that told an operator a built call was unbuilt. Four edits:

1. Line 158 and line 459 both read "Eight step verbs exist: goto, waitFor, click, type, screenshot, eval,
   look and seed." Nine now, with `until`.
2. Lines 496-497, in the `operational` scope, carry `${NOT_BUILT}` on the `file` and `response` forms.
   Drop the marker. **`operational` must teach `until { file }` as R13 describes it** — the form for a
   flow with no screen.
3. The `walking` scope (lines 165-269) must carry `until`, because R12 names it there and it does not
   appear in that scope today.
4. `until` is a new member of `verbs.all`, and `docs-statics.test.ts:28` asserts that the `operating`
   scope contains NO verb name as a lower-cased SUBSTRING. "until" is an ordinary English word. **Check
   lines 36-104 before and after the edit.** A read of the current file found no occurrence in that
   range, but the same assertion already caught one coordinator edit during the `docs` build, so verify
   it by running the test rather than by reading.

### 3.H Tests that iterate the verb list

These enumerate `stepStatics.verbs.all` and will each need an `until` case:
`step-statics.test.ts`, `step-verb-contract.test.ts`, `step-contract.test.ts`,
`is-browser-step-guard.test.ts`, `is-targeting-step-guard.test.ts`.

## 4. Deliberately NOT in this piece

**`until` does not capture a shot.** It is not added to `verbs.capturing`. The spec's capture rule is
"capture on every ACTING step" and `look`'s own sentence about writing the shot beside the key (line
2609); `until` has neither. A capture on every `until` would put four extra PNGs in a four-`until` batch
and change what the shot list means.

**The counter-argument is real and is recorded rather than acted on**: a timed-out `until` is the case a
fixer opens first, and finding 6 in the handoff's log was a failure that captured and never read. The
shape worth considering next round is a capture on the TIMEOUT path only, which `stepDispatchBroker`
already has the machinery for. It needs a decision about what `shots[]` then means, so it is not a
free addition.

**`waitFor { ref }`** (spec line 360) stays absent. Unrelated to this row.

## 5. How it gets verified

Ward first, scoped to the touched files, with the exit code checked:

```
npm run ward -- --only lint,typecheck,unit,integration -- <every file touched>
```

Then it gets DRIVEN, which is where every round of this build has found its defects. Build, boot a real
`dungeonmaster-web` lane per `manual-verification-runbook.md`, and type at minimum:

1. `until { visible }` on an element that renders late — the case `waitFor` cannot do.
2. `until { predicate }` between two `look`s either side of a `seed` — R7, the spec's own live-update
   shape, which is the reason this verb exists.
3. `until { response }` against a real POST the app makes.
4. `until { file }` against a real `quest.json` the seed writes.
5. A deliberate TIMEOUT, to confirm R9: `status: 'timeout'`, not `failed`, with the step and the verb
   named.
6. The already-happened case on `console` or `response`, to confirm the error from 3.B actually prints.
7. `until { visible }` against a browserless `dungeonmaster-headless` lane, to confirm the refusal names
   the `file` form.

Then kill the instance and run the sweep from the handoff BY HAND, not by trusting a report of it.
