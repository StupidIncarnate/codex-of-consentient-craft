/**
 * PURPOSE: The operation items the ledger gains when one family has drained and the family graph
 * routes on. Reach for this over calling `familyScopesMintTransformer` directly: a family can fan
 * out to ZERO scopes — flowrider covers runtime flows alone — and the relay must then route PAST it
 * rather than stall on a family that will never hold anything. That walk is this file's whole job.
 *
 * USAGE:
 * mintNextFamilyLayerBroker({ quest, target: 'flowrider' });
 * // Returns flowrider's scopes, or siegemaster's when flowrider fans out to nothing
 *
 * `@complete` and `@blocked` are not families and mint nothing. Reaching `@complete` is the run
 * ending, and `familyGraphCompleteDetectTransformer` is what reads that off the ledger afterwards —
 * which is why an un-minted family leaves no trace here and needs none.
 */

import type { OperationItem, Quest } from '@dungeonmaster/shared/contracts';
import { questFlowStatics } from '@dungeonmaster/shared/statics';

import { familyScopesMintTransformer } from '../../../transformers/family-scopes-mint/family-scopes-mint-transformer';

export const mintNextFamilyLayerBroker = ({
  quest,
  target,
}: {
  quest: Quest;
  target: string;
}): OperationItem[] => {
  // `Object.entries` rather than an index: the six family entries are differently shaped under
  // `as const`, so indexing with a string collapses their key set to `never`.
  const entry = Object.entries(questFlowStatics[quest.questType].families).find(
    ([name]) => name === target,
  );

  if (entry === undefined) {
    return [];
  }

  const scopes = familyScopesMintTransformer({ quest, family: target });

  if (scopes.length > 0) {
    return scopes;
  }

  // A family that fanned out to nothing is SKIPPED rather than stalled, and `empty` is the edge that
  // says so — the same edge `familyGraphCompleteDetectTransformer` counts as having ended the run
  // when it points at `@complete`.
  const onward = Object.entries(entry[1].routes).find(([outcome]) => outcome === 'empty')?.[1];

  return onward === undefined ? [] : mintNextFamilyLayerBroker({ quest, target: onward });
};
