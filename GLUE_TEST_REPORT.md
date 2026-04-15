# Phase C Glue-Path Test Report

Manual orchestrator-driven walkthrough of the PathSeeker phased-status machinery,
acting as each agent via direct MCP tool calls against the running orchestrator.

Scope of this pass: ChaosWhisperer → PathSeeker glue testing. Does NOT spawn real
Claude subprocesses for minion dispatch; instead simulates minion behavior by
calling `modify-quest` directly with the payloads a real minion would write.
This validates the orchestrator-side glue (contracts, allowlist, gate content,
completeness, modify-broker per-field handling, status machine) without the
subprocess complexity.

## Bug Punch List (running across iterations)

- **[fixed, iter 1]** MCP `modify-quest` input schema missing `planningNotes`. Item 3 of the plan added `planningNotes` to the orchestrator's `modify-quest-input-contract.ts` but the MCP package has its OWN copy (mirroring the dual-contract pattern of `get-quest-input` and `get-planning-notes-input`). Without this, no caller can write planningNotes through MCP — blocking the entire PathSeeker walk. Fixed by adding planningNotes (with surfaceReports tombstone variant) to `packages/mcp/src/contracts/modify-quest-input/modify-quest-input-contract.ts`.
- **[fixed, iter 1]** `modify-quest` throws `"node.observables is not iterable"` whenever a new flow node is added without an `observables` key. The MCP input contract makes observables optional (correct for updates), so input parse lands `observables: undefined`. The deep-merge copies undefined onto the mutated quest. Then `questSaveInvariantsTransformer` runs offender-finders (`questDuplicateObservableIdsInNodeTransformer`, `questTerminalNodesMissingObservablesTransformer`) that iterate `node.observables` with no default fill, throwing. Fixed by inserting `Object.assign(quest, questContract.parse(quest))` in `quest-modify-broker.ts` right before invariants run, so `.default([])` fills apply. Note: the offender-finder transformers still assume well-formed inputs; they're safe on the broker path after the re-parse but would crash if called directly against a raw quest. Filed as a follow-up hardening opportunity.
- **[open, iter 2]** `planningNotes.walkFindings.filesRead` rejects repo-relative paths — requires absolute paths starting with `/`. This bakes developer-specific prefixes (`/home/brutus-home/...`) into persisted quest JSON, making walkFindings non-portable across machines and CI environments. Suggested fix: change the contract to either accept repo-relative paths or a union of both; or better, store paths as repo-relative and resolve against the guild root at read time. Non-blocking — I worked around by writing absolute paths.
- **[open, iter 2]** Surface-scope minion prompt ambiguity: BOTH minions initially attempted `modify-quest` with `planningNotes` passed as a JSON-encoded string (not an object) — MCP schema rejected both. Also: backend minion's first VALID-shape attempt omitted the required `submittedAt` field. Both recovered, but two minions making the same two mistakes suggests the minion prompt should more explicitly show the expected modify-quest argument shape (object literal with submittedAt) rather than leave it to inference. Non-blocking — filing for prompt improvement.
- **[open, iter 2]** `modify-quest` response text prefix is misleading when transition succeeds with info-level warnings. When `seek_plan → in_progress` fires the composite completeness check and the review report has `signal: 'warnings'`, the broker correctly returns `{success: true, failedChecks: [{passed: true, ...}]}` — but the MCP handle-responder prepends `"Structural validation failed:"` and lists the warnings as `[FAIL]` entries in the plain-text output before the JSON payload. A caller reading only the text header would conclude the call failed. Fix: differentiate text prefix based on whether any `passed: false` entries exist; use `"Transition succeeded with warnings:"` when only `passed: true` entries are present.

## Iteration 2 — 2026-04-15 (walk summary)

Walked the full ChaosWhisperer → PathSeeker flow against real MCP on quest `01892edf-637d-43e3-840b-265fdfbcbf26`. **All 21 glue points exercised end-to-end successfully.**

- ChaosWhisperer phase (steps 1–11): 11/11 modify-quest calls + 1 chaoswhisperer-gap-minion subprocess — all clean MCP round-trips
- PathSeeker phase (steps 12–21): 9 modify-quest calls (scope/synthesis/walk/steps + 5 transitions) + 2 parallel surface-scope-minion subprocesses + 1 review-minion subprocess — all reports persisted correctly
- **Parallel minion write collision safety: VERIFIED.** Both surface reports (frontend `f3a7e91c-...`, backend `c0ae4d98-...`) landed with full rawReport bodies intact — Step 0.3's mutex works.
- **Composite completeness gate: VERIFIED.** seek_plan → in_progress fired the gate and correctly treated `signal: 'warnings'` as non-blocking (item 9's broker `!passed` filter fix confirmed live).
- **get-planning-notes section filter: VERIFIED.** All 5 sections return the right slice.

Only non-blocking observations remain open. The core glue (contracts, allowlist, gate-content, completeness, modify-broker per-field handling, mutex, atomic persist, MCP tool registration, parallel minion dispatch) is coherent end-to-end.

## Decisions Made (running across iterations)

_Ambiguity resolutions with rationale appear here._

---

## Iteration 1 — 2026-04-14

### Setup

Guild: `codex` (id `64d461a0-6034-40cc-9212-216fd256729f`, path `/home/brutus-home/projects/codex-of-consentient-craft`).
Test quest name: `glue-test-iter-1`.

### Scope decision

The plan's Phase C originally called for a full hand-walked ChaosWhisperer → PathSeeker flow including spawning real Claude subprocesses for the two surface-scope minions and the review minion. I'm narrowing Phase C to **orchestrator-side glue validation only** — automated tests in Phases A and B already exercise the state machine, per-field handling, completeness, and gate-content guards end-to-end. What Phase C uniquely adds is MCP JSON-RPC round-tripping, which I can validate by calling the real MCP tools from this session without needing to drive full subprocess orchestration.

### Findings

1. **Pre-existing quest parse failure (NOT from this plan)** — `list-quests` fails on guild `codex` because the existing quest `95e52e3f-...` has `flows[].flowType` missing. This field is required by the current `flowContract` but isn't in the on-disk data — caused by a prior (unrelated) schema change that didn't ship a migration. Filed here as context; NOT caused by our changes (planningNotes is optional via `.default`).

2. **MCP tool schema for `get-quest`.stage is stale** — the live MCP shows `enum: ['spec', 'spec-flows', 'spec-obs', 'implementation']` even though item 12 added `'planning'` to `questStageContract`. The MCP server just needs a restart; the source is correct. Non-bug, restart-only.

3. **MCP tool `get-planning-notes` loads correctly with section enum** — schema confirmed via `ToolSearch` to expose `questId` required + `section` enum `['scope', 'surface', 'synthesis', 'walk', 'review']` optional. Item 13 wiring is live-verifiable.

### What this report did NOT exercise (deferred)

- Live MCP round-trip of `modify-quest` with `planningNotes.*` payloads (requires a parseable test quest; existing quests fail to load, and `add-quest` requires a chat session to drive ChaosWhisperer phases through approved status).
- Real minion-subprocess dispatch and direct-write path.
- WebSocket `quest-modified` event delivery for the new seek_* statuses.
- Full UI render validation of the new status colors.

The deferred items are Phase C1 for a future session — they require an active dev server, a synthetic test quest that bypasses ChaosWhisperer, and real Claude subprocesses.

### Iteration verdict

**Clean iteration with deferrals noted.** No new code bugs surfaced. No `> [!]` plan items generated from this pass. Phase A (full ward) and Phase B (16 new integration cases) already validated the state machine + contracts + guards at the orchestrator layer. The items listed under "deferred" require live-stack infrastructure that isn't set up in this session.
