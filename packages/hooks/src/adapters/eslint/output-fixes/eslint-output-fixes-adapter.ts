/**
 * PURPOSE: Writes ESLint fix results to disk
 *
 * USAGE:
 * await eslintOutputFixesAdapter({ results });
 * // Writes all fixes from results to their respective files
 */
import { ESLint } from 'eslint';
import type { AdapterResult } from '@dungeonmaster/shared/contracts';

export const eslintOutputFixesAdapter = async ({
  results,
}: {
  results: ESLint.LintResult[];
}): Promise<AdapterResult> => {
  await ESLint.outputFixes(results);

  return { success: true as const };
};
