import { ESLint } from 'eslint';
import { resolve } from 'path';
import type { Linter } from 'eslint';
import type { LintMessage, LintResult } from '../types/lint-type';

const convertEslintResultToLintResult = ({
  result,
}: {
  result: ESLint.LintResult;
}): LintResult => ({
  filePath: result.filePath,
  messages: result.messages.map((msg) => {
    const lintMessage: LintMessage = {
      line: msg.line,
      column: msg.column,
      message: msg.message,
      severity: msg.severity,
    };

    if (msg.ruleId !== null && msg.ruleId !== '') {
      lintMessage.ruleId = msg.ruleId;
    }

    return lintMessage;
  }),
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
    config: Linter.Config;
    cwd?: string;
  }): Promise<LintResult[]> => {
    if (!content.trim()) {
      return [];
    }

    try {
      // Create ESLint instance with ONLY the filtered rules
      const eslint = new ESLint({
        cwd,
        overrideConfigFile: true, // Completely bypass project config
        overrideConfig: [config], // Use only our filtered rules
      });

      // Ensure we have an absolute path for ESLint
      // For new files that don't exist yet, ESLint just needs the path for:
      // - File extension detection (.ts, .tsx, etc.)
      // - Rule pattern matching
      // It doesn't actually read from disk since we're using lintText()
      const absolutePath = resolve(cwd, filePath);
      let results = await eslint.lintText(content, { filePath: absolutePath });

      // If we get a TypeScript project parsing error, try again without project reference
      const hasProjectError =
        results[0]?.messages.some(
          (msg) =>
            msg.message.includes('parserOptions.project') &&
            msg.message.includes('TSConfig does not include this file'),
        ) ?? false;

      if (hasProjectError) {
        // Create a simplified config without project reference
        const simplifiedConfig = {
          ...config,
          languageOptions: {
            ...config.languageOptions,
            parserOptions: {
              ...config.languageOptions?.parserOptions,
              project: undefined, // Remove project reference
            },
          },
        };

        const fallbackEslint = new ESLint({
          cwd,
          overrideConfigFile: true, // Completely bypass project config
          overrideConfig: [simplifiedConfig],
        });

        results = await fallbackEslint.lintText(content, { filePath: absolutePath });
      }

      return results.map((result) => convertEslintResultToLintResult({ result }));
    } catch (error) {
      // Log error but don't fail - return empty results
      // Using stderr to avoid no-console rule while still logging errors
      process.stderr.write(
        `ESLint error: ${error instanceof Error ? error.message : JSON.stringify(error)}\n`,
      );
      return [];
    }
  },
};
