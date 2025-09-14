import { ESLint } from 'eslint';
import { resolve } from 'path';
import type { LintResult } from './types';

const createEslintInstance = (): ESLint => {
  const tseslint = require('@typescript-eslint/eslint-plugin');
  const tsparser = require('@typescript-eslint/parser');
  const eslintCommentsPlugin = require('eslint-plugin-eslint-comments');

  return new ESLint({
    overrideConfigFile: true, // Don't load any config files - ESLint v9 API
    baseConfig: [
      {
        files: ['**/*.ts', '**/*.tsx'], // Ensure TypeScript files are handled
        languageOptions: {
          parser: tsparser,
          parserOptions: {
            ecmaVersion: 2020,
            sourceType: 'module',
            // Remove project requirement to allow linting any TypeScript file
          },
        },
        plugins: {
          '@typescript-eslint': tseslint,
          'eslint-comments': eslintCommentsPlugin,
        },
        rules: {
          // Only enable specific blocking rules for performance
          '@typescript-eslint/no-explicit-any': 'error',
          '@typescript-eslint/ban-ts-comment': 'error',
          'eslint-comments/no-use': 'error',
        },
      }
    ],
  });
};

const convertEslintResultToLintResult = ({
  result,
}: {
  result: ESLint.LintResult;
}): LintResult => ({
  filePath: result.filePath,
  messages: result.messages.map((msg) => ({
    line: msg.line,
    column: msg.column,
    message: msg.message,
    severity: msg.severity,
    ruleId: msg.ruleId || undefined,
  })),
  errorCount: result.errorCount,
  warningCount: result.warningCount,
});

export const LintRunner = {
  runTargetedLint: async ({
    content,
    filePath,
  }: {
    content: string;
    filePath: string;
  }): Promise<LintResult[]> => {
    if (!content.trim()) {
      return [];
    }

    try {
      const eslint = createEslintInstance();

      // Ensure we have an absolute path for ESLint
      // For new files that don't exist yet, ESLint just needs the path for:
      // - File extension detection (.ts, .tsx, etc.)
      // - Rule pattern matching
      // It doesn't actually read from disk since we're using lintText()
      const absolutePath = resolve(filePath);

      const results = await eslint.lintText(content, { filePath: absolutePath });

      return results.map((result) => convertEslintResultToLintResult({ result }));
    } catch (error) {
      // Log error but don't fail - return empty results
      console.error('ESLint error:', error instanceof Error ? error.message : String(error));
      return [];
    }
  },
};
