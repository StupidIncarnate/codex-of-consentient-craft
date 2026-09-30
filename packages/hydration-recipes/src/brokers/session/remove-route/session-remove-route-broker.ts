/**
 * PURPOSE: The session ingredient's `remove` route — deletes one session's JSONL file.
 *
 * USAGE:
 * await sessionRemoveRouteBroker({ target, record: sessionRecord });
 * // Deletes <claudeHome>/.claude/projects/<encoded-cwd>/<sessionId>.jsonl
 */
import { rm } from '#gateway/node/fs__promises';

import type { DmTarget } from '../../../contracts/dm-target/dm-target-contract';

export const sessionRemoveRouteBroker = async ({
  record,
}: {
  target: DmTarget;
  record: Record<string, unknown>;
}): Promise<void> => {
  await rm(record.filePath);
};
