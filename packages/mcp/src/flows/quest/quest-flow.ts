/**
 * PURPOSE: Returns ToolRegistration[] for quest-related MCP tools (get-quest, modify-quest, start-quest, get-quest-status, list-quests, list-guilds, get-quest-planning-notes, get-blight-checklist, create-quest, get-next-step, run-ward, run-riftcarver, get-server-config, get-quest-summary, create-worktree, quest-work)
 *
 * USAGE:
 * const registrations = QuestFlow();
 * // Returns ToolRegistration objects that delegate to QuestHandleResponder
 */

import { zodToJsonSchema } from 'zod-to-json-schema';

import { createQuestInputContract } from '../../contracts/create-quest-input/create-quest-input-contract';
import { createWorktreeInputContract } from '../../contracts/create-worktree-input/create-worktree-input-contract';
import { getBlightChecklistInputContract } from '../../contracts/get-blight-checklist-input/get-blight-checklist-input-contract';
import { getNextStepInputContract } from '../../contracts/get-next-step-input/get-next-step-input-contract';
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
import { runRiftcarverInputContract } from '../../contracts/run-riftcarver-input/run-riftcarver-input-contract';
import { questWorkInputContract } from '../../contracts/quest-work-input/quest-work-input-contract';
import { runWardInputContract } from '../../contracts/run-ward-input/run-ward-input-contract';
import { startQuestInputContract } from '../../contracts/start-quest-input/start-quest-input-contract';
import type { ToolRegistration } from '../../contracts/tool-registration/tool-registration-contract';
import { QuestHandleResponder } from '../../responders/quest/handle/quest-handle-responder';

const jsonSchemaOptions = { $refStrategy: 'none' as const };
const getQuestSchema = zodToJsonSchema(getQuestInputContract as never, jsonSchemaOptions);
const modifyQuestSchema = zodToJsonSchema(modifyQuestInputContract as never, jsonSchemaOptions);
const startQuestSchema = zodToJsonSchema(startQuestInputContract as never, jsonSchemaOptions);
const getQuestStatusSchema = zodToJsonSchema(
  getQuestStatusInputContract as never,
  jsonSchemaOptions,
);
const listQuestsSchema = zodToJsonSchema(listQuestsInputContract as never, jsonSchemaOptions);
const emptySchema = { type: 'object', properties: {}, additionalProperties: false };
const getQuestPlanningNotesSchema = zodToJsonSchema(
  getQuestPlanningNotesInputContract as never,
  jsonSchemaOptions,
);
const getBlightChecklistSchema = zodToJsonSchema(
  getBlightChecklistInputContract as never,
  jsonSchemaOptions,
);
const createQuestSchema = zodToJsonSchema(createQuestInputContract as never, jsonSchemaOptions);
const getNextStepSchema = zodToJsonSchema(getNextStepInputContract as never, jsonSchemaOptions);
const runWardSchema = zodToJsonSchema(runWardInputContract as never, jsonSchemaOptions);
const runRiftcarverSchema = zodToJsonSchema(runRiftcarverInputContract as never, jsonSchemaOptions);
const getQuestSummarySchema = zodToJsonSchema(
  getQuestSummaryInputContract as never,
  jsonSchemaOptions,
);
const createWorktreeSchema = zodToJsonSchema(
  createWorktreeInputContract as never,
  jsonSchemaOptions,
);
const questWorkSchema = zodToJsonSchema(questWorkInputContract as never, jsonSchemaOptions);
const getQuestWorkSchema = zodToJsonSchema(getQuestWorkInputContract as never, jsonSchemaOptions);

export const QuestFlow = (): ToolRegistration[] => [
  {
    name: 'get-quest' as never,
    description: 'Retrieves a quest by its ID' as never,
    inputSchema: getQuestSchema as never,
    handler: async ({ args }) => QuestHandleResponder({ tool: 'get-quest' as never, args }),
  },
  {
    name: 'modify-quest' as never,
    description: 'Modifies an existing quest using upsert semantics' as never,
    inputSchema: modifyQuestSchema as never,
    handler: async ({ args }) => QuestHandleResponder({ tool: 'modify-quest' as never, args }),
  },
  {
    name: 'start-quest' as never,
    description:
      'Starts orchestration for a quest by its ID. Returns a process ID for tracking.' as never,
    inputSchema: startQuestSchema as never,
    handler: async ({ args }) => QuestHandleResponder({ tool: 'start-quest' as never, args }),
  },
  {
    name: 'get-quest-status' as never,
    description: 'Gets the current status of an orchestration process by its process ID.' as never,
    inputSchema: getQuestStatusSchema as never,
    handler: async ({ args }) => QuestHandleResponder({ tool: 'get-quest-status' as never, args }),
  },
  {
    name: 'list-quests' as never,
    description: 'Lists all quests in the .dungeonmaster-quests folder.' as never,
    inputSchema: listQuestsSchema as never,
    handler: async ({ args }) => QuestHandleResponder({ tool: 'list-quests' as never, args }),
  },
  {
    name: 'list-guilds' as never,
    description:
      'Lists all registered guilds with their IDs, names, paths, and quest counts.' as never,
    inputSchema: emptySchema as never,
    handler: async ({ args }) => QuestHandleResponder({ tool: 'list-guilds' as never, args }),
  },
  {
    name: 'get-quest-planning-notes' as never,
    description:
      "Returns a quest's `planningNotes`: the `operationPlans` a planning sub-agent persisted, the per-unit `blightLedger` a reviewer writes, and the durable `questNotes` side channel. An operator calls this to read a plan back off the quest — a sub-agent returns a short pointer, never the plan body, so this is the only place the pieces themselves exist." as never,
    inputSchema: getQuestPlanningNotesSchema as never,
    handler: async ({ args }) =>
      QuestHandleResponder({ tool: 'get-quest-planning-notes' as never, args }),
  },
  {
    name: 'get-blight-checklist' as never,
    description:
      "Returns a quest's COMPLETE blight review surface, computed deterministically from a git diff: every changed file crossed with each applicable standards concern, paired with its per-unit disposition in quest.planningNotes.blightLedger — and which units still carry no disposition. The `scope` parameter chooses WHICH changes are measured — the uncommitted working tree, what is committed here but not yet pushed, the last commit alone, or the whole quest from its pinned baseRef. Those four are NOT interchangeable and answer four different questions: read `scope`'s own description for what each one measures, and pass the one YOUR prompt names. A quest with no pinned baseRef, or an empty diff, states that plainly rather than erroring." as never,
    inputSchema: getBlightChecklistSchema as never,
    handler: async ({ args }) =>
      QuestHandleResponder({ tool: 'get-blight-checklist' as never, args }),
  },
  {
    name: 'create-quest' as never,
    description:
      'Creates a new quest seeded with the supplied userRequest and returns { questId, guildSlug }. ChaosWhisperer at /dumpster-create startup calls this as its first action; the user never types a quest id, but the caller MUST pass the original user request text so it is captured on the quest from the moment of creation.' as never,
    inputSchema: createQuestSchema as never,
    // `meta` carries `claudecode/toolUseId`, which identifies the calling session exactly.
    // Dropping it here silently degrades session resolution to a newest-mtime guess.
    handler: async ({ args, meta }) =>
      QuestHandleResponder({
        tool: 'create-quest' as never,
        args,
        ...(meta !== undefined && { meta }),
      }),
  },
  {
    name: 'get-next-step' as never,
    description:
      'Returns the next dispatch instruction for /dumpster-launch: spawn-agents | run-ward | idle. Long-polls internally up to ~25s.' as never,
    inputSchema: getNextStepSchema as never,
    handler: async ({ args }) => QuestHandleResponder({ tool: 'get-next-step' as never, args }),
  },
  {
    name: 'run-ward' as never,
    description:
      'Runs `npm run ward` synchronously over the whole monorepo and persists the result onto the named work item. Blocks until ward exits.' as never,
    inputSchema: runWardSchema as never,
    handler: async ({ args }) => QuestHandleResponder({ tool: 'run-ward' as never, args }),
  },
  {
    name: 'run-riftcarver' as never,
    description:
      "Carves a quest its workspace: detects the base branch, creates the quest branch and git worktree, mirrors node_modules into it, and runs a scoped `ward run --only typecheck` to convergence — then persists the streamed log and applies the outcome to the ledger. Riftcarver is the FIRST item of every new quest's relay, so /dumpster-launch reaches it before any agent runs. It BLOCKS for minutes while the workspace is forged; AWAIT it and do not call get-next-step again until it returns. There is no mode — a carve has only one scope." as never,
    inputSchema: runRiftcarverSchema as never,
    handler: async ({ args }) => QuestHandleResponder({ tool: 'run-riftcarver' as never, args }),
  },
  {
    name: 'get-server-config' as never,
    description:
      'Returns the dungeonmaster server config { baseUrl, port } so slash commands can point the browser at the running server.' as never,
    inputSchema: emptySchema as never,
    handler: async ({ args }) => QuestHandleResponder({ tool: 'get-server-config' as never, args }),
  },
  {
    name: 'get-quest-summary' as never,
    description:
      'Returns what ACTUALLY happened on a quest, which `get-quest` and a status do not answer: per-flow, per-track sign-off coverage (confirmed / unconfirmable / outstanding); every observable added AFTER the user approved the spec, with the role that added it; every `unconfirmable` verdict with its evidence AND the question that would close it AND the work item that raised it; and the durable `questNotes` grouped by kind, open questions first. A quest reaches `complete` when its operations ledger drains, not when its three sign-off tracks (codeweaver, flowrider, siegemaster) finish — signing is a durable proof record, and `unconfirmable` signs a unit exactly as `confirmed` does, so a complete quest can still carry real holes, real unapproved scope and real unanswered questions, and this is the only surface that shows them. Call it when picking up a quest someone else worked, before a review, or before deciding what is left to do.' as never,
    inputSchema: getQuestSummarySchema as never,
    handler: async ({ args }) => QuestHandleResponder({ tool: 'get-quest-summary' as never, args }),
  },
  {
    name: 'create-worktree' as never,
    description:
      "Creates an isolated git worktree at `worktrees/<name>` and returns its absolute path. This is the ONLY sanctioned way to get a worktree, and the tree it returns has four properties a hand-rolled `git worktree add` silently lacks: it sits under the repo's own `worktrees/`, its `node_modules` is mirrored so every command inside it resolves the worktree's OWN packages, its compiled output is seeded so ward, the hooks and the CLI can run there at all, and every link in it is audited to prove none resolves back into the main checkout. A worktree missing any of those looks completely normal until a run comes back green against code it never saw. IDEMPOTENT: asking twice for one name verifies and hands back the same tree rather than carving a second, which also makes this the call that REPAIRS a half-built one. Claude Code's own worktree command is blocked in this repo and names this tool." as never,
    inputSchema: createWorktreeSchema as never,
    handler: async ({ args }) => QuestHandleResponder({ tool: 'create-worktree' as never, args }),
  },
  {
    name: 'quest-work' as never,
    description:
      "The single write surface every LLM step calls, across six payload kinds carried on `payload.kind`: `plan` (a planner's batches of pieces plus plannerMarks), `observations` (per-unit met/cant-meet/unmet marks with evidence, replacing this work item's own set), `amendment` (a whole replacement plan, never a patch, when the run reveals the plan is wrong), `outcome` (the declared word — done/unmet/empty/wall — and its reason, legal ONLY on a step holding no assigned units; a step holding units has its outcome DERIVED from its marks instead), `invalidation` (a siege fixer's flowId and reason, re-opening every unit on that flow — the bulk lever `reset-flow-signoffs` was), and `request` (a step this work item is blocked on and why — must be `mintableOnRequest: true` in your own family graph). Every refusal THROWS with a message naming exactly what to fix; nothing is persisted on a refusal, so fix what the message names and call again." as never,
    inputSchema: questWorkSchema as never,
    handler: async ({ args }) => QuestHandleResponder({ tool: 'quest-work' as never, args }),
  },
  {
    name: 'get-quest-work' as never,
    description:
      "The ONE startup call every LLM step makes. Pass `workItemId` and you get EVERYTHING this session needs to start, in one shape: your family, your step and its role, your scope (the flow and packages this item covers, plus the operation item's own text), the units you were ASSIGNED and the ones your step is answerable for — each with its verbatim text, the surface to check it at, its graph anchor and whatever the record already says about it — your piece and its planner notes, the notes running sessions left, the mark that caused you to exist, your flow rendered, your walk paths, your uncommitted and committed paths, the failing ward result with its check types and paths, the carve log, your git context and your lane. No session runs git, reads a plan file or enumerates a flow for itself after this. Pass `operationItemId` instead and you get that item's whole PLAN as markdown — the batches in the order they will execute, each piece with the units it claims, and a coverage table naming every in-scope unit NO piece claims, which is the defect a planner most needs to see and the one a JSON plan cannot show. Never pass both: they answer different questions and the call is refused rather than resolved by precedence." as never,
    inputSchema: getQuestWorkSchema as never,
    handler: async ({ args }) => QuestHandleResponder({ tool: 'get-quest-work' as never, args }),
  },
];
