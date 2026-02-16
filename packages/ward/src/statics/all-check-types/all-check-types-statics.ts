/**
 * PURPOSE: Defines the ordered list of all check types that ward can execute
 *
 * USAGE:
 * const checks = allCheckTypesStatics;
 * // Returns ['lint', 'typecheck', 'test', 'e2e']
 */

export const allCheckTypesStatics = ['lint', 'typecheck', 'test', 'e2e'] as const;
