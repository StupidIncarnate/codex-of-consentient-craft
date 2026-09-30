/**
 * PURPOSE: The subagent ingredient's `remove` route — deletes one sub-agent's JSONL file.
 *
 * USAGE:
 * await subagentRemoveRouteBroker({ target, record: subagentRecord });
 * // Deletes <sessionsDir>/<sessionId>/subagents/agent-<agentId>.jsonl
 */
import { rm } from '#gateway/node/fs__promises';

import type { DmTarget } from '../../../contracts/dm-target/dm-target-contract';

export const subagentRemoveRouteBroker = async ({
  record,
}: {
  target: DmTarget;
  record: Record<string, unknown>;
}): Promise<void> => {
  await rm(record.filePath);
};
