/**
 * PURPOSE: The session ingredient's `remove` route — deletes one session's JSONL file.
 *
 * USAGE:
 * await sessionRemoveRouteBroker({ target, record: sessionRecord });
 * // Deletes <claudeHome>/.claude/projects/<encoded-cwd>/<sessionId>.jsonl
 */
import { filePathContract } from '@dungeonmaster/shared/contracts';
import type { AdapterResult } from '@dungeonmaster/shared/contracts';

import { fsRmAdapter } from '../../../adapters/fs/rm/fs-rm-adapter';
import type { DmTarget } from '../../../contracts/dm-target/dm-target-contract';

export const sessionRemoveRouteBroker = async ({
  record,
}: {
  target: DmTarget;
  record: Record<string, unknown>;
}): Promise<AdapterResult> => fsRmAdapter({ filePath: filePathContract.parse(record.filePath) });
