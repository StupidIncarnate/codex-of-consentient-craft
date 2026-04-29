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
                       confirm the UI now shows what it should.
5. User validation  →  ping the user. They drive their own validation. Do NOT commit before
                       they say it's good.
```

If a phase fails, you go back — you do not paper over.

---

## Phase 1: Determine root cause

Always trace from the user-visible symptom **down** to the source. Don't
trust your prior. The same UI gap can come from contract rejection,
transformer drop, broker filter, or component branch.

The reliable trace order:

1. **Confirm the UI symptom in the browser.** Open the URL the user gave you
   (Chrome MCP tools), navigate to the quest page, find the missing element.
   Verify with `read_page` or `find` that it's actually missing — not just
   collapsed or off-viewport.

2. **Walk the React props.** Use the `javascript_tool` to grab the relevant
   widget's `entries` / state via the React fiber. Confirm whether the data
   reaches the component or not. If it does, the bug is render-side. If it
   doesn't, the bug is upstream.

3. **Check the wire.** If data didn't reach the widget, look at WS messages
   in console (`use-quest-chat-binding` logs `[WS] chat-output`) or the
   server's broadcast path. Are entries being emitted at all? Are they being
   filtered out somewhere?

4. **Check the JSONL on disk.** Find the session JSONL (`~/.claude/projects/<encoded>/<sessionId>.jsonl`)
   — confirm whether Claude CLI actually wrote the data. If the JSONL has
   it but the wire doesn't, the orchestrator is dropping it.

5. **Check the contracts.** Most "silently dropped" bugs in this codebase
   are zod `.safeParse` failures returning `[]` from the processor's
   early-return. The shape that fails is almost always what real Claude CLI
   emits but our stubs don't.

When you find the root cause, **explain it to the user before writing any
code.** "I think X is rejecting Y because of Z" — wait for confirmation,
because you may have misread.

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

Find a captured JSONL line from a real session that exercises the bug.
Embed the literal shape (or hand-build the JSON) in the test. Stubs that
already pass under the broken contract are useless — they were written
assuming the broken constraint.

When in doubt, look at `~/.claude/projects/<...>/<sessionId>.jsonl` and
mirror what's actually there.

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

## Phase 4: Manual verification (you drive)

This is non-negotiable. Tests can be green and the UI can still be
broken — different reasons every time (stale dev server, vite cache,
transformer change not in `dist/`, WS reconnect race).

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

---

## Phase 5: Hand off to the user

After Phase 4 passes, post a concise summary and **wait**:

- What the bug was (one sentence).
- Where the fix landed (file + ~line range).
- What you verified in Chrome (URL + what you saw).
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
  the pgrep output. Filter by working directory or by port (`lsof -iTCP:4751`).

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
- ❌ Running `npm run dev` while another instance is running. Kill all
  tsx-watch / vite children first; verify `pgrep` is empty before
  restarting (memory: `feedback_kill_dev_before_fix.md`).
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
