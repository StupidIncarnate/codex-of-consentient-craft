/**
 * PURPOSE: Checks if a literal value is a regex pattern by examining its format.
 *
 * USAGE:
 * const isRegex = isRegexLiteralGuard({ value: '/pattern/gi' });
 * // Returns: boolean (true if value is a regex literal like /pattern/flags)
 */
import type { LiteralValue } from '../../contracts/literal-value/literal-value-contract';

export const isRegexLiteralGuard = ({ value }: { value?: LiteralValue }): boolean => {
  if (!value) {
    return false;
  }
  return value.startsWith('/') && (value.endsWith('/') || /\/[gimsuvy]*$/u.exec(value) !== null);
};
