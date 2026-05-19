/**
 * PURPOSE: Returns ToolRegistration[] for quest-related MCP tools (get-quest, modify-quest, start-quest, get-quest-status, list-quests, list-guilds, get-quest-planning-notes, create-quest, get-next-step, run-ward, get-server-config)
 *
 * USAGE:
 * const registrations = QuestFlow();
 * // Returns 11 ToolRegistration objects that delegate to QuestHandleResponder
 */

import { zodToJsonSchema } from 'zod-to-json-schema';

import { createQuestInputContract } from '../../contracts/create-quest-input/create-quest-input-contract';
import { getNextStepInputContract } from '../../contracts/get-next-step-input/get-next-step-input-contract';
import { getQuestPlanningNotesInputContract } from '../../contracts/get-quest-planning-notes-input/get-quest-planning-notes-input-contract';
import { getQuestInputContract } from '@dungeonmaster/shared/contracts';
import { getQuestStatusInputContract } from '../../contracts/get-quest-status-input/get-quest-status-input-contract';
import { listQuestsInputContract } from '../../contracts/list-quests-input/list-quests-input-contract';
import { modifyQuestInputContract } from '@dungeonmaster/shared/contracts';
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
const createQuestSchema = zodToJsonSchema(createQuestInputContract as never, jsonSchemaOptions);
const getNextStepSchema = zodToJsonSchema(getNextStepInputContract as never, jsonSchemaOptions);
const runWardSchema = zodToJsonSchema(runWardInputContract as never, jsonSchemaOptions);

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
      "Returns PathSeeker's phased planningNotes for a quest (scope classification, surface reports, synthesis, walk findings, review report). Used by PathSeeker on resume to re-read already-committed phase artifacts." as never,
    inputSchema: getQuestPlanningNotesSchema as never,
    handler: async ({ args }) =>
      QuestHandleResponder({ tool: 'get-quest-planning-notes' as never, args }),
  },
  {
    name: 'create-quest' as never,
    description:
      'Creates a new quest seeded with the supplied userRequest and returns { questId, guildSlug }. ChaosWhisperer at /dumpster-create startup calls this as its first action; the user never types a quest id, but the caller MUST pass the original user request text so it is captured on the quest from the moment of creation.' as never,
    inputSchema: createQuestSchema as never,
    handler: async ({ args }) => QuestHandleResponder({ tool: 'create-quest' as never, args }),
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
    name: 'get-server-config' as never,
    description:
      'Returns the dungeonmaster server config { baseUrl, port } so slash commands can point the browser at the running server.' as never,
    inputSchema: emptySchema as never,
    handler: async ({ args }) => QuestHandleResponder({ tool: 'get-server-config' as never, args }),
  },
];
