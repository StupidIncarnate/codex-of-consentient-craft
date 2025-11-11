/**
 * PURPOSE: Type guard validating HookData with required string properties
 *
 * USAGE:
 * if (isValidHookDataContract({ data })) { console.log(data.hook_event_name); }
 * // Returns true if data has hook_event_name, session_id, transcript_path, cwd as strings
 */
import { hasStringPropertyContract } from '../has-string-property/has-string-property-contract';

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
export const isValidHookDataContract = ({ data }: { data: unknown }): boolean => {
  if (typeof data !== 'object' || data === null) {
    return false;
  }
  // Use type predicate to avoid unsafe assertion
  if (!('hook_event_name' in data)) {
    return false;
  }
  const obj = data as Record<PropertyKey, unknown>;
  return (
    hasStringPropertyContract({ obj, property: 'hook_event_name' }) &&
    hasStringPropertyContract({ obj, property: 'session_id' }) &&
    hasStringPropertyContract({ obj, property: 'transcript_path' }) &&
    hasStringPropertyContract({ obj, property: 'cwd' })
  );
};
