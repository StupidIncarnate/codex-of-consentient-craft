/**
 * PURPOSE: Writes ESLint fix results to disk
 *
 * USAGE:
 * await eslintOutputFixesAdapter({ results });
 * // Writes all fixes from results to their respective files
 */
import { ESLint } from 'eslint';

export const eslintOutputFixesAdapter = async ({
  results,
}: {
  results: ESLint.LintResult[];
}): Promise<void> => {
  await ESLint.outputFixes(results);
};
