import type { LiteralValue } from '../../contracts/literal-value/literal-value-contract';

export const isRegexLiteralGuard = ({ value }: { value?: LiteralValue }): boolean => {
  if (!value) {
    return false;
  }
  return value.startsWith('/') && (value.endsWith('/') || /\/[gimsuvy]*$/u.exec(value) !== null);
};
