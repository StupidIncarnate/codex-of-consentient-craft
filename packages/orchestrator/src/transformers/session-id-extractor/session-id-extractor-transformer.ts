/**
 * PURPOSE: Extracts sessionId from a normalized (camelCase) Claude stream-json line object
 *
 * USAGE:
 * sessionIdExtractorTransformer({ parsed: {sessionId:'abc-123'} });
 * // Returns SessionId if found, null otherwise
 */

import { sessionIdContract, type SessionId } from '@dungeonmaster/shared/contracts';

import { normalizedStreamLineContract } from '../../contracts/normalized-stream-line/normalized-stream-line-contract';

export const sessionIdExtractorTransformer = ({
  parsed,
}: {
  parsed: unknown;
}): SessionId | null => {
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
    const parseResult = sessionIdContract.safeParse(String(line.sessionId));
    if (parseResult.success) {
      return parseResult.data;
    }
  }

  return null;
};
