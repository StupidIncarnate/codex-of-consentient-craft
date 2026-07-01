/**
 * PURPOSE: Defines a branded string type for the `prompt` Claude CLI passes to a Task/Agent
 * tool_use — written verbatim as the first user-text line of the spawned sub-agent's JSONL, so it
 * is the byte-equal pairing key used to correlate an in-flight sub-agent file to its spawning Task.
 *
 * USAGE:
 * taskAgentToolPromptContract.parse('Implement the auth slice');
 * // Returns branded TaskAgentToolPrompt
 */

import { z } from 'zod';

export const taskAgentToolPromptContract = z.string().min(1).brand<'TaskAgentToolPrompt'>();

export type TaskAgentToolPrompt = z.infer<typeof taskAgentToolPromptContract>;
