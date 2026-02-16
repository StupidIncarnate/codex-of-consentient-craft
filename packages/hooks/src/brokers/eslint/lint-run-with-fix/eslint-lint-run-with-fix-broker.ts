/**
 * PURPOSE: Runs ESLint with fix option and quiet mode on a file path, returning only error-level violations
 *
 * USAGE:
 * const results = await eslintLintRunWithFixBroker({ filePath: '/path/file.ts', config: eslintConfig, cwd: '/project' });
 * // Returns array of LintResult with only error-level violations after auto-fixing
 */
import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';
import { eslintEslintAdapter } from '../../../adapters/eslint/eslint/eslint-eslint-adapter';
import { eslintOutputFixesAdapter } from '../../../adapters/eslint/output-fixes/eslint-output-fixes-adapter';
import { pathResolveAdapter } from '../../../adapters/path/resolve/path-resolve-adapter';
import { filePathContract } from '../../../contracts/file-path/file-path-contract';
import type { LintResult } from '../../../contracts/lint-result/lint-result-contract';
import { eslintResultToLintResultTransformer } from '../../../transformers/eslint-result-to-lint-result/eslint-result-to-lint-result-transformer';
import { lintSeverityStatics } from '../../../statics/lint-severity/lint-severity-statics';

/**
 * Runs ESLint with auto-fix on a file path and returns only error-level violations.
 *
 * This broker:
 * - Creates ESLint instance with fix: true option
 * - Runs linting on file path (ESLint reads from disk, applies fixes, writes back)
 * - Filters results to errors only (quiet mode - severity === 2)
 * - Returns transformed lint results with only unfixable errors
 *
 * @param filePath - The file path to lint and fix
 * @param config - The ESLint configuration with rules to apply
 * @param cwd - The current working directory (defaults to process.cwd())
 * @returns Array of lint results containing only error-level violations
 */
export const eslintLintRunWithFixBroker = async ({
  filePath,
  config: _config,
  cwd = process.cwd(),
}: {
  filePath: string;
  config: unknown;
  cwd?: string;
}): Promise<LintResult[]> => {
  try {
    // Ensure we have an absolute path for ESLint
    const absolutePath = pathResolveAdapter({ paths: [cwd, filePath] });
    const absoluteFilePath = filePathContract.parse(absolutePath);

    // Verify file is readable before linting (prevents race condition with file writes)
    // This ensures the file system has flushed any pending writes before ESLint reads it
    try {
      await fsReadFileAdapter({ filePath: absoluteFilePath });
    } catch (_readError) {
      // File not readable yet - continue anyway, ESLint will handle if still unavailable
    }

    // Create ESLint instance with fix: true
    // Use the project's eslint.config.js for full plugin support (prettier, etc.)
    const eslint = eslintEslintAdapter({
      options: {
        cwd,
        fix: true, // Auto-fix violations
      },
    });

    // Run linting with auto-fix (generates fixes in memory)
    const results = await eslint.lintFiles([absolutePath]);

    // Write fixes to disk (only writes if result.output exists)
    await eslintOutputFixesAdapter({ results });

    // Filter to errors only (quiet mode - severity === 2)
    const errorOnlyResults = results.map((result) => ({
      ...result,
      messages: result.messages.filter((msg) => msg.severity === lintSeverityStatics.error),
      warningCount: 0,
      errorCount: result.messages.filter((msg) => msg.severity === lintSeverityStatics.error)
        .length,
    }));

    return errorOnlyResults.map((result) =>
      eslintResultToLintResultTransformer({ eslintResult: result }),
    );
  } catch (error) {
    // Log error but don't fail - return empty results
    process.stderr.write(
      `ESLint error: ${error instanceof Error ? error.message : JSON.stringify(error)}\n`,
    );
    return [];
  }
};
