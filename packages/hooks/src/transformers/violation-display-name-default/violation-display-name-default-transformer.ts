/**
 * Provides a default human-friendly display name for a lint rule ID.
 *
 * Maps common rule IDs to descriptive names that hide technical details
 * and present violations in terms of their impact.
 *
 * @param ruleId - The ESLint rule ID
 * @returns A human-friendly display name for the rule
 */
export const violationDisplayNameDefaultTransformer = ({ ruleId }: { ruleId: string }): string => {
  const defaultDisplayNames: Record<string, string> = {
    '@typescript-eslint/no-explicit-any': 'Type Safety Violation',
    '@typescript-eslint/ban-ts-comment': 'Type Error Suppression',
    'eslint-comments/no-use': 'Code Quality Rule Bypass',
  };

  return defaultDisplayNames[ruleId] ?? 'Code Quality Issue';
};
