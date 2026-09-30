# F124: the big-bang's deferred hand steps H2, H3, H4, H5, H7 and H8 are closed out against today's tree

| | |
|---|---|
| Phase | Follow-up units (after the big-bang run; before assayer, per the Handoff of 2026-09-30 07:40) |
| Source | `bigbang/RUNBOOK.md` "Hand pre-steps" (H2 to H8), `items/b15-brand-migration.md` "Decisions (4.0)" tables 2.2, 2.3, 2.4 and Item 3, `items/b11-unique-contract-names.md` "Decisions (4.0)", EPIC.md F124 row |
| Needs | nothing (the big-bang is done; H6 was done by W10's R2 round) |
| Unblocks | F125 and `bigbang/PORTING.md` (a port copies the tables this item corrects); R8's coverage of `toolUseId` fields |
| Packages touched | `@dungeonmaster/shared`, `orchestrator`, `hydration-recipes`, `session-forensics`, `cli`, `ward`, `mcp`, `server`; `web` and `siegelense` only for the conditional files named in each step |
| Checks to run | `lint,typecheck,unit` per batch on the package it edits; `integration` for orchestrator, hydration-recipes, server and session-forensics once per step; web `e2e` only if a web runtime file changes (none is planned) |
| Split | by step, then by the batches below (2 to 4 files each); the operator runs the `SB` barrel batch alone and in its place in the order |
| Runs alone | no, but `packages/shared/src/contracts/contracts.ts` is edited by ONE batch (`SB`) for three steps, and `packages/orchestrator/src/index.ts` by one batch (`H7-A1b`) |

## Why

The big-bang applied W1 to W10 but left six hand steps the scripts could not do. Four were written for a tree in which
the standalone brand contracts still existed, and the scripts have since removed, renamed or plained most of what the
steps named. This item re-measures each step on the code of 2026-09-30 (after 7e8db9b9f), says which parts are already
done, and lists every file the rest creates, edits or moves, so the operator can size and dispatch it. Measured with
`python3 tmp/f124-plan/scan.py <regex>` (a read-only walk of `packages/**/*.ts`, skipping `node_modules`, `dist`,
`.ward`), plus `Read` of each contract named.

## Current state

### Summary

| Step | What it was | State today | Work left |
|---|---|---|---|
| H2 | `PieceId` owner in orchestrator, shared reads it | NOT DONE. `PieceId` is a plain standalone scalar in shared, not a brand | yes: decision D1, then 9 batches under option A |
| H3 | `ToolUseId` owner rename first | NOT DONE in a different shape: the standalone copies are gone and twelve `toolUseId` fields each carry their own derived brand; the owner rename was never made | yes: 5 batches plus a conditional fix queue |
| H4 | four new W4 owners get their other fields | NOT DONE: each owner holds `id` only | yes, but the table over-reaches: decision D3; 2 batches recommended, 3 more if the full table stands |
| H5 | lifts, `GetQuestInput` rename, folder renames | PARTLY DONE: `packageJson`, `signalBackInput`, `zodIssueError`, `recipeManifest` lifted or gone; six of nine renames and their folders done | `packageJsonRaw` lift (6 batches) and the mcp `GetQuestInput` rename (2 batches); two renames no longer needed (D4) |
| H7 | gateway rows, rows 46, 47, 72, rows 71 and 75 | MOSTLY DONE or moot: the 11 gateway rows are gone or done; rows 46, 47 are deliberately `z.record(z.string(), z.json())`; row 102 is done | rows 71 and 72 (server clarify body) and row 75 (session-forensics usage): 5 batches |
| H8 | `SmoketestRunId`'s shared references | ALREADY DONE: nothing references it anywhere | none required; one optional batch (D6) |

### H2: `PieceId`

- `packages/shared/src/contracts/piece-id/piece-id-contract.ts:17` reads `export const pieceIdContract = z.string().min(1);`.
  No `.brand`. The type `PieceId` is the plain `string`. The folder still holds the contract, `piece-id-contract.test.ts` and
  `piece-id.stub.ts`, and `packages/shared/src/contracts/contracts.ts:189` still exports it. W3 never ran the brand
  (`bigbang/w3-runs.txt` line 1 holds it out) and W10's scalar pass plained it without giving it an owner.
- The owner, `workPlanPieceContract` (`packages/orchestrator/src/contracts/work-plan-piece/work-plan-piece-contract.ts:55`), sits in
  orchestrator and takes `id: pieceIdContract` (line 57) and `baselineFor: pieceIdContract.optional()` (line 88) from shared.
  Its other inputs are shared's `qaChecklistItemContract` only, so it can move to shared with no new dependency.
- Shared fields that read the id and cannot import orchestrator: `packages/shared/src/contracts/work-item/work-item-contract.ts:100`
  (`pieceId: pieceIdContract.optional()`), `packages/shared/src/contracts/quest-projection/quest-projection-contract.ts:82`.
- Orchestrator files that read `pieceIdContract` from shared: `work-plan-validation-failure-contract.ts:26`,
  `minted-work-item-contract.ts:41`, `quest-work-view-contract.ts:114,123,253`.
- Orchestrator files that import the piece contract or stub by relative path: listed per batch below (production: 4; stubs: 1;
  tests: 12).
- The runbook's script route (`b15-id-brands --brand=PieceId`) cannot run: the script finds a standalone BRAND to retype and there
  is none. The work is by hand, with `b11-contract-merge/move.cjs` available for the importer rewrite (it resolves imports by
  declaring file, never by name, and refuses only when the two copies export different names).

### H3: `ToolUseId`

- Standalone `ToolUseId` copies: none left. `packages/orchestrator/src/contracts/tool-use-id/` and hydration-recipes' folder are
  absent. `scan` finds no `toolUseIdContract` and no `ToolUseIdStub`.
- The owner is not renamed. `packages/shared/src/contracts/tool-use-block-param/tool-use-block-param-contract.ts:14` reads
  `id: z.string().min(1).brand<'ToolUseBlockParamId'>()`; the folder `tool-use/` does not exist; `contracts.ts:369` still exports
  `./tool-use-block-param/tool-use-block-param-contract`.
- Twelve fields hold a tool use id under their own derived brand (every one is a reuse target of the owner's `id`):

| Package | File:line | Field | Brand text today |
|---|---|---|---|
| shared | `tool-result-block-param/tool-result-block-param-contract.ts:20` | `tool_use_id` | `ToolResultBlockParamToolUseId` |
| shared | `chat-entry/chat-entry-contract.ts:69` | `toolUseId` (optional) | `AssistantToolUseEntryToolUseId` |
| orchestrator | `task-prompts-from-content/task-prompts-from-content-contract.ts:14` | `toolUseId` | `TaskPromptsFromContentToolUseId` |
| orchestrator | `normalized-stream-line/normalized-stream-line-contract.ts:29` | `toolUseId` (optional) | `ContentItemToolUseId` |
| orchestrator | same file `:94` | `toolUseId` (optional) | `TaskNotificationToolUseId` |
| orchestrator | same file `:123` | `parentToolUseId` | `NormalizedStreamLineParentToolUseId` |
| orchestrator | `normalized-stream-line-content-item/normalized-stream-line-content-item-contract.ts:24` | `toolUseId` (optional) | `NormalizedStreamLineContentItemToolUseId` |
| orchestrator | `chat-line-output/chat-line-output-contract.ts:28` | `toolUseId` | `ChatLineAgentDetectedToolUseId` |
| hydration-recipes | `recipe-transcript-line/recipe-transcript-line-contract.ts:27` | `tool_use_id` (optional) | `CONTENTITEMToolUseId` |
| hydration-recipes | `subagent-record/subagent-record-contract.ts:25` | `toolUseId` | `SubagentRecordToolUseId` |
| hydration-recipes | `subagent-fields/subagent-fields-contract.ts:40` | `toolUseId` | `SubagentFieldsShapeToolUseId` |
| session-forensics | `subagent-meta/subagent-meta-contract.ts:19` | `toolUseId` | `SubagentMetaToolUseId` |

  All paths are under `packages/<pkg>/src/contracts/`. Three of them lack `.min(1)` today (`ContentItemToolUseId`, `TaskNotificationToolUseId`,
  `NormalizedStreamLineContentItemToolUseId`): reusing the owner's `id` adds `min(1)` to them (decision D2).
- Other files that use the owner's names: `packages/shared/src/contracts/assistant-content-block-param/assistant-content-block-param-contract.ts:14,21`,
  `packages/shared/src/contracts/claude-queue-response/claude-queue-response.stub.ts:10,11,25,86,87`, and the TYPE
  `ToolUseBlockParam` in `packages/web/test/harnesses/session/session.harness.ts:36,197,740`.
- `packages/orchestrator/src/contracts/chat-line-processor/chat-line-processor-contract.ts:58` holds `toolUseId: string` in a plain
  TypeScript type, not a contract. It is B14 territory; left alone here.
- Once the owner exists, R8 (`enforce-owner-field-reuse`, on at error) reports every `toolUseId` field that does not reuse it, so
  the twelve retypes must land in the same gate as the rename.

### H4: the four new W4 owners

- Today each owner holds one field. `packages/shared/src/contracts/agent/agent-contract.ts` (`id`), `session/session-contract.ts` (`id`),
  `siege-instance/siege-instance-contract.ts` (`id`, regex `inst_[0-9a-f]{4,}`), `siege-run/siege-run-contract.ts` (`id`, regex `run_[1-9][0-9]*`).
  Each has its stub and test.
- Table 2.4 names: agent `id` + `toolUseId`; session `id` + `cwd` + `startedAt`; siege-instance `id` + "the manifest fields both consumers
  read"; siege-run `id` only (its row names no other field).
- Who would reuse an added field (measured):

| Candidate field | Contracts that hold the same value today | Verdict |
|---|---|---|
| `session.cwd` | shared `quest-session-contract.ts:32`; hydration-recipes `session-fields-contract.ts:33`, `session-record-contract.ts:27`, `subagent-fields-contract.ts:46` (all four carry the same absolute-path refine) | three packages would reuse it: worth adding |
| `session.startedAt` | only `quest-session-contract.ts:50`; the other `startedAt` fields are different events (subagent window, queue entry, work item) | one reuse: not worth adding |
| `agent.toolUseId` | the same four agent-spawning rows H3 already retypes to `toolUseContract.shape.id` | no field would reuse `agent.toolUseId`; they reuse the tool use owner |
| `siege-instance.baseUrl`, `apiUrl`, `home` | siegelense `instance-manifest-contract.ts:50` block, orchestrator `lane-manifest-reading-contract.ts`, `quest-work-instance-contract.ts` (three contracts; `logs` differs in shape and optionality, so it stays out) | three reuses, but nullability and `min(1)` differ: see D3 |
| `siege-run.*` | none | nothing to add |

### H5: lifts, rename, folder renames

- `packageJson`: DONE. One copy, `packages/shared/src/contracts/package-json/package-json-contract.ts`; none in cli, ward or testing.
- `signalBackInput`: DONE. `packages/shared/src/contracts/signal-back-input/` holds it; mcp and server have no copy.
- `zodIssueError`, `recipeManifest`: DONE (no contract named either remains; `packages/siegelense/src/contracts/zod-issue-error/` is an EMPTY folder).
- `packageJsonRaw`: NOT DONE. Two identical copies: `packages/cli/src/contracts/package-json-raw/` and `packages/ward/src/contracts/package-json-raw/`
  (each `z.record(z.string(), z.json())`, a contract, stub and test). Shared has none. Importers, measured:
  cli: `brokers/package/register/package-register-broker.ts` (+ `.test.ts`), `responders/cli/create-package/cli-create-package-responder.ts` (+ `.test.ts`),
  `responders/install/add-dev-deps/install-add-dev-deps-responder.ts`, `responders/install/setup-gateway/install-setup-gateway-responder.ts`,
  `transformers/gateway-workspaces-merge/gateway-workspaces-merge-transformer.ts` (+ `.test.ts`), `transformers/root-package-json-register/root-package-json-register-transformer.ts` (+ `.test.ts`);
  ward: `brokers/workspace/manifest-entries-verify/workspace-manifest-entries-verify-broker.ts`, `responders/install/write-scripts/install-write-scripts-responder.ts`,
  `transformers/package-json-declared-entries/package-json-declared-entries-transformer.ts` (+ `.test.ts`). Both packages depend on shared. The cli responders call
  `packageJsonRawContract.keyType.parse(...)`, so the lifted copy must stay a bare `z.record`.
  (The `packageJsonRaw` hits in eslint-plugin and shared's architecture brokers are local variable names, not this contract.)
- `GetQuestInput` to `McpGetQuestInput`: NOT DONE, and the name collision is live. `packages/mcp/src/contracts/get-quest-input/get-quest-input-contract.ts:21` still
  exports `getQuestInputContract` with `.brand<'GetQuestInput'>()` and type `GetQuestInput`, beside shared's `getQuestInputContract`. The stub was renamed
  (`McpGetQuestInputStub`, `get-quest-input.stub.ts:6`) and its test imports it, so the folder is half-renamed. Callers: `packages/mcp/src/flows/quest/quest-flow.ts:20`,
  `packages/mcp/src/responders/quest/handle/get-quest-layer-responder.ts:18`. No other package imports mcp's copy (the hydration-recipes and orchestrator hits are shared's).
- Folder and file renames of the nine contracts:

| Contract | Identifier renamed | Folder renamed |
|---|---|---|
| ward `wardResult` to `wardRunResult` | yes | yes: `ward/src/contracts/ward-run-result/` |
| config `folderConfig` to `allowedExternalImports` | yes | yes |
| mcp `questWorkInput` to `mcpQuestWorkInput` | yes | yes |
| server `chatOutputPayload` to `chatOutputRouting` | yes | yes |
| orchestrator `cleanupAnswer` to `cleanupCliAnswer` | yes | yes |
| hydration-recipes `transcriptLine` to `recipeTranscriptLine` | yes | yes |
| mcp `getQuestInput` to `mcpGetQuestInput` | NO (contract, type, brand) | NO |
| server `commentBatchResponse` to `commentBatchDelivered` | NO | NO |
| hooks `toolResponse` to `hookToolResponse` | NO | NO |

  The last two no longer collide with anything: `commentBatchResponseContract` exists only in `packages/server/src/contracts/comment-batch-response/`
  (web's envelope is `commentBatchReplyContract` now) and `toolResponseContract` only in `packages/hooks/src/contracts/tool-response/` (mcp's copy is gone).
  Only `getQuestInputContract` still has two declarations (mcp and shared). R9 is recorded as scanning 0 while that pair exists; the operator may want to
  check why R9 does not see it (see D4).

### H7: W8's leftovers

Item 3's table (107 sites) now has no live `z.unknown()` in any `contracts/` file (the three `scan` hits are comments). What W8 left, by row:

| Rows | State today | Evidence |
|---|---|---|
| The 11 `gateway` rows (#4, 5, 6, 9, 10, 13, 25, 34, 94, 95, 96) | Gone or done. #5, 6, 9, 10 (`eslint-config`, `eslint-context`), #25 (`linter-config`), #94 to 96 (`typescript-*` in testing): the contracts no longer exist. #34 (`raw-eslint-config` plugins) is `z.custom<object>` with a written reason (`hooks/src/contracts/raw-eslint-config/raw-eslint-config-contract.ts`). #13 (`rule-violation.node`) is `astNodeContract`. #4 (`astNode.parent` is `z.json().optional()`) is F123's, not this step's | no `*-schema.ts` was added under `packages/@gateway/npm` |
| 46, 47 (`mcp quest-work-input` `plan`) | Kept as `z.record(z.string(), z.json())` on purpose: the contract header says collapsing it into orchestrator's `workPlanFieldsContract` changes the tool's published JSON schema (`mcp-quest-work-input-contract.ts:28-38,75-79`) and B11's "Renames stay renames" says the same | decision D5 |
| 71, 72 (`server quest-clarify-body`) | NOT DONE: `answers: z.array(z.json()).min(1)`, `questions: z.array(z.json())` (`quest-clarify-body-contract.ts:13-14`); the responder casts both back (`quest-clarify-responder.ts:95-96`). `clarificationQuestionContract` exists in orchestrator; `clarificationAnswerContract` does not (the `{ header: string; label: string }[]` type is repeated in `start-orchestrator.ts:309`, `clarify-answer-flow.ts:25`, `clarify-answer-responder.ts:22`, `clarification-answers-to-design-decisions-transformer.ts:18`). Orchestrator exports contracts through `src/index.ts` only (`package.json` exports: `.`, `./package.json`, `./*.proxy`, `./*.stub`, `./brokers`), and `src/index.test.ts` pins the export list | |
| 75 (`session-forensics transcript-record.usage`) | NOT DONE: `usage: z.record(z.string(), z.json()).optional()` (`transcript-record-contract.ts:30`); `record-to-token-usage-transformer.ts:29-40` reads `input_tokens`, `output_tokens`, `cache_read_input_tokens`, `cache_creation_input_tokens`, `output_tokens_details` off it. `transcript-record-usage/` does not exist (an empty `transcript-record-usage-key/` does) | |
| 102 (`web clarification-request-payload`) | DONE: `questions: askUserQuestionContract.shape.questions` | `clarification-request-payload-contract.ts:16` |
| 52, 69, 70 (own rows that stayed JSON) | Deliberate in code: `dev-log-event-payload-contract.ts` header says a strict element shape would throw inside `orchestrationEventsState.emit` and take the server down; row 52's `questions` array arm is the tolerant arm of a `.loose()` tool input. Rows 54, 55 (`cleanup-cli-answer`) are `z.array(z.json())` as the table decided | decision D5 |

### H8: `SmoketestRunId`

- ALREADY DONE. `scan` finds no `SmoketestRunId` and no `smoketestRunIdContract` in any package. `packages/shared/src/contracts/smoketest-run-id/` is an EMPTY folder.
  The three shared references the runbook feared are gone. The owner is `activeSmoketestRunContract.shape.runId` (`packages/orchestrator/src/contracts/active-smoketest-run/active-smoketest-run-contract.ts:15`,
  `z.uuid().brand<'ActiveSmoketestRunRunId'>()`), and orchestrator's `smoketest-run-result-contract.ts:14` already reuses it.
- Residue: server's two response-data contracts each mint their own uuid brand for the same id: `tooling-smoketest-state-response-data-contract.ts:17`
  (`ToolingSmoketestStateResponseDataActiveRunId`, inside an `active` object that is the same shape as `activeSmoketestRunContract`) and
  `tooling-smoketest-run-response-data-contract.ts:14` (`ToolingSmoketestRunResponseDataRunId`). Orchestrator does not export `activeSmoketestRunContract`.

## Plan

Path roots: every path below is repo-relative. `S` = `packages/shared/src`, `O` = `packages/orchestrator/src`, `HR` = `packages/hydration-recipes/src`,
`SF` = `packages/session-forensics/src`, `C` = `packages/cli/src`, `W` = `packages/ward/src`, `M` = `packages/mcp/src`, `SV` = `packages/server/src`.
"Move out" means plain `mv` to `tmp/deletions/F124-<step>/<original path>` after a `discover` grep proves no importer is left (EPIC rule 20); never `rm`.
Every batch reports per `agent-brief.md`. No batch builds.

### Decisions the operator makes first (recommendation in bold)

| # | Question | Options | Recommendation |
|---|---|---|---|
| D1 | H2: who owns `PieceId`? | (A) move `workPlanPieceContract` (contract, stub, test) to shared, `id` becomes the owner's `WorkPlanPieceId`, both shared fields and the orchestrator readers reuse `workPlanPieceContract.shape.id`; about 30 files, most of them one import line. (B) leave `PieceId` plain in shared and close H2 (like `ProcessId`: one id, no single owning object) | **A**, as the runbook and table 2.2 decided: it is the only way shared's two fields get an owner, and `move.cjs` makes the importer rewrite mechanical. B costs nothing and breaks no rule the five W10 rules scan today; choose it if the planner contract should stay out of shared. The plan below is written for A |
| D2 | H3: the owner's `id` is `min(1)`. Three of the twelve fields accept `''` today | (a) reuse the owner and accept `min(1)` everywhere; (b) keep those three as they are | **(a)**. Claude never writes an empty `tool_use_id`; the tests that feed `''` will say if one does. Re-parse check: the orchestrator normalize tests are the place it would show |
| D3 | H4: how much of table 2.4 to add | (i) the table as written: agent `toolUseId`, session `cwd` + `startedAt`, siege-instance manifest fields; (ii) only what a second contract reuses: session `cwd`, and siege-instance `baseUrl`/`apiUrl`/`home` | **(ii) for session only**: add `cwd`, skip `startedAt`, skip `agent.toolUseId` (nothing would reuse it), skip siege-run. Siege-instance `baseUrl`/`apiUrl`/`home` has three readers but they disagree on nullability (`nullable`, `optional`, `nullable`) and on `min(1)`; add it only if the operator wants the wrappers (`shape.baseUrl.nullable()`) and accepts the empty-string tightening in siegelense's manifest. The plan lists both |
| D4 | H5: rename `commentBatchResponse` and `toolResponse` for their folders and names | rename both / leave both | **Leave both**: the collision the rename answered no longer exists (evidence under H5). Rename `getQuestInput` (the collision is live). Also ask why R9 scans 0 with mcp's and shared's `getQuestInputContract` both declared |
| D5 | H7: rows 46, 47, 52, 54, 55, 69, 70 stay JSON | close them as `json` in the b15 table / force the typed target | **Close them as `json`.** Each has a reason in the code (published tool schema; emit-path crash; tolerant arm; `.length` only). Editing `items/b15-brand-migration.md`'s rows is the operator's, not an agent's |
| D6 | H8 residue: reuse `activeSmoketestRunContract` in server's two response-data contracts | do / leave | **Do** only as a cheap tail (2 files, batch `H8-1`), after `H7-A1b` has exported it; skipping it leaves two contracts minting a brand for an id orchestrator owns |
| D7 | H7 row 75: the usage contract and a malformed usage | strict numbers per key / each key `.optional()` with the whole `usage` optional | **Each key optional** (the transformer already defaults absent counts to 0 and its test names a "malformed usage" case): the agent runs `record-to-token-usage-transformer.test.ts` first and keeps every case green |

### Order and what runs side by side

1. Wave 0 (operator): D1 to D7.
2. Wave 1, all at once (disjoint files): `H2-1`, `H3-T1`, `H5A-1`, `H5B-1`, `H7-A1a`, `H7-A1b`, `H7-B1`, `H4-a` (if D3 keeps it).
3. Wave 2 (operator, alone): `SB`, the one edit of `packages/shared/src/contracts/contracts.ts`. Everything that imports the new shared contracts waits for it.
4. Wave 3, all at once (disjoint files): `H2-2`, `H2-3`, `H2-4`, `H2-5`, `H2-6`, `H2-7`, `H3-T2`, `H3-T4`, `H3-T5`, `H5A-2`, `H5A-3`, `H5A-4`, `H5A-5`, `H5B-2`, `H7-A2`, `H7-A3`, `H7-B2`, `H8-1`.
5. Wave 4: `H4-b` (after `H3-T4`: both edit `HR/contracts/subagent-fields/subagent-fields-contract.ts`), then the move-outs `H2-8`, `H5A-6`, `H5B-3`, then the conditional fix queues `H2-9` and `H3-T6` after the operator's `diag.cjs --full`.

Same-package batches in one wave have disjoint file lists (EPIC rule 9). Two cross-step file overlaps are sequenced above: `subagent-fields-contract.ts` (`H3-T4` then `H4-b`) and `packages/orchestrator/src/index.ts` (only `H7-A1b`, which also exports `activeSmoketestRunContract` for `H8-1`).

### H2 (option A)

| Batch | Files (create `+`, edit `~`) |
|---|---|
| `H2-1` | `+ S/contracts/work-plan-piece/work-plan-piece-contract.ts` (copy of the orchestrator file; `id` is a file-local `z.string().min(1).brand<'WorkPlanPieceId'>()` shared with `baselineFor`, the pattern `work-item-contract.ts:20` uses for `workItemId`); `+ S/contracts/work-plan-piece/work-plan-piece.stub.ts`; `+ S/contracts/work-plan-piece/work-plan-piece-contract.test.ts` |
| `SB` (part) | `~ S/contracts/contracts.ts` line 189: `piece-id/piece-id-contract` becomes `work-plan-piece/work-plan-piece-contract` |
| `H2-2` | `~ S/contracts/work-item/work-item-contract.ts` (`pieceId: workPlanPieceContract.shape.id.optional()`); `~ S/contracts/work-item/work-item-contract.test.ts`; `~ S/contracts/quest-projection/quest-projection-contract.ts`; `~ S/contracts/quest-projection/quest-projection-contract.test.ts` |
| `H2-3` | `~ O/contracts/work-plan-batch/work-plan-batch-contract.ts`; `~ O/contracts/work-plan-batch/work-plan-batch.stub.ts`; `~ O/contracts/quest-work-view/quest-work-view-contract.ts` (`pieceIdContract` at lines 114, 123, 253 and `workPlanPieceContract.shape.*` at 116, 281); `~ O/contracts/work-plan-validation-failure/work-plan-validation-failure-contract.ts` |
| `H2-4` | `~ O/contracts/minted-work-item/minted-work-item-contract.ts`; `~ O/transformers/next-action/next-action-transformer.ts` (type import, line 78); `~ O/transformers/piece-brief-payload/piece-brief-payload-transformer.ts` (type import, line 38) |
| `H2-5` | `~ O/contracts/work-plan-batch/work-plan-batch-contract.test.ts`; `~ O/contracts/work-plan/work-plan-contract.test.ts`; `~ O/transformers/step-outstanding-units/step-outstanding-units-transformer.test.ts`; `~ O/transformers/work-plan-to-text/work-plan-to-text-transformer.test.ts` (stub import to `@dungeonmaster/shared/contracts/work-plan-piece/work-plan-piece.stub`) |
| `H2-6` | `~ O/transformers/step-entry-batch/step-entry-batch-transformer.test.ts`; `~ O/transformers/next-action/next-action-transformer.test.ts`; `~ O/transformers/work-plan-validate/work-plan-validate-transformer.test.ts`; `~ O/transformers/piece-brief-payload/piece-brief-payload-transformer.test.ts` |
| `H2-7` | `~ O/brokers/quest/get-quest-work/quest-get-quest-work-broker.test.ts`; `~ O/brokers/quest/route-scope/quest-route-scope-broker.integration.test.ts`; `~ O/brokers/quest/route-scope/quest-route-scope-broker.test.ts`; `~ O/brokers/quest/get-work-plan/quest-get-work-plan-broker.test.ts` |
| `H2-8` (after `H2-2` to `H2-7` and the typecheck are green) | move out `O/contracts/work-plan-piece/work-plan-piece-contract.ts`, `work-plan-piece-contract.test.ts`, `work-plan-piece.stub.ts`; move out `S/contracts/piece-id/piece-id-contract.ts`, `piece-id-contract.test.ts`, `piece-id.stub.ts` |
| `H2-9` (conditional: only files `diag.cjs --full` shows red, from this measured list) | orchestrator: `O/brokers/quest/get-quest-work/quest-get-quest-work-broker.ts`, `O/brokers/quest/route-scope/quest-route-scope-broker.ts`, `O/brokers/quest/work-plan-write/quest-work-plan-write-broker.ts`, `O/transformers/work-plan-to-text/work-plan-to-text-transformer.ts`, `O/transformers/quest-projection-build/quest-projection-build-transformer.ts`, `O/contracts/minted-work-item/minted-work-item-contract.test.ts`, `O/contracts/work-plan-validation-failure/work-plan-validation-failure-contract.test.ts`, `O/contracts/work-plan-validation-failure/work-plan-validation-failure.stub.ts`; web (reads a `WorkItem.pieceId`): `packages/web/src/widgets/execution-panel/execution-panel-widget.tsx`, `packages/web/src/widgets/execution-panel/execution-panel-widget.test.tsx`, `packages/web/test/harnesses/quest/quest.harness.ts`, `packages/web/src/flows/quest-chat/execution-row-back-edge-badge.e2e.ts`, `packages/web/src/flows/quest-chat/execution-row-rework-readout.e2e.ts`. Batched at 4 per agent when called |

Also the operator edits `items/b15-brand-migration.md` row PieceId (owner path to `shared/src/contracts/work-plan-piece/work-plan-piece-contract.ts`, status `exists`) and `docs/quest-role-paths.md` only if its two `pieceId` lines name the old path. Checks: `lint,typecheck,unit` on shared and orchestrator; `integration` on orchestrator (route-scope); web `typecheck` if `H2-9` touches web.

The option-B plan is empty: close H2 and record PieceId beside ProcessId as a plain standalone id in the b15 table.

### H3

| Batch | Files |
|---|---|
| `H3-T1` | `+ S/contracts/tool-use/tool-use-contract.ts` (`toolUseContract`, type `ToolUse`; `id: z.string().min(1).brand<'ToolUseId'>()`, `name` brand `ToolUseName`, `input: z.json()`, `.brand<'ToolUse'>()`; the test and stub move with the new names); `+ S/contracts/tool-use/tool-use-contract.test.ts`; `+ S/contracts/tool-use/tool-use.stub.ts` (`ToolUseStub`) |
| `SB` (part) | `~ S/contracts/contracts.ts` line 369: `tool-use-block-param/tool-use-block-param-contract` becomes `tool-use/tool-use-contract` |
| `H3-T2` | `~ S/contracts/assistant-content-block-param/assistant-content-block-param-contract.ts`; `~ S/contracts/claude-queue-response/claude-queue-response.stub.ts`; `~ S/contracts/tool-result-block-param/tool-result-block-param-contract.ts` (`tool_use_id: toolUseContract.shape.id`); `~ S/contracts/chat-entry/chat-entry-contract.ts` (`toolUseId: toolUseContract.shape.id.optional()`) |
| `H3-T4` | `~ HR/contracts/recipe-transcript-line/recipe-transcript-line-contract.ts`; `~ HR/contracts/subagent-record/subagent-record-contract.ts`; `~ HR/contracts/subagent-fields/subagent-fields-contract.ts`; `~ SF/contracts/subagent-meta/subagent-meta-contract.ts` |
| `H3-T5` | `~ O/contracts/normalized-stream-line/normalized-stream-line-contract.ts` (three fields: lines 29, 94, 123); `~ O/contracts/normalized-stream-line-content-item/normalized-stream-line-content-item-contract.ts`; `~ O/contracts/chat-line-output/chat-line-output-contract.ts`; `~ O/contracts/task-prompts-from-content/task-prompts-from-content-contract.ts` |
| `H3-T3` (after `H3-T1`, `SB`) | move out `S/contracts/tool-use-block-param/tool-use-block-param-contract.ts`, `tool-use-block-param-contract.test.ts`, `tool-use-block-param.stub.ts`; then `~ packages/web/test/harnesses/session/session.harness.ts` (type `ToolUseBlockParam` to `ToolUse`, lines 36, 197, 740) |
| `H3-T6` (conditional, from `diag.cjs --full` and lint; measured candidates) | hydration-recipes: `HR/brokers/recipes/session-with-nested-subagent/recipes-session-with-nested-subagent-broker.ts`, `HR/brokers/subagent/query-route/subagent-query-route-broker.ts`, `HR/transformers/tool-use-id-from-parent-lines/tool-use-id-from-parent-lines-transformer.test.ts`, `HR/statics/seed-fixture/seed-fixture-statics.ts`; orchestrator: `O/brokers/chat/history-replay/chat-history-replay-broker.ts`, `O/transformers/chat-line-process/chat-line-process-transformer.ts`, `O/transformers/parse-user-stream-entry/parse-user-stream-entry-transformer.ts`, `O/transformers/task-tool-use-ids-from-content/task-tool-use-ids-from-content-transformer.ts`, `O/transformers/tool-use-ids-from-content/tool-use-ids-from-content-transformer.test.ts`; web: `packages/web/src/transformers/collect-subagent-chains/collect-subagent-chains-transformer.ts`, `packages/web/src/transformers/merge-tool-entries/merge-tool-entries-transformer.ts`, `packages/web/src/transformers/merge-descendant-subagent-entries/merge-descendant-subagent-entries-transformer.ts`, `packages/web/test/harnesses/sticky-header/sticky-header.harness.ts`, `packages/web/test/harnesses/subagent-duration/subagent-duration.harness.ts`. Four per agent when called |

`H3-T2`, `H3-T4`, `H3-T5` run side by side after `SB` (different packages, or disjoint files in shared). Lint EVERY touched package after the batch: R8 turns on for `toolUseId` the moment `H3-T1` lands. Checks: `lint,typecheck,unit` per package; `integration` on orchestrator and hydration-recipes; web `e2e` only if `H3-T6` edits a web runtime file (then the subagent grouping specs: `chat-streaming-subagent-grouping.e2e.ts`, `chat-replay-subagent-grouping.e2e.ts`).

### H4 (scope per D3)

| Batch | Files |
|---|---|
| `H4-a` (session, recommended) | `~ S/contracts/session/session-contract.ts` (add `cwd`: the same absolute-path check, brand `SessionCwd`); `~ S/contracts/session/session-contract.test.ts`; `~ S/contracts/session/session.stub.ts` |
| `H4-b` (after `H4-a`, `H3-T4`) | `~ S/contracts/quest-session/quest-session-contract.ts` (line 32); `~ HR/contracts/session-fields/session-fields-contract.ts` (line 33); `~ HR/contracts/session-record/session-record-contract.ts` (line 27); `~ HR/contracts/subagent-fields/subagent-fields-contract.ts` (line 46) |
| `H4-c` (siege-instance, only if D3 takes it) | `~ S/contracts/siege-instance/siege-instance-contract.ts` (add `baseUrl`, `apiUrl`, `home`); `~ S/contracts/siege-instance/siege-instance-contract.test.ts`; `~ S/contracts/siege-instance/siege-instance.stub.ts` |
| `H4-d` (after `H4-c`) | `~ packages/siegelense/src/contracts/instance-manifest/instance-manifest-contract.ts`; `~ O/contracts/lane-manifest-reading/lane-manifest-reading-contract.ts`; `~ O/contracts/quest-work-instance/quest-work-instance-contract.ts` |
| `H4-e` (agent `toolUseId`, only if D3 keeps the table whole; after `H3-T1`) | `~ S/contracts/agent/agent-contract.ts`; `~ S/contracts/agent/agent-contract.test.ts`; `~ S/contracts/agent/agent.stub.ts` |

Siege-run: no batch. `AgentStub({ id })` is the only whole-owner use in a consumer (`HR/transformers/transcript-task-tool-result-line/transcript-task-tool-result-line-transformer.test.ts:10`); every other consumer reads `.shape.id`, so an added field needs a stub default and no caller change. Checks: `lint,typecheck,unit`; integration on hydration-recipes and siegelense for `H4-b`, `H4-d`.

### H5

`packageJsonRaw` lift (`H5A`). The operator may instead run `node scrolls/brands-gateways-epic/phase34-scripts/b11-contract-merge/move.cjs --from=packages/cli/src/contracts/package-json-raw/package-json-raw-contract.ts --to=packages/shared/src/contracts/package-json-raw/package-json-raw-contract.ts` (then the ward copy) after `H5A-1` and `SB`; its diff must equal the files below. Record it under "Scripts used" if run.

| Batch | Files |
|---|---|
| `H5A-1` | `+ S/contracts/package-json-raw/package-json-raw-contract.ts` (`z.record(z.string(), z.json())`, exports `packageJsonRawContract` and `PackageJsonRaw`); `+ S/contracts/package-json-raw/package-json-raw-contract.test.ts`; `+ S/contracts/package-json-raw/package-json-raw.stub.ts` (`PackageJsonRawStub`, same signature as the cli and ward stubs) |
| `SB` (part) | `~ S/contracts/contracts.ts`: add `export * from './package-json-raw/package-json-raw-contract';` |
| `H5A-2` | `~ C/brokers/package/register/package-register-broker.ts`; `~ C/responders/cli/create-package/cli-create-package-responder.ts`; `~ C/responders/install/add-dev-deps/install-add-dev-deps-responder.ts`; `~ C/responders/install/setup-gateway/install-setup-gateway-responder.ts` |
| `H5A-3` | `~ C/transformers/gateway-workspaces-merge/gateway-workspaces-merge-transformer.ts`; `~ C/transformers/gateway-workspaces-merge/gateway-workspaces-merge-transformer.test.ts`; `~ C/transformers/root-package-json-register/root-package-json-register-transformer.ts`; `~ C/transformers/root-package-json-register/root-package-json-register-transformer.test.ts` |
| `H5A-4` | `~ C/brokers/package/register/package-register-broker.test.ts`; `~ C/responders/cli/create-package/cli-create-package-responder.test.ts` |
| `H5A-5` | `~ W/brokers/workspace/manifest-entries-verify/workspace-manifest-entries-verify-broker.ts`; `~ W/responders/install/write-scripts/install-write-scripts-responder.ts`; `~ W/transformers/package-json-declared-entries/package-json-declared-entries-transformer.ts`; `~ W/transformers/package-json-declared-entries/package-json-declared-entries-transformer.test.ts` |
| `H5A-6` (last) | move out `C/contracts/package-json-raw/package-json-raw-contract.ts`, `package-json-raw-contract.test.ts`, `package-json-raw.stub.ts`; move out `W/contracts/package-json-raw/package-json-raw-contract.ts`, `package-json-raw-contract.test.ts`, `package-json-raw.stub.ts` |

`GetQuestInput` rename (`H5B`), mcp only; the script is `b15-rename/rename.cjs --file=packages/mcp/src/contracts/get-quest-input/get-quest-input-contract.ts --from=getQuestInputContract --to=mcpGetQuestInputContract` for the const, and the type, brand text `'McpGetQuestInput'` and stub's type import by hand (a rename refuses when the text is in a brand string).

| Batch | Files |
|---|---|
| `H5B-1` | `+ M/contracts/mcp-get-quest-input/mcp-get-quest-input-contract.ts` (`mcpGetQuestInputContract`, type `McpGetQuestInput`, `.brand<'McpGetQuestInput'>()`); `+ M/contracts/mcp-get-quest-input/mcp-get-quest-input-contract.test.ts`; `+ M/contracts/mcp-get-quest-input/mcp-get-quest-input.stub.ts` |
| `H5B-2` | `~ M/flows/quest/quest-flow.ts` (import at line 20); `~ M/responders/quest/handle/get-quest-layer-responder.ts` (import at line 18) |
| `H5B-3` (last) | move out `M/contracts/get-quest-input/get-quest-input-contract.ts`, `get-quest-input-contract.test.ts`, `get-quest-input.stub.ts` |

If D4 says rename the other two: server `SV/contracts/comment-batch-response/` (contract, test, stub) plus its readers `SV/responders/quest/comment-batch/quest-comment-batch-responder.ts`, `quest-comment-batch-responder.proxy.ts`, `SV/contracts/responder-result/responder-result-contract.ts`, `SV/contracts/quest-comment-batch-response-data/quest-comment-batch-response-data-contract.ts`; hooks `packages/hooks/src/contracts/tool-response/` (contract, test, stub) plus `packages/hooks/src/contracts/post-tool-use-hook-data/post-tool-use-hook-data-contract.ts`. Not planned.

Checks: `lint,typecheck,unit` on shared, cli, ward, mcp; `integration` on cli (it runs the install scaffolding) and mcp (`quest-flow.integration.test.ts`); then `npm run build:clean` and `npm run check:consumer` once, because cli and ward install code changes (EPIC rule 13).

### H7

| Batch | Files |
|---|---|
| `H7-A1a` | `+ O/contracts/clarification-answer/clarification-answer-contract.ts` (`{ header, label }`, brands `ClarificationAnswerHeader`, `ClarificationAnswerLabel`, `.brand<'ClarificationAnswer'>()`); `+ O/contracts/clarification-answer/clarification-answer-contract.test.ts`; `+ O/contracts/clarification-answer/clarification-answer.stub.ts` |
| `H7-A1b` | `~ O/index.ts` (export `clarificationAnswerContract`, `clarificationQuestionContract` and their types, beside `nextStepContract` at line 49; also `activeSmoketestRunContract` for `H8-1`); `~ O/index.test.ts` (the pinned sorted export list, line 17 on) |
| `H7-A2` | `~ SV/contracts/quest-clarify-body/quest-clarify-body-contract.ts` (`answers: z.array(clarificationAnswerContract).min(1)`, `questions: z.array(clarificationQuestionContract)`); `~ SV/contracts/quest-clarify-body/quest-clarify-body-contract.test.ts`; `~ SV/contracts/quest-clarify-body/quest-clarify-body.stub.ts`; `~ SV/responders/quest/clarify/quest-clarify-responder.ts` (delete the two casts at lines 95-96 and the `ClarifyAdapterParams` alias at line 21) |
| `H7-A3` | `~ O/startup/start-orchestrator.ts` (`answers: ClarificationAnswer[]`, line 309); `~ O/flows/clarify-answer/clarify-answer-flow.ts` (line 25); `~ O/responders/clarify/answer/clarify-answer-responder.ts` (line 22); `~ O/transformers/clarification-answers-to-design-decisions/clarification-answers-to-design-decisions-transformer.ts` (line 18; its `.test.ts` with 18 references is the conditional fifth file) |
| `H7-B1` | `+ SF/contracts/transcript-record-usage/transcript-record-usage-contract.ts` (`input_tokens`, `output_tokens`, `cache_creation_input_tokens`, `cache_read_input_tokens`, `output_tokens_details.thinking_tokens`, brands derived owner + key, per D7); `+ SF/contracts/transcript-record-usage/transcript-record-usage-contract.test.ts`; `+ SF/contracts/transcript-record-usage/transcript-record-usage.stub.ts` |
| `H7-B2` (after `H7-B1`) | `~ SF/contracts/transcript-record/transcript-record-contract.ts` (line 30 to the new contract); `~ SF/transformers/record-to-token-usage/record-to-token-usage-transformer.ts` (lines 29-40: read the typed keys, keep the `?? 0` defaults); `~ SF/transformers/record-to-token-usage/record-to-token-usage-transformer.test.ts`; `~ SF/contracts/contracts.ts` (one barrel line) |

Rows 46, 47, 52, 54, 55, 69, 70 and the 11 gateway rows: no batch (D5; evidence under Current state). Checks: `lint,typecheck,unit` on orchestrator, server, session-forensics; `integration` on orchestrator (`start-orchestrator.integration.test.ts`), server (the clarify route) and session-forensics (`session-forensics-flow.integration.test.ts`); orchestrator's public API gains two exports, so `npm run check:published` after the next `build:clean`.

### H8

| Batch | Files |
|---|---|
| `H8-1` (optional, D6; after `H7-A1b`) | `~ SV/contracts/tooling-smoketest-state-response-data/tooling-smoketest-state-response-data-contract.ts` (`active.runId` and, if the shape matches, `active` itself reuse `activeSmoketestRunContract`); `~ SV/contracts/tooling-smoketest-run-response-data/tooling-smoketest-run-response-data-contract.ts` (`runId: activeSmoketestRunContract.shape.runId`) |

Nothing else: no batch for the shared references, because there are none. `packages/shared/src/contracts/smoketest-run-id/` is an empty folder, left standing (empty directories are not files; the operator may `mv` it to `tmp/deletions/F124-H8/`).

### Batch count

| Step | Batches (agent-sized) | Conditional or optional |
|---|---|---|
| H2 | 8 (`H2-1` to `H2-8`; `SB` is shared with the other steps) | `H2-9` (3 agents at four files) |
| H3 | 5 (`H3-T1`, `T2`, `T3`, `T4`, `T5`) | `H3-T6` (4 agents at four files) |
| H4 | 2 (`H4-a`, `H4-b`) | `H4-c`, `H4-d`, `H4-e` |
| H5 | 9 (`H5A-1` to `H5A-6`, `H5B-1` to `H5B-3`) | the two dropped renames (D4) |
| H7 | 6 (`H7-A1a`, `A1b`, `A2`, `A3`, `B1`, `B2`) | the 5th file in `H7-A3` |
| H8 | 0 | `H8-1` |
| Shared barrel | 1 (`SB`, three lines, operator or one agent) | |

## Done when

- [ ] Wave 0 decisions written into EPIC.md's Concessions table where they depart from a source doc (D1 B, D3 ii, D4 leave, D5 json are departures).
- [ ] H2 (option A): `scan` finds no `pieceIdContract` and no file under `packages/shared/src/contracts/piece-id/`; `workItemContract.shape.pieceId` and `questProjection` reuse `workPlanPieceContract.shape.id`.
- [ ] H3: `toolUseContract` exists in shared; every field in the twelve-row table reuses `toolUseContract.shape.id`; `scan` finds no `ToolUseBlockParam` and no folder `tool-use-block-param/`; R8 scans 0.
- [ ] H4: per D3.
- [ ] H5: `scan` finds one `packageJsonRawContract` (shared); no `getQuestInputContract` in mcp, only `mcpGetQuestInputContract`.
- [ ] H7: `questClarifyBodyContract` holds typed `answers` and `questions` with no cast in `quest-clarify-responder.ts`; `transcriptRecordContract.usage` is a typed contract.
- [ ] H8: decided (D6).
- [ ] `npm run ward -- --uncommitted` exits 0 (rules R2, R4, R7, R8, R9 included); `build:clean`, `check:consumer`, `check:published` green after H5 and H7.

## Traps

- **One barrel edit.** `packages/shared/src/contracts/contracts.ts` is touched by H2, H3 and H5. Three agents editing it in one wave clobber each other; `SB` owns it.
- **R8 turns on at H3-T1.** The moment `toolUseContract` exists, every `toolUseId` field that does not reuse it is a lint error. Land the retypes in the same gate.
- **A shared stub in a production barrel reaches web's bundle.** The moved `work-plan-piece.stub.ts` and `tool-use.stub.ts` are imported by path in tests only; never add them to a barrel.
- **`check:consumer` and `check:published` are owed** (H5 touches cli and ward install code; H7 adds orchestrator exports).
- **The scripts expect a standalone brand.** Do not run `b15-id-brands` for `PieceId` or `ToolUseId`; both are gone. `move.cjs` and `rename.cjs` still work.
- **A full `diag.cjs --full`, not plain mode,** before deciding the conditional batches: plain mode stops at syntax errors and under-reports.
- **Empty folders and orphan id stubs** are left standing and out of scope: `packages/shared/src/contracts/smoketest-run-id/`, `packages/siegelense/src/contracts/zod-issue-error/`, `packages/session-forensics/src/contracts/transcript-record-usage-key/`, and `agent-id`, `session-id`, `siege-instance-id`, `siege-run-id` (shared), `agent-id` (orchestrator) and `run-id` (siegelense, ward) folders that hold only a `.stub.ts` nothing imports. Report to the operator; removal is a move to `tmp/deletions/`.

## Concessions made while executing

None yet. Proposed at planning time, for the operator to confirm or refuse: D1 (owner moves to shared), D3 (session gets `cwd` only), D4 (two renames dropped), D5 (rows closed as `json`).
