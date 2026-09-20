/**
 * PURPOSE: Renders the selectors that took an instance's evidence into the sentence stored on its
 * tombstone, so a later `results` query answers `pruned at 03:14, olderThan 7d` rather than an empty
 * list (siegelense-tooling.md line 331). The window is always named because a prune always has one;
 * `instance` and `kind` join it only when a caller narrowed by them, so the rule reads back as what
 * was actually asked for rather than as a template with blanks. Reach for this over writing the
 * string at the call site: `prunedByRule` is read months later by someone asking why a file is gone,
 * and a rule spelled differently per call site cannot be searched for.
 *
 * USAGE:
 * pruneTombstoneRuleRenderTransformer({ query: PruneQueryStub({ olderThan: '7d' }) });
 * // Returns 'olderThan 7d' as ContentText
 */

import { contentTextContract } from '@dungeonmaster/shared/contracts';
import type { ContentText } from '@dungeonmaster/shared/contracts';

import type { PruneQuery } from '../../contracts/prune-query/prune-query-contract';

export const pruneTombstoneRuleRenderTransformer = ({
  query,
}: {
  query: PruneQuery;
}): ContentText => {
  const parts = [
    query.instanceId === null ? null : `instance ${query.instanceId}`,
    query.kind === null ? null : `kind ${query.kind}`,
    `olderThan ${query.olderThan}`,
  ];

  return contentTextContract.parse(parts.filter((part) => part !== null).join(', '));
};
