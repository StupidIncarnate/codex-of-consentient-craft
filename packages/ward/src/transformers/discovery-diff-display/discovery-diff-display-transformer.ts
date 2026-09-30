/**
 * PURPOSE: Builds a display string showing discovery diff file paths for terminal/summary output
 *
 * USAGE:
 * discoveryDiffDisplayTransformer({ hasMismatch: true, onlyProcessed: ['@types/foo.d.ts'], onlyDiscovered: [], maxDisplay: 10 });
 * // Returns: WardSummary '\n  only processed: @types/foo.d.ts'
 */


export const discoveryDiffDisplayTransformer = ({
  hasMismatch,
  onlyProcessed,
  onlyDiscovered,
  maxDisplay,
}: {
  hasMismatch: boolean;
  onlyProcessed: string[];
  onlyDiscovered: string[];
  maxDisplay: number;
}): string => {
  if (!hasMismatch) {
    return '';
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
    return '';
  }

  return `\n${sections.join('\n')}`;
};
