/**
 * PURPOSE: Defines the ordered list of all check types that ward can execute
 *
 * USAGE:
 * const checks = allCheckTypesStatics;
 * // Returns ['lint', 'typecheck', 'test']
 */

export const allCheckTypesStatics = ['lint', 'typecheck', 'test'] as const;
