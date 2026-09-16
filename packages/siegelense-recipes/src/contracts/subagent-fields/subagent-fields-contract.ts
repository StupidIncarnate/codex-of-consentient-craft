/**
 * PURPOSE: What a caller may supply to make a sub-agent transcript beside a session — its own
 * identity, the Task tool_use it answers, the lines to write, whether its parent session's
 * completion line should carry it yet, and the two link fields (`sessionId`, `cwd`) that place it
 * under its parent session and guild. Reach for this over its sibling, `subagentRecordContract`, on
 * a route's INPUT side: nothing in this repo mints an `agentId` or a `toolUseId` either — the caller
 * invents both, exactly as the real correlation the orchestrator reads depends on — so `fields` and
 * `record` again differ only in what the `write` route derives afterward (`filePath`, `lineCount`).
 * `taskDescription` and `taskPrompt` have no reachable contract: `@dungeonmaster/orchestrator`
 * defines `taskAgentToolPromptContract` for the identical prompt concept but does not export it from
 * its public barrel, so this file brands its own two local schemas rather than reaching past a
 * package boundary for an internal type.
 *
 * USAGE:
 * subagentFieldsContract.parse({
 *   agentId: 'seed-agent-1',
 *   toolUseId: 'toolu_seed1',
 *   taskDescription: 'Seeded task 1',
 *   taskPrompt: 'Research the auth system',
 *   lines: ['{"type":"init","session_id":"abc-123"}'],
 *   completed: true,
 *   sessionId: 'seed-session-1',
 *   cwd: '/tmp/guilds-under-test/guild-1',
 * });
 * // Returns SubagentFields
 */
import { z } from 'zod';

import {
  absoluteFilePathContract,
  agentIdContract,
  sessionIdContract,
  streamJsonLineContract,
} from '@dungeonmaster/shared/contracts';

import { toolUseIdContract } from '../tool-use-id/tool-use-id-contract';

const taskDescriptionContract = z.string().min(1).brand<'TaskDescription'>();
const taskPromptContract = z.string().min(1).brand<'TaskPrompt'>();

export type TaskDescription = z.infer<typeof taskDescriptionContract>;
export type TaskPrompt = z.infer<typeof taskPromptContract>;

export const subagentFieldsContract = z.object({
  agentId: agentIdContract,
  toolUseId: toolUseIdContract,
  taskDescription: taskDescriptionContract,
  taskPrompt: taskPromptContract,
  lines: z.array(streamJsonLineContract),
  completed: z.boolean(),
  sessionId: sessionIdContract,
  cwd: absoluteFilePathContract,
});

export type SubagentFields = z.infer<typeof subagentFieldsContract>;
