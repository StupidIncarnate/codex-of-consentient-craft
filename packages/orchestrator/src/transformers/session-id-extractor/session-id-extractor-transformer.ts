/**
 * PURPOSE: Extracts session_id from a Claude stream-json output line
 *
 * USAGE:
 * sessionIdExtractorTransformer({ line: StreamJsonLineStub({ value: '{"session_id":"abc-123"}' }) });
 * // Returns SessionId if found, null otherwise
 */

import { sessionIdContract, type SessionId } from '@dungeonmaster/shared/contracts';
import type { StreamJsonLine } from '../../contracts/stream-json-line/stream-json-line-contract';

export const sessionIdExtractorTransformer = ({
  line,
}: {
  line: StreamJsonLine;
}): SessionId | null => {
  try {
    const parsed: unknown = JSON.parse(line);

    if (typeof parsed !== 'object' || parsed === null) {
      return null;
    }

    // Skip hook events — they carry a temporary session_id that differs from the real one
    const subtype: unknown = Reflect.get(parsed, 'subtype');
    if (subtype === 'hook_started' || subtype === 'hook_response') {
      return null;
    }

    if ('session_id' in parsed && typeof Reflect.get(parsed, 'session_id') === 'string') {
      const sessionIdValue = Reflect.get(parsed, 'session_id');
      const parseResult = sessionIdContract.safeParse(sessionIdValue);
      if (parseResult.success) {
        return parseResult.data;
      }
    }

    return null;
  } catch {
    return null;
  }
};
