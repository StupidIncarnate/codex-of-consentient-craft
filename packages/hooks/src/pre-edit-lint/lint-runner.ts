import { ESLint } from 'eslint';
import { resolve } from 'path';
import type { Linter } from 'eslint';
import type { LintResult } from './types';

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
    config,
    cwd = process.cwd(),
  }: {
    content: string;
    filePath: string;
    config: Linter.FlatConfig[];
    cwd?: string;
  }): Promise<LintResult[]> => {
    if (!content.trim()) {
      return [];
    }

    try {
      // Create ESLint instance with the filtered configuration
      const eslint = new ESLint({
        overrideConfigFile: true, // Don't load config files
        baseConfig: config,
        cwd,
      });

      // Ensure we have an absolute path for ESLint
      // For new files that don't exist yet, ESLint just needs the path for:
      // - File extension detection (.ts, .tsx, etc.)
      // - Rule pattern matching
      // It doesn't actually read from disk since we're using lintText()
      const absolutePath = resolve(cwd, filePath);

      const results = await eslint.lintText(content, { filePath: absolutePath });

      return results.map((result) => convertEslintResultToLintResult({ result }));
    } catch (error) {
      // Log error but don't fail - return empty results
      console.error('ESLint error:', error instanceof Error ? error.message : String(error));
      return [];
    }
  },
};
