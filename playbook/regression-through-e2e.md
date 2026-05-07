# Regression-Through-E2E Playbook

Workflow for fixing UI-visible regressions where the user reports "I don't
see something in the UI that I know should be there." Most live-server bugs
in this repo land here: a tool call, a chat entry, a quest section, a
button, an icon — something that should render but doesn't.

This playbook is the contract between the user and you. **Do not skip
phases.** The user has burned multiple sessions watching agents declare
victory based on green tests while the UI stayed broken. The phases below
exist because each one catches a failure mode that the next phase can't.

---

## The five phases

```
1. Root cause       →  diagnose, don't guess. Trace from UI symptom to wire to contract.
2. Failing test     →  e2e or unit test that asserts what SHOULD show. Run it. Watch it fail.
3. Fix + test pass  →  fix the impl. Re-run the test. If it doesn't pass, the asserts are
                       wrong OR the fix is wrong. Find out which before moving on.
4. Manual verify    →  YOU restart dev, open Chrome, drive the bug's reproduction prompt,
                       and MEASURE the user-stated invariant (count rows, check exact text,
                       walk the URL the user gave). Tests-green is necessary, not sufficient.
                       This phase is MANDATORY before Phase 5. No exceptions.
5. User validation  →  ping the user. They drive their own validation. Do NOT commit before
                       they say it's good. Reaching Phase 5 without Phase 4 = burning the user.
```

If a phase fails, you go back — you do not paper over.

## Order is load-bearing: test BEFORE fix (MANDATORY)

The phases are sequential, not a checklist you can reorder. Phase 2 (write
the failing test) MUST be complete — code written, run against the unfixed
codebase, **observed to fail on the assertion** — BEFORE you touch the
implementation in Phase 3. This is non-negotiable. It applies to every
class of bug this playbook covers, including:

- "I don't see X in the UI" reports.
- "We already have a test for this but it isn't checking what it should"
  reports — the strengthened/added assertion has to fail on the pre-fix
  source.
- Test gaps surfaced by an existing failing manual reproduction.

### What you can do BEFORE the failing test exists

- Read code, run discover/grep, ask the user clarifying questions.
- Add temporary `process.stderr.write(...)` / `console.log(...)` lines for
  runtime observability. These are read-only diagnostics; revert them
  before the fix lands. They are not "implementation changes."
- Inspect on-disk state (quest.json, JSONL files, logs) and live wire
  traffic via Chrome MCP to corroborate the user's report.

### What you MUST NOT do before the failing test exists

- Edit any non-test source file with the intent to change behavior — even
  a "tiny" rename, even "while I'm in here," even adding a new helper
  method or contract that you "know" the fix needs.
- Add new state methods, new contracts, new branches in responders, new
  guards, etc. Code-reading conviction is not test-level proof. If you
  catch yourself reaching for the implementation file, STOP and write the
  test first.
- Refactor adjacent code. Refactors require their own tests and their own
  scope.

### Why this is non-negotiable

- A test you write *after* the fix has no proof it would have caught the
  bug. You assume the assertion targets the symptom; you have no evidence.
  The next regression in this area silently passes the test and the bug
  re-ships.
- Watching the test fail is the only way to know the assertion talks
  about the *user-visible symptom*, not an intermediate cause that
  silently recovers downstream. If the assertion asserts on the wrong
  shape, you find out at Phase 2 (cheap), not after the fix is committed
  (expensive).
- A test written after the fix often slips into the same shape as the
  fixed code — you write what you just made true. That's a tautology, not
  a regression guard.
- Skipping this step has burned past sessions: an agent code-reads,
  identifies a plausible root cause, ships a "fix," and the existing test
  still passes vacuously because the assertions don't cover the broken
  path. The user has to catch this manually, every time.

If the test is hard to write — if you can't reproduce the user's bug in
the harness — that is a *signal*, not a license. Surface the blocker to
the user ("here is what I tried, here is why the harness doesn't repro
yet") instead of moving to Phase 3 anyway.

If you finish Phase 1 and you're tempted to "just fix it real quick" —
stop. Write the test first. Watch it fail. Then fix.

---

## Phase 1: Determine root cause

The same UI gap can come from contract rejection, transformer drop, broker
filter, or component branch. Don't trust your prior — capture the actual
wire data first, then trace.

### For streaming bugs: start in Chrome, capture the live wire

If the symptom is "I don't see X live during streaming" (not "I don't see X
when I reload a finished session"), this is the order. **Do not skip step
1.** Stub-driven debugging from JSONL alone is misleading because it
collapses the streaming/replay timing dimension.

1. **Reproduce in Chrome with the console open.** Start a fresh chat
   session (`/codex/quest/` with no quest id) so you get clean WS traffic.
   Drive the user's original prompt verbatim — you can find it in the
   reported quest's `userRequest` or the chat panel header. Watch the
   browser console: every WS message is logged via
   `use-quest-chat-binding` (`[WS] chat-output`, `[WS] chat-complete`,
   `[WS] chat-history-complete`). The console messages ARE the streaming
   wire — what shapes are emitted, in what order, with which `agentId`,
   `toolUseId`, `source`, etc. Save these.

2. **Now refresh the page.** The same session re-loads via the replay path
   (`chat-history-replay-broker` reads JSONL, fires the same `chat-output`
   contract). The console floods with replay frames. Save these too.

3. **Diff stream vs replay.** Whatever's in replay but missing from
   streaming (or vice versa) is your bug surface. The convergence
   invariant is "both paths produce identical `ChatEntry` shapes" — any
   asymmetry is a regression.

4. **The console captures ARE your future test stubs.** Both
   `chat-streaming-*-grouping.spec.ts` and `chat-replay-*-grouping.spec.ts`
   pre-seed JSONL and queue Claude-mock lines. Lifting the captured WS
   payloads into those harnesses means you're testing against the EXACT
   shapes Claude CLI produced, not an idealized shape you guessed.

### For non-streaming bugs (or after you have the stream/replay diff):

5. **Walk the React props.** Use `javascript_tool` to read the widget's
   `entries` / state via the React fiber. Confirm whether the data
   actually reached the component. If it did, the bug is render-side. If
   it didn't, the bug is upstream.

6. **Check the JSONL on disk.** Find the session JSONL
   (`~/.claude/projects/<encoded>/<sessionId>.jsonl` and the
   `<sessionId>/subagents/agent-<realAgentId>.jsonl` siblings). Claude
   CLI wrote it; the orchestrator parsed it. If JSONL has the field but
   WS doesn't, the orchestrator dropped it.

7. **Check the contracts.** Most "silently dropped" bugs are zod
   `.safeParse` failures returning `[]` from the processor's early
   return. The shape that fails is almost always what real Claude CLI
   emits but our stubs don't.

When you find the root cause, **explain it to the user before writing any
code.** "I think X is rejecting Y because of Z" — wait for confirmation,
because you may have misread the trace.

---

## Phase 2: Write a failing test

The test exists to prove two things at once:
- The bug is real (assertion fails today).
- The fix actually addresses the user-visible symptom (assertion passes
  after the fix).

### What to assert

Assert the **user-visible thing the user told you was missing** — not the
intermediate cause.

If the user says "I don't see the result of the get-quest tool call," your
assertion is "TOOL_ROW_RESULT contains the result text." Not "contract
parses array shape," not "transformer produces a tool_result entry." Those
are intermediate; they may be true while the UI stays broken (different
filter further downstream), or they may be false in a way that silently
recovers (different code path picks up the slack).

### Where the test goes

| Symptom shape                                        | Test type                                                      |
|------------------------------------------------------|----------------------------------------------------------------|
| UI element missing / wrong content / orphan card     | E2E in `packages/testing/e2e/web/*.spec.ts`                    |
| Tight loop on a transformer or contract you suspect  | Unit test alongside the impl, asserting the chat-entry output |
| Both — UI is the symptom but a transformer is the cause | E2E for the symptom, unit alongside the fix for the invariant |

Default to **e2e for any "I don't see X in the UI" report** — that's what
the user's experience is, that's what regression has to track.

### Use real CLI shapes, not idealized stubs

The console captures from Phase 1 step 1 are the source of truth. Lift the
literal `chat-output` payloads (and the upstream JSONL lines that produced
them) into the test:

- **For e2e:** queue the captured stream-line shapes via `claudeMock.queueResponse`
  and pre-seed sub-agent JSONLs via the `sessionHarness` helpers. The shapes
  must match what real Claude CLI emitted, not an idealized form.
- **For unit:** pass the literal post-normalize shape into the
  transformer/processor and assert on the output.

Stubs that already pass under the broken contract are useless — they were
written assuming the broken constraint. JSONL on disk is also a fallback
source, but for streaming bugs it loses the timing dimension (when each
line arrived, what order, before or after parent CLI exit). The console
capture from Phase 1 keeps that timing visible.

### Run the test, confirm it fails

```bash
npm run ward -- --only e2e --onlyTests "<your test name fragment>" -- packages/testing
```

Read the failure. Confirm it fails on the **assertion**, not on setup or
infrastructure. If a Playwright timeout fires before reaching your assert,
your test is broken, not the impl. Fix the test setup before continuing.

---

## Phase 3: Fix the implementation

You already know the root cause from Phase 1. Apply the fix. Then:

1. Re-run the same `--onlyTests` invocation. Confirm the test now passes.
2. Run a broader `npm run ward` (full suite, `timeout: 600000`). Confirm
   no other test regressed.
3. Build before ward — stale `dist/` produces fake TS2339 errors:

   ```bash
   npm run build && npm run ward
   ```

If the failing-fix-passing-test cycle doesn't snap together cleanly:

- **Test still fails after fix?** Either the fix is incomplete, or your
  assertion was targeting the wrong thing. Read the failure carefully —
  what does the locator now resolve to? Compare to expectation.
- **Test passes but full ward goes red elsewhere?** Your fix has blast
  radius you didn't anticipate. Investigate. **Do not** assume the
  failure is "pre-existing" — the user has explicitly called this out.

---

## Phase 4: Manual verification (you drive — MANDATORY before Phase 5)

This is non-negotiable. Tests can be green and the UI can still be
broken — different reasons every time (stale dev server, vite cache,
transformer change not in `dist/`, WS reconnect race, e2e harness
asserting a different invariant than the user stated).

**You drive Chrome before the user does. Every time. No exceptions.**
Reaching Phase 5 without first measuring the user's stated invariant in
a real browser is the failure mode this playbook exists to prevent. The
user has burned sessions on agents that handed off after "tests green +
something rendered" without checking *whether the rendered thing matches
what the user said was wrong*. Don't be that agent.

Common failure shapes when this phase is skipped or done lazily:

- E2E asserts row text is distinct, but the user said "should be one
  row, not three." Test passes, UI still has three rows.
- E2E asserts an element is visible, but the user said it should be at
  a specific URL/route. Test passes, navigation lands somewhere else.
- E2E uses a synthetic harness fixture, but the user's data on disk
  has a shape the fixture didn't cover. Test passes, real data still
  breaks.

If you only see the green checkmark from Phase 3 and not the actual
browser, you have not done Phase 4. Tests-green proves the assertion
holds; only Chrome proves the assertion was the right one.

### 4a. Restart the dev server

The user kills their instance. **You** start the new one:

```bash
npm run dev
```

Always from repo root, never from a workspace. (Memory:
`feedback_dev_prod_root_only.md`.) Ensure the orchestration log shows
`server listening` before navigating.

### 4b. Reproduce in Chrome

Two flavors of bug, two reproduction shapes:

**Read bug** — the user gave you a URL and the bug is visible without typing
anything (e.g. "go to this quest, the get-quest tool result is missing").
- Navigate to the URL.
- Verify the UI now shows what was missing.
- No new session needed. The data on disk is replayed.

**Streaming bug** — the bug only appears live as Claude CLI emits the data.
- Open `http://dungeonmaster.localhost:4751/codex/quest/` (no quest id —
  that creates a new session).
- Get the original prompt: from the URL the user gave, look at the quest
  on disk and find the chunk under `## User Request` in the chat (or in
  `quest.json#/userRequest`). That's the message to send.
- Paste it into CHAT_INPUT, click SEND, watch the chat panel.
- Verify the missing element now renders during streaming, not just after
  reload.

Use the Chrome MCP tools (`navigate`, `find`, `read_page`,
`javascript_tool`) — don't ask the user to drive the browser.

### 4c. Check both stream AND replay if it's a streaming bug

After the streaming reproduction, hit reload. The replay path uses the
same processor but reads from JSONL on disk. Both paths must show the
fix. If streaming works but replay doesn't (or vice versa), parity is
broken — the fix is incomplete.

### 4d. Measure against the user's stated invariant — quote it back to yourself

Re-read the user's exact words about what's wrong. Pull out the
**structural invariant** they stated and measure it in Chrome with
`javascript_tool`/`read_page`/`find` — not just "I see something
rendered."

| User said | What to measure |
|---|---|
| "should be one row per X file" | `document.querySelectorAll('[data-testid^="…"]').length` matches the on-disk file count |
| "showing duplicates" | distinct values in the visible set; row count vs unique-key count |
| "should be at /foo/:bar" | `window.location.pathname` after the click |
| "doesn't show the X icon" | `getByTestId('X_ICON')` resolves and is visible — not just "the row exists" |
| "live during streaming" | the element appears DURING a fresh send, not only after reload |

Write down the count or value you measured, and the count or value the
user said was right. They must match. If the user's words name a number
("1 row", "3 sessions") and your measurement returns a different number,
the fix is incomplete — even if the e2e is green. Go back to Phase 1
and figure out which invariant you missed.

This step is what catches "the test passed but on the wrong invariant."
A test only proves the assertion you wrote is now true; it cannot prove
the assertion was the right one. Chrome proves the assertion was right.

---

## Phase 5: Hand off to the user

You can only enter Phase 5 after Phase 4 is **done with measurements**
— not "the dev server started," not "I clicked around," but
"I measured the invariant the user named and the number/value matches."
If you cannot quote the user's invariant and your measured value side by
side in your handoff message, you have not finished Phase 4. Go back.

After Phase 4 passes, post a concise summary and **wait**:

- What the bug was (one sentence).
- Where the fix landed (file + ~line range).
- What you measured in Chrome: the URL, the user's invariant in their
  own words, and the number/value you actually observed. Side by side.
  Example: *"You said 'one row per quest file', disk has 1 quest file,
  Chrome shows `questRows: 1, sessionRows: 0`."*
- "Ready for your validation."

**Do not commit yet.** The user runs their own validation pass — it
catches stuff your manual verify missed (other quest pages, edge cases
in the same flow, regressions of fixes from earlier sessions).

When they say it's good, commit. Bundle: root-cause + failing test + fix
+ any necessary stub/contract updates in one commit. Reference the
session id or quest id in the message if it helps trace later.

---

## Gotchas seen in past sessions

- **`toolUseResult` has at least three wire shapes.** Claude CLI emits this
  field as: (a) object `{agentId, status, ...}` for Task/sub-agent
  completion, (b) array `[{type:'text', text:'...'}]` for MCP / Bash
  text returns, (c) plain **string** for tool error returns
  (Read-too-big, hook-blocked Grep, etc). Any contract that admits only
  one or two shapes silently drops the others. When fixing this class
  of bug, write a contract test (not just an e2e) that lists every
  shape — easy to forget one, easy to regress.

- **The post-normalize contract and the wire contract are TWO files,
  not one.** `packages/shared/.../user-tool-result-stream-line-contract.ts`
  validates the raw JSONL line; `packages/orchestrator/.../normalized-stream-line-contract.ts`
  validates the camelCased post-normalize shape. A widening fix has to
  land in both — only widening one means streaming and replay disagree.

- **Recursive normalizers/inflaters can swallow strings the renderer
  needed verbatim.** `claudeLineNormalizeBroker` invokes
  `inflateXmlStringsTransformer` on the entire normalized line tree;
  every XML-shaped string is rewritten into the parsed object form. That's
  intended for `<task-notification>` at `message.content` (string at
  object-property position). It is NOT what you want for
  `<tool_use_error>` strings inside `tool_result.content[]` — those must
  reach the renderer as strings. The inflater is scoped via an
  `insideArray` flag so descent through any array stops further inflation.
  When debugging "TOOL ERROR with empty body" or "system-reminder rendered
  as object" symptoms: read the widget's `memoizedProps.toolResult.content`
  via React fiber — empty string vs. JSONL-on-disk's actual XML envelope
  is the tell.

- **Sub-agent JSONLs live at
  `~/.claude/projects/<encoded>/<sessionId>/subagents/agent-<realId>.jsonl`,
  not under `~/.claude/projects/<encoded>/subagents/`.** When grep'ing for
  a sub-agent's tool_use_id, scan inside the session-id folder.

- **A tool row visibly rendered with ✓ does NOT prove pairing.** Inspect
  React fiber `entries[]` to count `tool_use` vs `tool_result` per
  `toolUseId`. The visible icon can lag, mislead, or come from a
  fallback render branch.

- **`pgrep dungeonmaster`** isn't enough to confirm dev is dead — sibling
  workspaces (e.g. `amalga-victorious`) run their own vites that pollute
  the pgrep output. Use `bash scripts/scoped-kill.sh dev --dry-run` for an
  authoritative list of THIS repo's dev processes (port + cwd-scoped),
  or `lsof -iTCP:4751` for a port-only check.

- **Stubs ARE the regression probe — don't build a parallel fixtures
  system.** When you find a new captured CLI shape, add a stub for it
  in the appropriate `*-stream-line.stub.ts` (and a contract test that
  calls the stub + asserts `toStrictEqual` against the parsed result).
  The stub factory invokes `contract.parse(...)` at construction, so
  any future contract narrowing that drops the shape breaks the stub
  at import time — same gate that catches the regression. Do NOT
  create a sibling `*-fixtures-statics.ts` file: lint blocks
  `statics/` from importing `contracts/`, tests can't import contract
  types directly, and you end up duplicating the canonical shapes
  that the stubs already enumerate.

- **One field name can have multiple wire shapes.** `toolUseResult`
  has at least three (object, array, string). When you find one
  rejected shape, audit the actual JSONL files for every other shape
  of the same field before declaring the fix complete — a one-shape
  widening that misses a sibling shape ships a partial fix and the
  next session finds the gap.

- **Default `z.object()` strips unknown fields silently — that is
  correct for CLI line contracts.** Claude CLI emits non-SDK fields
  on every line (`caller` on tool_use, `requestId` / `parentUuid` /
  `attributionAgent` at top level, `container` / `context_management`
  inside message). The contracts read what they need; passthrough
  isn't required and `.strict()` is forbidden — it would reject every
  real line.

- **JSONL probe before declaring "all shapes covered."** When closing
  out a contract-class bug, write a one-off Node script that reads
  N recent session JSONLs (parent + sub-agent), runs every line
  through every relevant contract via `safeParse`, and reports
  rejections. Zero rejections across thousands of real lines is the
  evidence that the contract suite is genuinely all-inclusive.

## Anti-patterns to avoid

- ❌ "Tests pass, shipping it" without manual verify.
- ❌ "Manual verify worked, committing" without user validation.
- ❌ Reaching Phase 5 without driving Chrome yourself. Tests-green +
  "I think it should work" is not Phase 4. The user has been burned by
  this; they will catch you skipping it.
- ❌ Phase 4 hand-wave: starting dev, navigating to a URL, reading the
  page once, and declaring victory without measuring against the user's
  stated invariant. If they said "1 row" and you didn't check the row
  count, you didn't do Phase 4. Go back to step 4d.
- ❌ Asserting on the intermediate cause (contract parse, transformer
  output) instead of the user-visible symptom.
- ❌ Writing a test using a stub that already passes through the broken
  code path. (The bug is invisible to that stub by definition.)
- ❌ Skipping the JSONL inspection step in Phase 1. Real CLI shapes are
  weirder than stubs, and 80% of "silently dropped" bugs in this repo
  trace to a contract that was written against a stub that omitted the
  problem field.
- ❌ Hand-editing `.claude/settings.json` or any infra/config file
  during the fix. Surface a diff to the user instead.
- ❌ Hand-rolling a pkill sequence before `npm run dev`. The root
  `dev:kill` (`scripts/scoped-kill.sh`) does a port sweep AND a cwd-scoped
  sweep over `/proc/<pid>/cwd`, reaping every stale tsx-watch / vite /
  parent shell whose cwd is inside this repo while leaving other repos
  alone. Just run `npm run dev` — it self-cleans. Use `bash
  scripts/scoped-kill.sh dev --dry-run` if you want to preview the kill
  set first (memory: `feedback_kill_dev_before_fix.md`).
- ❌ Declaring a bug "secondary" or "out of scope" because it surfaces
  through the UI but the cause is server/contract layer. Every bug that
  surfaces through the UI is in scope (memory: `feedback_manual_qa_scope.md`).

---

## Loop control

The user has been through this loop multiple times for the same bug
class. If you find yourself:

- About to skip Phase 4 because the tests look great → **don't**.
- About to commit before user validation → **don't**.
- Tempted to declare the issue fixed without restarting dev → **don't**.

The point of the playbook is that each phase is a checkpoint that
catches a different failure mode. Skipping any one is what made earlier
sessions burn cycles.
