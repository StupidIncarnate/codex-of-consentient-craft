/**
 * PURPOSE: Type guard validating HookData with required string properties
 *
 * USAGE:
 * if (isValidHookData({ data })) { console.log(data.hook_event_name); }
 * // Returns true if data has hook_event_name, session_id, transcript_path, cwd as strings
 */
import type { HookData } from '../hook-data/hook-data-contract';
import { hasStringProperty } from '../has-string-property/has-string-property';

/**
 * Type predicate that validates if data conforms to the HookData interface.
 *
 * Checks for the presence of required string properties:
 * - hook_event_name
 * - session_id
 * - transcript_path
 * - cwd
 *
 * @param params - The parameters object
 * @param params.data - The data to validate
 * @returns True if the data is a valid HookData object
 */
export const isValidHookData = (params: { data: unknown }): params is { data: HookData } => {
  const { data } = params;
  if (typeof data !== 'object' || data === null) {
    return false;
  }
  // Use type predicate to avoid unsafe assertion
  if (!('hook_event_name' in data)) {
    return false;
  }
  const obj = data as Record<string, unknown>;
  return (
    hasStringProperty({ obj, property: 'hook_event_name' }) &&
    hasStringProperty({ obj, property: 'session_id' }) &&
    hasStringProperty({ obj, property: 'transcript_path' }) &&
    hasStringProperty({ obj, property: 'cwd' })
  );
};
