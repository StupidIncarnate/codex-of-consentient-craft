import type { ViolationCount } from '../types/lint-type';
import type { PreEditLintConfig } from '../types/config-type';
import { ruleDisplayConfigExtractTransformer } from '../transformers/rule-display-config-extract/rule-display-config-extract-transformer';

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

      // Get display config for this rule
      const displayConfig = ruleDisplayConfigExtractTransformer({
        config,
        ruleId: violation.ruleId,
      });

      // Use display name instead of rule ID (hide rule ID from LLM)
      const displayName =
        displayConfig.displayName ??
        MessageFormatter.getDefaultDisplayName({ ruleId: violation.ruleId });

      lines.push(`  ❌ ${displayName}: ${count}`);

      // Get custom or default message
      const getMessage = (): string => {
        const configMessage = displayConfig.message;

        if (configMessage === undefined) {
          return MessageFormatter.getDefaultRuleMessage({ ruleId: violation.ruleId });
        }

        if (typeof configMessage === 'string') {
          return configMessage;
        }

        // If it's a function, call it
        try {
          const result = configMessage(hookData);
          return typeof result === 'string' ? result : String(result);
        } catch (error: unknown) {
          return `Custom message function failed: ${error instanceof Error ? error.message : String(error)}`;
        }
      };
      const message = getMessage();

      lines.push(`     ${message}`);

      // Show specific line:column locations
      for (const detail of violation.details) {
        lines.push(`     Line ${detail.line}:${detail.column} - ${detail.message}`);
      }
    }

    lines.push('');
    lines.push('These rules help maintain code quality and safety. Please fix the violations.');

    return lines.join('\n');
  },

  getDefaultDisplayName: ({ ruleId }: { ruleId: string }): string => {
    const defaultDisplayNames: Record<string, string> = {
      '@typescript-eslint/no-explicit-any': 'Type Safety Violation',
      '@typescript-eslint/ban-ts-comment': 'Type Error Suppression',
      'eslint-comments/no-use': 'Code Quality Rule Bypass',
    };

    return defaultDisplayNames[ruleId] ?? 'Code Quality Issue';
  },

  getDefaultRuleMessage: ({ ruleId }: { ruleId: string }): string => {
    const defaultMessages: Record<string, string> = {
      '@typescript-eslint/no-explicit-any':
        'Using type "any" violates TypeScript\'s type safety rules. Go explore types for this project and use a known or make a new type to use.',
      '@typescript-eslint/ban-ts-comment':
        'TypeScript error suppression comments (@ts-ignore, @ts-expect-error) cannot be used. Explore root cause and fix the underlying issue.',
      'eslint-comments/no-use':
        'ESLint disable comments should not be used. Explore root cause and fix the underlying issue',
    };

    return (
      defaultMessages[ruleId] ?? 'This rule violation should be fixed to maintain code quality.'
    );
  },
};
