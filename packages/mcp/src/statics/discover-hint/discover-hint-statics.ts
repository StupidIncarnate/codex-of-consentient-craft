/**
 * PURPOSE: Constants for the discover empty-result directory hint
 *
 * USAGE:
 * import { discoverHintStatics } from '../../statics/discover-hint/discover-hint-statics';
 * discoverHintStatics.maxDirectoriesShown; // 10
 *
 * WHEN-TO-USE: Referenced when building the "no files matched" hint so directory lists don't blow up the output
 */
export const discoverHintStatics = {
  /** Max number of candidate directories to list in the empty-result hint. */
  maxDirectoriesShown: 10,
  /** Lead-in line shown when results are empty but directories matched. */
  header: '(no files matched)',
  /** Explanation of why the glob returned nothing. */
  explanation: 'Hint: your glob matched these directories but discover returns files only.',
  /** Suggestion prefix. */
  suggestion: 'Try appending "/**" to descend into them:',
} as const;
