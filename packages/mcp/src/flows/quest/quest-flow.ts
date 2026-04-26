/**
 * PURPOSE: Returns ToolRegistration[] for quest-related MCP tools (get-quest, modify-quest, start-quest, get-quest-status, list-quests, list-guilds, get-quest-planning-notes)
 *
 * USAGE:
 * const registrations = QuestFlow();
 * // Returns 7 ToolRegistration objects that delegate to QuestHandleResponder
 */

import { zodToJsonSchema } from 'zod-to-json-schema';

import { getQuestPlanningNotesInputContract } from '../../contracts/get-quest-planning-notes-input/get-quest-planning-notes-input-contract';
import { getQuestInputContract } from '@dungeonmaster/shared/contracts';
import { getQuestStatusInputContract } from '../../contracts/get-quest-status-input/get-quest-status-input-contract';
import { listQuestsInputContract } from '../../contracts/list-quests-input/list-quests-input-contract';
import { modifyQuestInputContract } from '@dungeonmaster/shared/contracts';
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
];
