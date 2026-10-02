/**
 * PURPOSE: Runs ESLint on content with targeted rules and handles TypeScript config errors
 *
 * USAGE:
 * const results = await eslintLintRunTargetedBroker({ content: code, filePath: 'file.ts', config: linterConfig, cwd: '/path' });
 * // Returns array of LintResult with violations found
 */
import { ESLint, type Linter } from '#gateway/npm/eslint';
import { resolve } from '#gateway/node/path';
import { stderr } from '#gateway/node/process';
import type { LintResult } from '../../../contracts/lint-result/lint-result-contract';
import { eslintResultToLintResultTransformer } from '../../../transformers/eslint-result-to-lint-result/eslint-result-to-lint-result-transformer';
import { rawEslintConfigContract } from '../../../contracts/raw-eslint-config/raw-eslint-config-contract';

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
 * @param cwd - The directory ESLint runs against (required)
 * @returns Array of lint results for the content
 */
export const eslintLintRunTargetedBroker = async ({
  content,
  filePath,
  config,
  cwd: workingDir,
}: {
  content: string;
  filePath: string;
  config: unknown;
  cwd: string;
}): Promise<LintResult[]> => {
  if (!content.trim()) {
    return [];
  }

  try {
    // Create ESLint instance with ONLY the filtered rules
    const eslint = new ESLint({
      cwd: workingDir,
      overrideConfigFile: true,
      overrideConfig: [config as Linter.Config],
    });

    // Ensure we have an absolute path for ESLint
    // For new files that don't exist yet, ESLint just needs the path for:
    // - File extension detection (.ts, .tsx, etc.)
    // - Rule pattern matching
    // It doesn't actually read from disk since we're using lintText()
    const absolutePath = resolve(workingDir, filePath);
    let results = await eslint.lintText(content, { filePath: absolutePath });

    // If we get any TypeScript project parsing error, try again without project reference.
    // This catches both:
    //   1. "TSConfig does not include this file" (file outside project include)
    //   2. Project-references errors (parser fails to load referenced projects)
    const hasProjectError =
      results[0]?.messages.some(
        (msg) =>
          msg.message.includes('parserOptions.project') ||
          msg.message.includes('TSConfig does not include this file') ||
          msg.message.includes('project references'),
      ) ?? false;

    if (hasProjectError) {
      // Create a simplified config without project reference.
      // Use rawEslintConfigContract only to safely extract languageOptions/parserOptions;
      // spread the full original config record so fields like `files` are preserved.
      const parsedConfig = rawEslintConfigContract.safeParse(config);
      const languageOptions = parsedConfig.success ? parsedConfig.data.languageOptions : undefined;
      const parserOptions = languageOptions?.parserOptions;

      const simplifiedConfig = {
        ...(config as Record<PropertyKey, unknown>),
        languageOptions: {
          ...languageOptions,
          parserOptions: {
            ...parserOptions,
            project: undefined, // Remove project reference
          },
        },
      };

      // Type assertion needed because config is unknown at broker level but typed at adapter boundary
      const fallbackEslint = new ESLint({
        cwd: workingDir,
        overrideConfigFile: true,
        overrideConfig: [simplifiedConfig as Linter.Config],
      });

      results = await fallbackEslint.lintText(content, { filePath: absolutePath });
    }

    return results.map((result) => eslintResultToLintResultTransformer({ eslintResult: result }));
  } catch (error) {
    // Log error but don't fail - return empty results
    // Using stderr to avoid no-console rule while still logging errors
    stderr.write(
      `ESLint error: ${error instanceof Error ? error.message : JSON.stringify(error)}\n`,
    );
    return [];
  }
};
