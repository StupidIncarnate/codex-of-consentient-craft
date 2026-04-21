/**
 * PURPOSE: Decides whether an array of AST elements contains at least `minimumInlineStatusSetMembers` string literals that classify as quest-status or work-item-status — the inline-membership-set heuristic.
 *
 * USAGE:
 * hasInlineStatusSetElementsLayerBroker({ elements });
 * // Returns true if >= 2 elements are known status literals
 *
 * WHEN-TO-USE: Only the ban-quest-status-literals rule should call this (for `new Set([...])` and inline array-literal flags).
 */
import type { Tsestree } from '@dungeonmaster/eslint-plugin';
import { isClassifiedStatusLiteralElementGuard } from '../../../guards/is-classified-status-literal-element/is-classified-status-literal-element-guard';
import { statusLiteralStatics } from '../../../statics/status-literal/status-literal-statics';

export const hasInlineStatusSetElementsLayerBroker = ({
  elements,
}: {
  elements?: readonly (Tsestree | null)[];
}): boolean => {
  if (elements === undefined) {
    return false;
  }
  const matches = elements.filter((element) => isClassifiedStatusLiteralElementGuard({ element }));
  return matches.length >= statusLiteralStatics.minimumInlineStatusSetMembers;
};
