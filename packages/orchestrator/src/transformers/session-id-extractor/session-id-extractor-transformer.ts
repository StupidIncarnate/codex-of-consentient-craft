/**
 * PURPOSE: Extracts sessionId from a normalized (camelCase) Claude stream-json line object
 *
 * USAGE:
 * sessionIdExtractorTransformer({ parsed: {sessionId:'abc-123'} });
 * // Returns SessionId if found, null otherwise
 */

import { sessionIdContract, type SessionId } from '@dungeonmaster/shared/contracts';

export const sessionIdExtractorTransformer = ({
  parsed,
}: {
  parsed: unknown;
}): SessionId | null => {
  if (typeof parsed !== 'object' || parsed === null) {
    return null;
  }

  // Skip hook events — they carry a temporary sessionId that differs from the real one
  const subtype: unknown = Reflect.get(parsed, 'subtype');
  if (subtype === 'hook_started' || subtype === 'hook_response') {
    return null;
  }

  if ('sessionId' in parsed && typeof Reflect.get(parsed, 'sessionId') === 'string') {
    const sessionIdValue = Reflect.get(parsed, 'sessionId');
    const parseResult = sessionIdContract.safeParse(sessionIdValue);
    if (parseResult.success) {
      return parseResult.data;
    }
  }

  return null;
};
