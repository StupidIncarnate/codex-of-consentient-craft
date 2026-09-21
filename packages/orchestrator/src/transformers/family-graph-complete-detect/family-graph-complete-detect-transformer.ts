/**
 * PURPOSE: Whether the family graph has reached `@complete` for one quest, read off the ledger it
 * left behind. Reach for this over "the ledger drained": under a graph that can cycle a drained
 * ledger is an ordinary mid-run state — `work ⇄ review` is legitimately empty between two passes —
 * so draining is no longer evidence that anything finished.
 *
 * USAGE:
 * familyGraphCompleteDetectTransformer({ operations, questType, questFlowStatics });
 * // Returns true once a family routing to `@complete` holds scopes and every one of them is complete
 *
 * IT ASKS FROM THE TERMINAL END, AND WALKING FORWARD IS THE TRAP. A family that fanned out to zero
 * scopes leaves no trace on the ledger, so a forward walk cannot tell "flowrider was skipped as
 * `empty`" from "flowrider has not been routed to yet" — and walks straight past every un-minted
 * family to `@complete`. Asking instead whether a family that ROUTES to `@complete` has scopes of its
 * own makes their presence the proof the run got there: a `wardFull` scope exists only because
 * siegemaster's `done` routed to it, and a family that fanned out to nothing is skipped for free
 * because the run routes past it and `wardFull` is minted anyway.
 *
 * `operations` arrives separately from `questType` rather than as a whole quest because the ledger
 * being judged is often the one a write is ABOUT to persist, not the one on the quest in hand —
 * `questOperationsUpdateBroker` derives status from its `nextOperations` while `quest` still holds
 * the pre-write ledger.
 */

import type { OperationItem, Quest } from '@dungeonmaster/shared/contracts';

import { familyLedgerKeyTransformer } from '../family-ledger-key/family-ledger-key-transformer';

export const familyGraphCompleteDetectTransformer = ({
  operations,
  questType,
  questFlowStatics,
}: {
  operations: OperationItem[];
  questType: Quest['questType'];
  questFlowStatics: Readonly<
    Record<
      string,
      | {
          families: Readonly<
            Record<string, { routes: Readonly<Record<string, string | undefined>> } | undefined>
          >;
        }
      | undefined
    >
  >;
}): boolean => {
  const questFlow = questFlowStatics[questType];

  if (questFlow === undefined) {
    throw new Error(
      `familyGraphCompleteDetectTransformer: questFlowStatics declares no '${questType}' quest type — it holds: ${Object.keys(questFlowStatics).join(', ')}`,
    );
  }

  return Object.entries(questFlow.families).some(([family, entry]) => {
    // `empty` counts as well as `done`: a terminal family that fanned out to nothing still ended the
    // run there, and reading only `done` would leave such a quest running forever.
    if (
      entry === undefined ||
      (entry.routes.done !== '@complete' && entry.routes.empty !== '@complete')
    ) {
      return false;
    }

    const key = familyLedgerKeyTransformer({ family });
    const scopes = operations.filter((operation) => operation.role === key.role);

    return scopes.length > 0 && scopes.every((operation) => operation.status === 'complete');
  });
};
