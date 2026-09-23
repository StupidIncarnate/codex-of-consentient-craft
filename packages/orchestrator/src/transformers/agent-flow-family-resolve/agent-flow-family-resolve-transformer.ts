/**
 * PURPOSE: Resolves the step graph one operation item runs against — the SAME role -> family key
 * lookup `nextActionTransformer` performs (`wardFull` carries `role: 'ward'` on the ledger, so the
 * role a caller holds is not the key both graphs are keyed on), returned as a `RoutedGraph` rather
 * than the raw `agentFlowStatics` entry. Reach for this wherever a caller holds a `Quest` and an
 * `OperationItem` and needs the step graph to walk, rather than re-deriving the lookup by hand.
 *
 * USAGE:
 * agentFlowFamilyResolveTransformer({ quest, operationItem });
 * // Returns a RoutedGraph — `.entry` and `.nodes[stepKey].routes.done`, both RoutedGraphNodeKey
 *
 * RETURNS `RoutedGraph`, NOT A HAND-ROLLED TYPE, because `agentFlowStatics` carries no zod contract by
 * design (its own header: "NO ZOD CONTRACT VALIDATES THIS FILE, AND NONE IS TO BE ADDED") and its
 * `as const` literal keys are too specific to index by a family name only known at runtime.
 * `routedGraphContract` already exists for exactly this — `graphReachabilityCheckBroker` parses the
 * same raw `family.entry` / `family.steps` shape through it — so this reuses that contract rather than
 * inventing a second loosely-typed view of the same data.
 */

import type { OperationItem, Quest, RoutedGraph } from '@dungeonmaster/shared/contracts';
import { routedGraphContract } from '@dungeonmaster/shared/contracts';
import { questFlowStatics } from '@dungeonmaster/shared/statics';

import { agentFlowStatics } from '../../statics/agent-flow/agent-flow-statics';

export const agentFlowFamilyResolveTransformer = ({
  quest,
  operationItem,
}: {
  quest: Quest;
  operationItem: OperationItem;
}): RoutedGraph => {
  const questFlow = questFlowStatics[quest.questType];

  // The family KEY, not the role — `wardFull` carries `role: 'ward'` on the ledger, so the role a
  // caller holds is not the key both graphs are keyed on.
  const familyRoleEntry = Object.entries(questFlow.families).find(
    (entry) => entry[1].role === operationItem.role,
  );

  if (familyRoleEntry === undefined) {
    throw new Error(
      `agentFlowFamilyResolveTransformer: no family in questFlowStatics.${quest.questType}.families carries role '${operationItem.role}'`,
    );
  }

  const [familyKey] = familyRoleEntry;

  // Found via `Object.entries` + `find`, never a bracket index on `agentFlowStatics` itself — a
  // dynamic index into that `as const` object needs a key literally known at compile time, and this
  // keeps the found value's own precise type instead of casting one in.
  const familyGraphEntry = Object.entries(agentFlowStatics).find(([name]) => name === familyKey);

  if (familyGraphEntry === undefined) {
    throw new Error(
      `agentFlowFamilyResolveTransformer: agentFlowStatics declares no '${familyKey}' step graph`,
    );
  }

  const [, family] = familyGraphEntry;

  return routedGraphContract.parse({
    graphName: familyKey,
    entry: family.entry,
    nodes: family.steps,
  });
};
