/**
 * PURPOSE: Builds a display string showing discovery diff file paths for terminal/summary output
 *
 * USAGE:
 * discoveryDiffDisplayTransformer({ hasMismatch: true, onlyProcessed: ['@types/foo.d.ts'], onlyDiscovered: [], maxDisplay: 10 });
 * // Returns: WardSummary '\n  only processed: @types/foo.d.ts'
 */

import type { GitRelativePath } from '../../contracts/git-relative-path/git-relative-path-contract';
import {
  wardSummaryContract,
  type WardSummary,
} from '../../contracts/ward-summary/ward-summary-contract';

export const discoveryDiffDisplayTransformer = ({
  hasMismatch,
  onlyProcessed,
  onlyDiscovered,
  maxDisplay,
}: {
  hasMismatch: boolean;
  onlyProcessed: GitRelativePath[];
  onlyDiscovered: GitRelativePath[];
  maxDisplay: number;
}): WardSummary => {
  if (!hasMismatch) {
    return wardSummaryContract.parse('');
  }

  const sections = [];

  if (onlyProcessed.length > 0) {
    const shown = onlyProcessed.slice(0, maxDisplay);
    const remaining = onlyProcessed.length - shown.length;
    const suffix = remaining > 0 ? `, ... and ${String(remaining)} more` : '';
    sections.push(`  only processed: ${shown.join(', ')}${suffix}`);
  }

  if (onlyDiscovered.length > 0) {
    const shown = onlyDiscovered.slice(0, maxDisplay);
    const remaining = onlyDiscovered.length - shown.length;
    const suffix = remaining > 0 ? `, ... and ${String(remaining)} more` : '';
    sections.push(`  only discovered: ${shown.join(', ')}${suffix}`);
  }

  if (sections.length === 0) {
    return wardSummaryContract.parse('');
  }

  return wardSummaryContract.parse(`\n${sections.join('\n')}`);
};
