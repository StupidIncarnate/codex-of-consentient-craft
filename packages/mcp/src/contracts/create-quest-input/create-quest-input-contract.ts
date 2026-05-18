/**
 * PURPOSE: Defines the input schema for the MCP create-quest tool ChaosWhisperer calls at /dumpster-create startup
 *
 * USAGE:
 * createQuestInputContract.parse({});
 * // Returns: validated CreateQuestInput (no fields — quest id + title are server-assigned)
 */
import { z } from 'zod';

// ChaosWhisperer creates the quest anonymously — the user never types a quest id, and
// title/userRequest are filled in during the spec conversation via modify-quest.
// Empty payload is a valid call; .strict() rejects any other field to prevent drift.
export const createQuestInputContract = z.object({}).strict();

export type CreateQuestInput = z.infer<typeof createQuestInputContract>;
