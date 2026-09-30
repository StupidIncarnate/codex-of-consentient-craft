/**
 * PURPOSE: Extracts sessionId from a normalized (camelCase) Claude stream-json line object
 *
 * USAGE:
 * sessionIdExtractorTransformer({ parsed: {sessionId:'abc-123'} });
 * // Returns SessionId if found, null otherwise
 */

import { sessionContract } from '@dungeonmaster/shared/contracts';

import { normalizedStreamLineContract } from '../../contracts/normalized-stream-line/normalized-stream-line-contract';
import type { Session } from '@dungeonmaster/shared/contracts';

export const sessionIdExtractorTransformer = ({
  parsed,
}: {
  parsed: unknown;
}): Session['id'] | null => {
  const lineParse = normalizedStreamLineContract.safeParse(parsed);
  if (!lineParse.success) {
    return null;
  }
  const line = lineParse.data;

  // Skip hook events — they carry a temporary sessionId that differs from the real one
  if (line.subtype === 'hook_started' || line.subtype === 'hook_response') {
    return null;
  }

  if (typeof line.sessionId === 'string') {
    const parseResult = sessionContract.shape.id.safeParse(String(line.sessionId));
    if (parseResult.success) {
      return parseResult.data;
    }
  }

  return null;
};
