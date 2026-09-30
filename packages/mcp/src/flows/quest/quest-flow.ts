/**
 * PURPOSE: Returns ToolRegistration[] for quest-related MCP tools (get-quest, modify-quest, start-quest, get-quest-status, list-quests, list-guilds, get-quest-planning-notes, get-blight-checklist, create-quest, get-server-config, get-quest-summary, create-worktree, quest-work)
 *
 * USAGE:
 * const registrations = QuestFlow();
 * // Returns ToolRegistration objects that delegate to QuestHandleResponder
 */

import { toJSONSchema } from '#gateway/npm/zod';

import { createQuestInputContract } from '../../contracts/create-quest-input/create-quest-input-contract';
import { createWorktreeInputContract } from '../../contracts/create-worktree-input/create-worktree-input-contract';
import { getBlightChecklistInputContract } from '../../contracts/get-blight-checklist-input/get-blight-checklist-input-contract';
import { getQuestPlanningNotesInputContract } from '../../contracts/get-quest-planning-notes-input/get-quest-planning-notes-input-contract';
import { getQuestWorkInputContract } from '../../contracts/get-quest-work-input/get-quest-work-input-contract';
// The MCP-local get-quest contract, NOT the shared one: it adds `format`, which QuestHandleResponder
// parses. Generating the advertised schema from the shared contract left `format` unadvertised while
// the responder still read it, so a caller following an instruction to pass it sent a key the
// published schema forbids.
import { getQuestInputContract } from '../../contracts/get-quest-input/get-quest-input-contract';
import { getQuestStatusInputContract } from '../../contracts/get-quest-status-input/get-quest-status-input-contract';
import { getQuestSummaryInputContract } from '../../contracts/get-quest-summary-input/get-quest-summary-input-contract';
import { listQuestsInputContract } from '../../contracts/list-quests-input/list-quests-input-contract';
import { modifyQuestInputContract } from '@dungeonmaster/shared/contracts';
import { mcpQuestWorkInputContract } from '../../contracts/mcp-quest-work-input/mcp-quest-work-input-contract';
import { startQuestInputContract } from '../../contracts/start-quest-input/start-quest-input-contract';
import type { ToolRegistration } from '../../contracts/tool-registration/tool-registration-contract';
import { QuestHandleResponder } from '../../responders/quest/handle/quest-handle-responder';
import { toolRegistrationContract } from '../../contracts/tool-registration/tool-registration-contract';

// `reused: 'inline'` is zod v4's native replacement for the deprecated `zod-to-json-schema`
// package's `$refStrategy: 'none'` — both mean "never emit a $ref/$defs pair for a schema reused
// across fields, inline it at each occurrence instead." The npm package itself only produces a
// correct schema for a v3-built input (its own README, as of the v4 upgrade: "so long as you
// still provide v3-schemas") — fed a real v4 schema it silently returns an empty shell, which is
// exactly the MCP tool inputSchema every caller here needs populated.
const jsonSchemaOptions = { reused: 'inline' as const };
const getQuestSchema = toJSONSchema(getQuestInputContract, jsonSchemaOptions);
const modifyQuestSchema = toJSONSchema(modifyQuestInputContract, jsonSchemaOptions);
const startQuestSchema = toJSONSchema(startQuestInputContract, jsonSchemaOptions);
const getQuestStatusSchema = toJSONSchema(getQuestStatusInputContract, jsonSchemaOptions);
const listQuestsSchema = toJSONSchema(listQuestsInputContract, jsonSchemaOptions);
const emptySchema = { type: 'object', properties: {}, additionalProperties: false };
const getQuestPlanningNotesSchema = toJSONSchema(
  getQuestPlanningNotesInputContract,
  jsonSchemaOptions,
);
const getBlightChecklistSchema = toJSONSchema(getBlightChecklistInputContract, jsonSchemaOptions);
const createQuestSchema = toJSONSchema(createQuestInputContract, jsonSchemaOptions);
const getQuestSummarySchema = toJSONSchema(getQuestSummaryInputContract, jsonSchemaOptions);
const createWorktreeSchema = toJSONSchema(createWorktreeInputContract, jsonSchemaOptions);
const questWorkSchema = toJSONSchema(mcpQuestWorkInputContract, jsonSchemaOptions);
const getQuestWorkSchema = toJSONSchema(getQuestWorkInputContract, jsonSchemaOptions);

export const QuestFlow = (): ToolRegistration[] => [
  {
    ...toolRegistrationContract.parse({
      name: 'get-quest',
      description: 'Retrieves a quest by its ID',
      inputSchema: getQuestSchema,
    }),
    handler: async ({ args }) => QuestHandleResponder({ tool: 'get-quest', args }),
  },
  {
    ...toolRegistrationContract.parse({
      name: 'modify-quest',
      description: 'Modifies an existing quest using upsert semantics',
      inputSchema: modifyQuestSchema,
    }),
    handler: async ({ args }) => QuestHandleResponder({ tool: 'modify-quest', args }),
  },
  {
    ...toolRegistrationContract.parse({
      name: 'start-quest',
      description: 'Starts orchestration for a quest by its ID. Returns a process ID for tracking.',
      inputSchema: startQuestSchema,
    }),
    handler: async ({ args }) => QuestHandleResponder({ tool: 'start-quest', args }),
  },
  {
    ...toolRegistrationContract.parse({
      name: 'get-quest-status',
      description: 'Gets the current status of an orchestration process by its process ID.',
      inputSchema: getQuestStatusSchema,
    }),
    handler: async ({ args }) => QuestHandleResponder({ tool: 'get-quest-status', args }),
  },
  {
    ...toolRegistrationContract.parse({
      name: 'list-quests',
      description: 'Lists all quests in the .dungeonmaster-quests folder.',
      inputSchema: listQuestsSchema,
    }),
    handler: async ({ args }) => QuestHandleResponder({ tool: 'list-quests', args }),
  },
  {
    ...toolRegistrationContract.parse({
      name: 'list-guilds',
      description: 'Lists all registered guilds with their IDs, names, paths, and quest counts.',
      inputSchema: emptySchema,
    }),
    handler: async ({ args }) => QuestHandleResponder({ tool: 'list-guilds', args }),
  },
  {
    ...toolRegistrationContract.parse({
      name: 'get-quest-planning-notes',
      description:
        "Returns a quest's `planningNotes`: the `operationPlans` a planning sub-agent persisted, the per-unit `blightLedger` a reviewer writes, and the durable `questNotes` side channel. An operator calls this to read a plan back off the quest — a sub-agent returns a short pointer, never the plan body, so this is the only place the pieces themselves exist.",
      inputSchema: getQuestPlanningNotesSchema,
    }),
    handler: async ({ args }) => QuestHandleResponder({ tool: 'get-quest-planning-notes', args }),
  },
  {
    ...toolRegistrationContract.parse({
      name: 'get-blight-checklist',
      description:
        "Returns a quest's COMPLETE blight review surface, computed deterministically from a git diff: every changed file crossed with each applicable standards concern, paired with its per-unit disposition in quest.planningNotes.blightLedger — and which units still carry no disposition. The `scope` parameter chooses WHICH changes are measured — the uncommitted working tree, what is committed here but not yet pushed, the last commit alone, or the whole quest from its pinned baseRef. Those four are NOT interchangeable and answer four different questions: read `scope`'s own description for what each one measures, and pass the one YOUR prompt names. A quest with no pinned baseRef, or an empty diff, states that plainly rather than erroring.",
      inputSchema: getBlightChecklistSchema,
    }),
    handler: async ({ args }) => QuestHandleResponder({ tool: 'get-blight-checklist', args }),
  },
  {
    ...toolRegistrationContract.parse({
      name: 'create-quest',
      description:
        'Creates a new quest seeded with the supplied userRequest and returns { questId, guildSlug }. ChaosWhisperer at /dumpster-create startup calls this as its first action; the user never types a quest id, but the caller MUST pass the original user request text so it is captured on the quest from the moment of creation.',
      inputSchema: createQuestSchema,
    }),
    // `meta` carries `claudecode/toolUseId`, which identifies the calling session exactly.
    // Dropping it here silently degrades session resolution to a newest-mtime guess.
    handler: async ({ args, meta }) =>
      QuestHandleResponder({
        tool: 'create-quest',
        args,
        ...(meta !== undefined && { meta }),
      }),
  },
  {
    ...toolRegistrationContract.parse({
      name: 'get-server-config',
      description:
        'Returns the dungeonmaster server config { baseUrl, port } so slash commands can point the browser at the running server.',
      inputSchema: emptySchema,
    }),
    handler: async ({ args }) => QuestHandleResponder({ tool: 'get-server-config', args }),
  },
  {
    ...toolRegistrationContract.parse({
      name: 'get-quest-summary',
      description:
        "Returns what ACTUALLY happened on a quest, which `get-quest` and a status do not answer: per-flow, per-track coverage (`met` / `cant-meet` / `unmet` / `outstanding`, one row per track that measures a flow); every observable added AFTER the user approved the spec, with the role that added it; the DEBT list — every unit settled without proof (`cant-meet`) or still left open (`unmet`), each with its evidence, its `toSettle` action where one exists, and the work item that raised it; every `verifyByHuman` criterion no track's denominator can ever carry; and the durable `noteGroups`, grouped by kind with open questions first. A quest reaches `complete` when its operations ledger drains, not when every unit is marked `met` — a `cant-meet` settles a unit without proving it and an `unmet` leaves the work open, and neither one holds that ledger — so a complete quest can still carry real holes, real unapproved scope and real unanswered questions, and this is the only surface that shows them. Call it when picking up a quest someone else worked, before a review, or before deciding what is left to do.",
      inputSchema: getQuestSummarySchema,
    }),
    handler: async ({ args }) => QuestHandleResponder({ tool: 'get-quest-summary', args }),
  },
  {
    ...toolRegistrationContract.parse({
      name: 'create-worktree',
      description:
        "Creates an isolated git worktree at `worktrees/<name>` and returns its absolute path. This is the ONLY sanctioned way to get a worktree, and the tree it returns has four properties a hand-rolled `git worktree add` silently lacks: it sits under the repo's own `worktrees/`, its `node_modules` is mirrored so every command inside it resolves the worktree's OWN packages, its compiled output is seeded so ward, the hooks and the CLI can run there at all, and every link in it is audited to prove none resolves back into the main checkout. A worktree missing any of those looks completely normal until a run comes back green against code it never saw. IDEMPOTENT: asking twice for one name verifies and hands back the same tree rather than carving a second, which also makes this the call that REPAIRS a half-built one. Claude Code's own worktree command is blocked in this repo and names this tool.",
      inputSchema: createWorktreeSchema,
    }),
    handler: async ({ args }) => QuestHandleResponder({ tool: 'create-worktree', args }),
  },
  {
    ...toolRegistrationContract.parse({
      name: 'quest-work',
      description:
        "The single write surface every LLM step calls, across six payload kinds carried on `payload.kind`: `plan` (a planner's batches of pieces plus plannerMarks), `observations` (per-unit met/cant-meet/unmet marks with evidence, replacing this work item's own set), `amendment` (a whole replacement plan, never a patch, when the run reveals the plan is wrong), `outcome` (the declared word — done/unmet/empty/wall — and its reason, legal ONLY on a step holding no assigned units; a step holding units has its outcome DERIVED from its marks instead), `invalidation` (a siege fixer's flowId and reason, re-opening every unit on that flow — the bulk lever `reset-flow-signoffs` was), and `request` (a step this work item is blocked on and why — must be `mintableOnRequest: true` in your own family graph). Every refusal THROWS with a message naming exactly what to fix; nothing is persisted on a refusal, so fix what the message names and call again.",
      inputSchema: questWorkSchema,
    }),
    handler: async ({ args }) => QuestHandleResponder({ tool: 'quest-work', args }),
  },
  {
    ...toolRegistrationContract.parse({
      name: 'get-quest-work',
      description:
        "The ONE startup call every LLM step makes. Pass `workItemId` and you get EVERYTHING this session needs to start, in one shape: your family, your step and its role, your scope (the flow and packages this item covers, plus the operation item's own text), the units you were ASSIGNED and the ones your step is answerable for — each with its verbatim text, the surface to check it at, its graph anchor and whatever the record already says about it — your piece and its planner notes, the notes running sessions left, the mark that caused you to exist, your flow rendered, your walk paths, your uncommitted and committed paths, the failing ward result with its check types and paths, the carve log, your git context and your lane. No session runs git, reads a plan file or enumerates a flow for itself after this. Pass `operationItemId` instead and you get that item's whole PLAN as markdown — the batches in the order they will execute, each piece with the units it claims, and a coverage table naming every in-scope unit NO piece claims, which is the defect a planner most needs to see and the one a JSON plan cannot show. Never pass both: they answer different questions and the call is refused rather than resolved by precedence.",
      inputSchema: getQuestWorkSchema,
    }),
    handler: async ({ args }) => QuestHandleResponder({ tool: 'get-quest-work', args }),
  },
];
