/**
 * PURPOSE: Returns ToolRegistration[] for quest-related MCP tools (get-quest, modify-quest, start-quest, get-quest-status, list-quests, list-guilds, get-quest-planning-notes, get-qa-checklist, get-blight-checklist, create-quest, get-next-step, run-ward, run-riftcarver, get-server-config, reset-flow-signoffs, get-quest-summary)
 *
 * USAGE:
 * const registrations = QuestFlow();
 * // Returns 16 ToolRegistration objects that delegate to QuestHandleResponder
 */

import { zodToJsonSchema } from 'zod-to-json-schema';

import { createQuestInputContract } from '../../contracts/create-quest-input/create-quest-input-contract';
import { getBlightChecklistInputContract } from '../../contracts/get-blight-checklist-input/get-blight-checklist-input-contract';
import { getNextStepInputContract } from '../../contracts/get-next-step-input/get-next-step-input-contract';
import { getQaChecklistInputContract } from '../../contracts/get-qa-checklist-input/get-qa-checklist-input-contract';
import { getQuestPlanningNotesInputContract } from '../../contracts/get-quest-planning-notes-input/get-quest-planning-notes-input-contract';
// The MCP-local get-quest contract, NOT the shared one: it adds `format`, which QuestHandleResponder
// parses. Generating the advertised schema from the shared contract left `format` unadvertised while
// the responder still read it, so a caller following an instruction to pass it sent a key the
// published schema forbids.
import { getQuestInputContract } from '../../contracts/get-quest-input/get-quest-input-contract';
import { getQuestStatusInputContract } from '../../contracts/get-quest-status-input/get-quest-status-input-contract';
import { getQuestSummaryInputContract } from '../../contracts/get-quest-summary-input/get-quest-summary-input-contract';
import { listQuestsInputContract } from '../../contracts/list-quests-input/list-quests-input-contract';
import { modifyQuestInputContract } from '@dungeonmaster/shared/contracts';
import { resetFlowSignoffsInputContract } from '../../contracts/reset-flow-signoffs-input/reset-flow-signoffs-input-contract';
import { runRiftcarverInputContract } from '../../contracts/run-riftcarver-input/run-riftcarver-input-contract';
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
const getQaChecklistSchema = zodToJsonSchema(
  getQaChecklistInputContract as never,
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
const resetFlowSignoffsSchema = zodToJsonSchema(
  resetFlowSignoffsInputContract as never,
  jsonSchemaOptions,
);
const getQuestSummarySchema = zodToJsonSchema(
  getQuestSummaryInputContract as never,
  jsonSchemaOptions,
);

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
      "Returns a quest's `planningNotes`: the `operationPlans` a planner-minion persisted, the per-unit `blightLedger` a reviewer-minion writes, and the durable `questNotes` side channel. An operation orchestrator calls this to read its round's plan back off the quest — the planner returns a 3-5 line pointer, never the plan body, so this is the only place the pieces themselves exist." as never,
    inputSchema: getQuestPlanningNotesSchema as never,
    handler: async ({ args }) =>
      QuestHandleResponder({ tool: 'get-quest-planning-notes' as never, args }),
  },
  {
    name: 'get-qa-checklist' as never,
    description:
      "Returns a quest's COMPLETE QA surface, enumerated deterministically from its flow graphs: every terminal, every labelled decision branch, every observable with its verbatim text and the surface to check it at, every off-map probe family, plus the walk paths — and which units are still outstanding. Flowrider, Groundstomper and Siegemaster call this instead of reading the spec and enumerating by hand. Pass `track` ('flowrider' | 'groundstomper' | 'siegemaster') — the ROLE you were dispatched as, not the sign-off field you write — and REMAINING counts the units in YOUR denominator, which is exactly what the signal-back completion gate refuses `done` on. Flowrider and Groundstomper both write flowriderSignoff but are measured over DISJOINT package kinds, so the other's name returns the complement of your work; both also narrow to the quest's runtime flows, the only set they are measured over. Pass `packageNames` too when your operation item declares any, or you read a whole-quest remainder while your own gate clears at zero." as never,
    inputSchema: getQaChecklistSchema as never,
    handler: async ({ args }) => QuestHandleResponder({ tool: 'get-qa-checklist' as never, args }),
  },
  {
    name: 'get-blight-checklist' as never,
    description:
      "Returns a quest's COMPLETE blight review surface, computed deterministically from the git diff against the quest's pinned baseRef: every changed file paired with its per-unit disposition in quest.planningNotes.blightLedger — and which units still carry no disposition. A reviewer-minion calls this instead of re-deriving the diff by hand. A quest with no pinned baseRef, or an empty diff, states that plainly rather than erroring." as never,
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
      'Runs `npm run ward` synchronously in changed or full mode and persists the result onto the named work item. Blocks until ward exits.' as never,
    inputSchema: runWardSchema as never,
    handler: async ({ args }) => QuestHandleResponder({ tool: 'run-ward' as never, args }),
  },
  {
    name: 'run-riftcarver' as never,
    description:
      "Carves a quest its workspace: detects the base branch, creates the quest branch and git worktree, mirrors node_modules into it, and runs the preflight build to convergence — then persists the streamed log and applies the outcome to the ledger. Riftcarver is the FIRST item of every new quest's relay, so /dumpster-launch reaches it before any agent runs. It BLOCKS for minutes while the workspace is forged; AWAIT it and do not call get-next-step again until it returns. There is no mode — a carve has only one scope." as never,
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
    name: 'reset-flow-signoffs' as never,
    description:
      "Clears Siegemaster's walk sign-offs across ONE flow so the walk can be redone honestly: every observable, node, edge and off-map probe family on that flow loses its `siegemasterSignoff`. Flowrider's track is never touched. Call this after fixing a defect the walk exposed — the sign-offs already written measured a system that has changed underneath them. The flow must be declared by the calling work item's operation item, and a `walk-reset` note carrying your reason and the cleared count is appended to quest.planningNotes.questNotes." as never,
    inputSchema: resetFlowSignoffsSchema as never,
    handler: async ({ args }) =>
      QuestHandleResponder({ tool: 'reset-flow-signoffs' as never, args }),
  },
  {
    name: 'get-quest-summary' as never,
    description:
      'Returns what ACTUALLY happened on a quest, which `get-quest` and a status do not answer: per-flow, per-track sign-off coverage (confirmed / unconfirmable / outstanding); every observable added AFTER the user approved the spec, with the role that added it; every `unconfirmable` verdict with its evidence AND the question that would close it AND the work item that raised it; and the durable `questNotes` grouped by kind, open questions first. A quest reaches `complete` when both tracks have SIGNED every unit — and `unconfirmable` signs a unit exactly as `confirmed` does — so a green quest can carry real holes, real unapproved scope and real unanswered questions, and this is the only surface that shows them. Call it when picking up a quest someone else worked, before a review, or before deciding what is left to do.' as never,
    inputSchema: getQuestSummarySchema as never,
    handler: async ({ args }) => QuestHandleResponder({ tool: 'get-quest-summary' as never, args }),
  },
];
