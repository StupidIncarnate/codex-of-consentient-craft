/**
 * PURPOSE: MCP-tool input schema for modify-quest. Derives from shared modifyQuestInputContract
 *          but omits server-managed fields (workItems, wardResults, designPort) so that MCP callers
 *          cannot mutate orchestration-internal state.
 *
 * USAGE:
 * const input: ModifyQuestInput = modifyQuestInputContract.parse({ questId: 'add-auth', contexts: [...] });
 * // Returns validated ModifyQuestInput with questId and optional arrays for upsert (no workItems/wardResults/designPort)
 */
import { modifyQuestInputContract as sharedModifyQuestInputContract } from '@dungeonmaster/shared/contracts';
import type { z } from 'zod';

export const modifyQuestInputContract = sharedModifyQuestInputContract
  .unwrap()
  .omit({
    workItems: true,
    wardResults: true,
    designPort: true,
  })
  .brand<'McpModifyQuestInput'>();

export type ModifyQuestInput = z.infer<typeof modifyQuestInputContract>;
