/**
 * PURPOSE: Settles the two judgement calls a one-line summary has to make. `singleValueTools` names
 * the tools whose one interesting argument needs no `key:` prefix to be understood — a Read shows a
 * path, not `file_path: <path>` — and `inlineSummaryLimit` caps the string handed to CSS ellipsis,
 * so a pathological argument cannot cost the row its layout before the browser gets to clip it.
 *
 * USAGE:
 * toolRowSummaryStatics.inlineSummaryLimit;
 * // Returns 200
 */

export const toolRowSummaryStatics = {
  inlineSummaryLimit: 200,
  truncationSuffix: '...',
  singleValueTools: ['Bash', 'Read', 'Write', 'Edit', 'Glob'],
  fieldSeparator: ', ',
} as const;
