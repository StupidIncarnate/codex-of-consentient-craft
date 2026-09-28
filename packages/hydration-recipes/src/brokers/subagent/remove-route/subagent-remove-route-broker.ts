/**
 * PURPOSE: The subagent ingredient's `remove` route — deletes one sub-agent's JSONL file.
 *
 * USAGE:
 * await subagentRemoveRouteBroker({ target, record: subagentRecord });
 * // Deletes <sessionsDir>/<sessionId>/subagents/agent-<agentId>.jsonl
 */
import { rm } from '#gateway/node/fs__promises';
import { adapterResultContract, filePathContract } from '@dungeonmaster/shared/contracts';
import type { AdapterResult } from '@dungeonmaster/shared/contracts';

import type { DmTarget } from '../../../contracts/dm-target/dm-target-contract';

export const subagentRemoveRouteBroker = async ({
  record,
}: {
  target: DmTarget;
  record: Record<string, unknown>;
}): Promise<AdapterResult> => {
  await rm(filePathContract.parse(record.filePath));

  return adapterResultContract.parse({ success: true });
};
