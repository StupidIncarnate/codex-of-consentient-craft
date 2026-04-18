/**
 * PURPOSE: Configuration knobs for the ban-status-string-comparisons rule — path allowlists, default identifier allowlist, and banned prefix checks
 *
 * USAGE:
 * import { statusLiteralStatics } from './statics/status-literal/status-literal-statics';
 * statusLiteralStatics.bannedStartsWithPrefixes.includes('seek_');
 * // Returns true
 *
 * WHEN-TO-USE: Only the ban-status-string-comparisons rule should consume this. Status-aware application code uses the shared guards instead.
 *
 * NOTE: The live status literal sets are read from
 *   packages/shared/src/contracts/quest-status/quest-status-contract.ts
 * and
 *   packages/shared/src/contracts/work-item-status/work-item-status-contract.ts
 * at rule-module load time (see rule-ban-status-string-comparisons-broker.ts).
 * That avoids drift if a new status is added to the contract.
 */
export const statusLiteralStatics = {
  // Minimum number of known status literals inside an inline Set/array to fire the inlineStatusSet diagnostic.
  minimumInlineStatusSetMembers: 2,
  // `startsWith` prefixes that encode pre-split pathseeker / explore / review assumptions.
  bannedStartsWithPrefixes: ['seek_', 'explore_', 'review_'],
  // Identifier names whose `.status` read we treat as quest-or-work-item status (rule options may extend).
  defaultStatusHolderIdentifiers: ['quest', 'workItem', 'wi', 'item', 'input', 'postResult'],
  // Regex (as source string) that also qualifies an identifier as a status holder.
  statusHolderIdentifierSuffixPattern: 'Quest$|Item$',
  // Path substrings that place a file outside the rule's enforcement scope (legitimate status-literal readers).
  allowlistPathSubstrings: [
    '/packages/shared/src/statics/quest-status-metadata/',
    '/packages/shared/src/statics/work-item-status-metadata/',
    '/packages/shared/src/statics/quest-status-transitions/',
    '/packages/shared/src/contracts/quest-status/',
    '/packages/shared/src/contracts/work-item-status/',
    '/packages/shared/src/contracts/quest-status-metadata/',
    '/packages/shared/src/contracts/work-item-status-metadata/',
    '/packages/shared/src/contracts/display-header/',
    '/packages/shared/src/transformers/next-approval-quest-status/',
    '/packages/shared/src/transformers/display-header-quest-status/',
    '/packages/orchestrator/src/statics/quest-status-transitions/',
    // Plan per-site table (line 215): case-dispatch on nextStatus from explicit source status — not a membership read.
    '/packages/orchestrator/src/transformers/quest-completeness-for-transition/',
  ],
  // Path regex fragments — guard matches filenames ending in these forms.
  allowlistPathRegexSources: [
    '-quest-status-guard\\.ts$',
    '-work-item-status-guard\\.ts$',
    '-quest-status-guard\\.test\\.ts$',
    '-work-item-status-guard\\.test\\.ts$',
    '\\.test\\.ts$',
    '\\.test\\.tsx$',
    '\\.integration\\.test\\.ts$',
    '\\.integration\\.test\\.tsx$',
    '\\.spec\\.ts$',
    '\\.spec\\.tsx$',
    '\\.stub\\.ts$',
    '\\.stub\\.tsx$',
    '\\.proxy\\.ts$',
    '\\.proxy\\.tsx$',
    '\\.e2e\\.test\\.ts$',
    '\\.e2e\\.test\\.tsx$',
    '\\.harness\\.ts$',
    '/statics/[^/]*-prompt[^/]*/',
  ],
} as const;
