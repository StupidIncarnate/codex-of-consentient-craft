/**
 * PURPOSE: Upserts a smoketest case result into an existing list, replacing by caseId or appending when new
 *
 * USAGE:
 * const next = mergeSmoketestCaseResultTransformer({ existing, incoming });
 * // Returns: readonly SmoketestCaseResult[] with incoming merged by caseId
 */

import type { SmoketestCaseResult } from '@dungeonmaster/shared/contracts';

export const mergeSmoketestCaseResultTransformer = ({
  existing,
  incoming,
}: {
  existing: readonly SmoketestCaseResult[];
  incoming: SmoketestCaseResult;
}): readonly SmoketestCaseResult[] => {
  const idx = existing.findIndex((r) => r.caseId === incoming.caseId);
  if (idx === -1) {
    return [...existing, incoming];
  }
  const next = [...existing];
  next[idx] = incoming;
  return next;
};
