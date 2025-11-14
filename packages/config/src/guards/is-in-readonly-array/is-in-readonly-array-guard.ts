/**
 * PURPOSE: Validates if a value exists in a readonly string array
 *
 * USAGE:
 * isInReadonlyArrayGuard({value: 'react', array: ALL_FRAMEWORKS});
 * // Returns true if value is in array, false otherwise
 */

export const isInReadonlyArrayGuard = ({
  value,
  array,
}: {
  value?: unknown;
  array?: readonly string[];
}): boolean => typeof value === 'string' && array?.includes(value) === true;
