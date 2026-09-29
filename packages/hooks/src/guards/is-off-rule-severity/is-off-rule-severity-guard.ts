/**
 * PURPOSE: Tells whether an ESLint rule entry is switched off, in any of the forms a config takes
 * ('off', 0, or an array whose first element is one of those).
 *
 * USAGE:
 * isOffRuleSeverityGuard({ ruleValue: ['off', { a: 1 }] });
 * // Returns true
 */
export const isOffRuleSeverityGuard = ({ ruleValue }: { ruleValue?: unknown }): boolean => {
  const severity: unknown = Array.isArray(ruleValue) ? ruleValue[0] : ruleValue;
  return severity === 'off' || severity === 0;
};
