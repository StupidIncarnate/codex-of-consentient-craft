/**
 * Provides a default instructional message for a lint rule violation.
 *
 * Maps common rule IDs to detailed messages that explain why the rule exists
 * and what action should be taken.
 *
 * @param ruleId - The ESLint rule ID
 * @returns An instructional message for the rule violation
 */
export const violationRuleMessageDefaultTransformer = ({ ruleId }: { ruleId: string }): string => {
  const defaultMessages: Record<string, string> = {
    '@typescript-eslint/no-explicit-any':
      'Using type "any" violates TypeScript\'s type safety rules. Go explore types for this project and use a known or make a new type to use.',
    '@typescript-eslint/ban-ts-comment':
      'TypeScript error suppression comments (@ts-ignore, @ts-expect-error) cannot be used. Explore root cause and fix the underlying issue.',
    'eslint-comments/no-use':
      'ESLint disable comments should not be used. Explore root cause and fix the underlying issue',
  };

  return defaultMessages[ruleId] ?? 'This rule violation should be fixed to maintain code quality.';
};
