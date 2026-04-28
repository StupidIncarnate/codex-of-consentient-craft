/**
 * PURPOSE: Reads a Claude session JSONL with brief retry-on-ENOENT to absorb the race
 * between subscribe-quest replay and the CLI's post-stdout JSONL flush. Subscribe-quest can
 * fire after live broadcasts have shipped but BEFORE the CLI finishes writing the JSONL —
 * without retry, replay ENOENTs and content is lost in BOTH directions (live missed
 * pre-subscribe, replay missed the unwritten file). Budget kept short so completed sessions
 * with truly missing JSONL fail fast instead of stalling subscribe.
 *
 * USAGE:
 * const lines = await chatReplayJsonlReadBroker({ filePath: jsonlPath });
 * // Returns lines once readable; throws on non-ENOENT errors or after the retry budget elapses.
 */

import type { AbsoluteFilePath, StreamJsonLine } from '@dungeonmaster/shared/contracts';

import { fsReadJsonlAdapter } from '../../../adapters/fs/read-jsonl/fs-read-jsonl-adapter';

const READ_RETRY_TOTAL_MS = 200;
const READ_RETRY_INTERVAL_MS = 20;

export const chatReplayJsonlReadBroker = async ({
  filePath,
  deadline,
}: {
  filePath: AbsoluteFilePath;
  deadline?: number;
}): Promise<StreamJsonLine[]> => {
  const effectiveDeadline = deadline ?? Date.now() + READ_RETRY_TOTAL_MS;
  try {
    return await fsReadJsonlAdapter({ filePath });
  } catch (err) {
    const isEnoent = err instanceof Error && err.message.includes('ENOENT');
    if (!isEnoent || Date.now() >= effectiveDeadline) {
      throw err;
    }
    await new Promise<void>((resolve) => {
      setTimeout(resolve, READ_RETRY_INTERVAL_MS);
    });
    return chatReplayJsonlReadBroker({ filePath, deadline: effectiveDeadline });
  }
};
