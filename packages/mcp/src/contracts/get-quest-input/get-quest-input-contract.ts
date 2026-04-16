/**
 * PURPOSE: Defines the MCP-tool input schema for the get-quest tool. Extends shared get-quest-input with an optional response format selector.
 *
 * USAGE:
 * const input: GetQuestInput = getQuestInputContract.parse({ questId: 'add-auth' });
 * // Returns validated GetQuestInput with questId and default format='text'
 */
import { getQuestInputContract as sharedGetQuestInputContract } from '@dungeonmaster/shared/contracts';
import { z } from 'zod';

export const getQuestInputContract = sharedGetQuestInputContract
  .unwrap()
  .extend({
    format: z
      .enum(['json', 'text'])
      .describe(
        'Output format. "text" returns a human-readable text display with flow graphs (default). "json" returns the quest as JSON.',
      )
      .default('text'),
  })
  .strict()
  .brand<'McpGetQuestInput'>();

export type GetQuestInput = z.infer<typeof getQuestInputContract>;
