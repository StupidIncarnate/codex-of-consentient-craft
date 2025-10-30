/**
 * PURPOSE: Type guard validating SessionStartHookData with hook_event_name check
 *
 * USAGE:
 * if (isSessionStartHookData({ data })) { console.log(data.session_id); }
 * // Returns true if data is valid SessionStartHookData with hook_event_name === 'SessionStart'
 */
import type { SessionStartHookData } from '../session-start-hook-data/session-start-hook-data';

/**
 * Type predicate that validates if data conforms to the SessionStartHookData interface.
 *
 * Checks for:
 * - Valid object with all required string fields
 * - hook_event_name must be exactly 'SessionStart'
 *
 * @param params - The parameters object
 * @param params.data - The data to validate
 * @returns True if the data is a valid SessionStartHookData object
 */
export const isSessionStartHookData = (params: {
  data: unknown;
}): params is { data: SessionStartHookData } => {
  const { data } = params;
  if (typeof data !== 'object' || data === null) {
    return false;
  }
  if (!('session_id' in data)) {
    return false;
  }
  const record = data as Record<string, unknown>;
  return (
    typeof record.session_id === 'string' &&
    typeof record.transcript_path === 'string' &&
    typeof record.cwd === 'string' &&
    record.hook_event_name === 'SessionStart'
  );
};
