/**
 * PURPOSE: Classifies a string literal as a quest-status, work-item-status, ambiguous (both), or unrelated literal. Drives the ban-status-string-comparisons rule's diagnostic routing.
 *
 * USAGE:
 * classifyStatusLiteralTransformer({ literal: 'in_progress' });
 * // Returns 'ambiguous'
 * classifyStatusLiteralTransformer({ literal: 'seek_scope' });
 * // Returns 'quest'
 * classifyStatusLiteralTransformer({ literal: 'failed' });
 * // Returns 'workItem'
 * classifyStatusLiteralTransformer({ literal: 'not_a_status' });
 * // Returns null
 *
 * WHEN-TO-USE: Only the ban-status-string-comparisons rule / its helpers should call this.
 */
import {
  questStatusContract,
  workItemStatusContract,
  type QuestStatus,
  type WorkItemStatus,
} from '@dungeonmaster/shared/contracts';

const questStatusLiterals: readonly QuestStatus[] = questStatusContract.options;
const workItemStatusLiterals: readonly WorkItemStatus[] = workItemStatusContract.options;

export type StatusLiteralKind = 'quest' | 'workItem' | 'ambiguous';

export const classifyStatusLiteralTransformer = ({
  literal,
}: {
  literal: string;
}): StatusLiteralKind | null => {
  const isQuest = questStatusLiterals.some((option) => option === literal);
  const isWorkItem = workItemStatusLiterals.some((option) => option === literal);
  if (isQuest && isWorkItem) {
    return 'ambiguous';
  }
  if (isQuest) {
    return 'quest';
  }
  if (isWorkItem) {
    return 'workItem';
  }
  return null;
};
