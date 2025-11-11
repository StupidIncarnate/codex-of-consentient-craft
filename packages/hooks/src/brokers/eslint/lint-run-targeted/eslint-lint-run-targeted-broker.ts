/**
 * PURPOSE: Runs ESLint on content with targeted rules and handles TypeScript config errors
 *
 * USAGE:
 * const results = await eslintLintRunTargetedBroker({ content: code, filePath: 'file.ts', config: linterConfig, cwd: '/path' });
 * // Returns array of LintResult with violations found
 */
import { eslintEslintAdapter } from '../../../adapters/eslint/eslint/eslint-eslint-adapter';
import { pathResolveAdapter } from '../../../adapters/path/resolve/path-resolve-adapter';
import type { LintResult } from '../../../contracts/lint-result/lint-result-contract';
import { eslintResultToLintResultTransformer } from '../../../transformers/eslint-result-to-lint-result/eslint-result-to-lint-result-transformer';

/**
 * Runs ESLint on specific content with targeted rules.
 *
 * This broker:
 * - Creates an isolated ESLint instance with only the specified rules
 * - Lints the provided content (not reading from disk)
 * - Handles TypeScript project configuration errors with fallback
 * - Returns transformed lint results
 *
 * @param content - The code content to lint
 * @param filePath - The file path (used for extension detection and rule matching)
 * @param config - The Linter configuration with rules to apply
 * @param cwd - The current working directory (defaults to process.cwd())
 * @returns Array of lint results for the content
 */
export const eslintLintRunTargetedBroker = async ({
  content,
  filePath,
  config,
  cwd = process.cwd(),
}: {
  content: string;
  filePath: string;
  config: unknown;
  cwd?: string;
}): Promise<LintResult[]> => {
  if (!content.trim()) {
    return [];
  }

  try {
    // Create ESLint instance with ONLY the filtered rules
    // Type assertion needed because config is unknown at broker level but typed at adapter boundary
    const eslint = eslintEslintAdapter({
      options: {
        cwd,
        overrideConfigFile: true,
        overrideConfig: [config] as never,
      },
    });

    // Ensure we have an absolute path for ESLint
    // For new files that don't exist yet, ESLint just needs the path for:
    // - File extension detection (.ts, .tsx, etc.)
    // - Rule pattern matching
    // It doesn't actually read from disk since we're using lintText()
    const absolutePath = pathResolveAdapter({ paths: [cwd, filePath] });
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
      const configObj = config as Record<PropertyKey, unknown>;
      const languageOptions = Reflect.get(configObj, 'languageOptions') as
        | Record<PropertyKey, unknown>
        | undefined;
      const parserOptions = languageOptions
        ? (Reflect.get(languageOptions, 'parserOptions') as
            | Record<PropertyKey, unknown>
            | undefined)
        : undefined;

      const simplifiedConfig = {
        ...configObj,
        languageOptions: {
          ...languageOptions,
          parserOptions: {
            ...parserOptions,
            project: undefined, // Remove project reference
          },
        },
      };

      // Type assertion needed because config is unknown at broker level but typed at adapter boundary
      const fallbackEslint = eslintEslintAdapter({
        options: {
          cwd,
          overrideConfigFile: true,
          overrideConfig: [simplifiedConfig] as never,
        },
      });

      results = await fallbackEslint.lintText(content, { filePath: absolutePath });
    }

    return results.map((result) => eslintResultToLintResultTransformer({ eslintResult: result }));
  } catch (error) {
    // Log error but don't fail - return empty results
    // Using stderr to avoid no-console rule while still logging errors
    process.stderr.write(
      `ESLint error: ${error instanceof Error ? error.message : JSON.stringify(error)}\n`,
    );
    return [];
  }
};
