/**
 * PURPOSE: Disk-fallback signal extractor — reads a Claude session JSONL file and returns the LAST signal-back tool_use found, or null
 *
 * USAGE:
 * const signal = await signalFromSessionJsonlBroker({
 *   guildPath: AbsoluteFilePathStub({ value: '/home/user/repo' }),
 *   sessionId: SessionIdStub({ value: 'abc-123' }),
 * });
 * // Returns the last StreamSignal found in `~/.claude/projects/<encoded-cwd>/<sessionId>.jsonl`,
 * // or null if the file does not exist / has no signal-back lines.
 *
 * WHEN-TO-USE: After a Claude spawn resolves with `signal: null` but a `sessionId` exists,
 * to recover the agent's signal from the on-disk session JSONL when the live stream parser missed it.
 */

import { readNonEmptyLines } from '#gateway/node/fs__promises';
import { isFsError } from '#gateway/node/fs';
import {
  claudeLineNormalizeBroker,
  locationsClaudeSessionFilePathFindBroker,
} from '@dungeonmaster/shared/brokers';
import type { AbsoluteFilePath, SessionId } from '@dungeonmaster/shared/contracts';

import type { StreamSignal } from '../../../contracts/stream-signal/stream-signal-contract';
import { streamJsonLinesFromRawTransformer } from '../../../transformers/stream-json-lines-from-raw/stream-json-lines-from-raw-transformer';
import { signalFromStreamTransformer } from '../../../transformers/signal-from-stream/signal-from-stream-transformer';

export const signalFromSessionJsonlBroker = async ({
  guildPath,
  sessionId,
}: {
  guildPath: AbsoluteFilePath;
  sessionId: SessionId;
}): Promise<StreamSignal | null> => {
  const filePath = locationsClaudeSessionFilePathFindBroker({ guildPath, sessionId });

  const lines = await readNonEmptyLines(filePath)
    .then((rawLines) => streamJsonLinesFromRawTransformer({ rawLines }))
    .catch((error: unknown) => {
      if (isFsError({ error, code: 'ENOENT' })) {
        return null;
      }
      throw error;
    });

  if (lines === null) {
    return null;
  }

  let lastSignal: StreamSignal | null = null;
  for (const rawLine of lines) {
    const parsed = claudeLineNormalizeBroker({ rawLine });
    if (parsed === null) {
      continue;
    }
    const signal = signalFromStreamTransformer({ parsed });
    if (signal !== null) {
      lastSignal = signal;
    }
  }

  return lastSignal;
};
