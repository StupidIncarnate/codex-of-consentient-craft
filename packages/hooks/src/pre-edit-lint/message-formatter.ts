import type { ViolationCount, PreEditLintConfig } from './types';

export const MessageFormatter = {
  formatViolationMessage: ({
    violations,
    config,
    hookData,
  }: {
    violations: ViolationCount[];
    config: PreEditLintConfig;
    hookData: unknown;
  }): string => {
    const lines = ['🛑 New code quality violations detected:'];

    for (const violation of violations) {
      const count = violation.count === 1 ? '1 violation' : `${violation.count} violations`;

      // Check if there's a custom message for this rule
      const customMessage = config.messages?.[violation.ruleId];

      if (customMessage) {
        let message: string;

        if (typeof customMessage === 'function') {
          try {
            message = customMessage(hookData);
          } catch (error) {
            // If custom message function fails, fall back to default
            message = `Custom message function failed: ${error instanceof Error ? error.message : String(error)}`;
          }
        } else {
          message = customMessage;
        }

        lines.push(`  ❌ ${violation.ruleId}: ${count}`);
        lines.push(`     ${message}`);
      } else {
        // Use default message
        lines.push(`  ❌ ${violation.ruleId}: ${count}`);
        lines.push(`     ${MessageFormatter.getDefaultRuleMessage({ ruleId: violation.ruleId })}`);
      }
    }

    lines.push('');
    lines.push('These rules help maintain code quality and safety. Please fix the violations.');

    return lines.join('\n');
  },

  getDefaultRuleMessage: ({ ruleId }: { ruleId: string }): string => {
    const defaultMessages: Record<string, string> = {
      '@typescript-eslint/no-explicit-any':
        'Using "any" type defeats TypeScript\'s type safety benefits.',
      '@typescript-eslint/ban-ts-comment':
        'TypeScript error suppression comments (@ts-ignore, @ts-expect-error) should be avoided.',
      'eslint-comments/no-use':
        'ESLint disable comments should not be used. Fix the underlying issue instead.',
      'no-console': 'Console statements should not be committed to production code.',
      'no-debugger': 'Debugger statements should not be committed to production code.',
      'no-unused-vars': 'Unused variables should be removed to keep code clean.',
      '@typescript-eslint/no-unused-vars': 'Unused variables should be removed to keep code clean.',
    };

    return (
      defaultMessages[ruleId] || 'This rule violation should be fixed to maintain code quality.'
    );
  },

  validateMessageFunction: ({
    messageFunction,
    hookData,
  }: {
    messageFunction: (hookData: unknown) => string;
    hookData: unknown;
  }): { isValid: boolean; error?: string; result?: string } => {
    try {
      const result = messageFunction(hookData);

      if (typeof result !== 'string') {
        return {
          isValid: false,
          error: `Message function must return a string, got ${typeof result}`,
        };
      }

      if (result.trim() === '') {
        return {
          isValid: false,
          error: 'Message function returned empty string',
        };
      }

      return {
        isValid: true,
        result,
      };
    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
};
