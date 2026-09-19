/**
 * PURPOSE: The subagent ingredient's `remove` route — deletes one sub-agent's JSONL file.
 *
 * USAGE:
 * await subagentRemoveRouteBroker({ target, record: subagentRecord });
 * // Deletes <sessionsDir>/<sessionId>/subagents/agent-<agentId>.jsonl
 */
import { filePathContract } from '@dungeonmaster/shared/contracts';
import type { AdapterResult } from '@dungeonmaster/shared/contracts';

import { fsRmAdapter } from '../../../adapters/fs/rm/fs-rm-adapter';
import type { DmTarget } from '../../../contracts/dm-target/dm-target-contract';

export const subagentRemoveRouteBroker = async ({
  record,
}: {
  target: DmTarget;
  record: Record<string, unknown>;
}): Promise<AdapterResult> => fsRmAdapter({ filePath: filePathContract.parse(record.filePath) });
