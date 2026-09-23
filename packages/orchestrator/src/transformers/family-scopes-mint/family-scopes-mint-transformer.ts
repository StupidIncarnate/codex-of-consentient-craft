/**
 * PURPOSE: The operation items ONE family of the quest-flow graph mints the moment the relay routes
 * to it. Reach for this rather than seeding every family's scopes at Start: a family's scopes do not
 * exist until it is routed to, so the fan-out reads the flows AS THEY STAND then — which is what
 * gives an observable an operator adds mid-quest a flowrider session at all, where a scope cut at
 * approval could never have covered it.
 *
 * USAGE:
 * familyScopesMintTransformer({ quest, family: 'flowrider' });
 * // Returns one pending OperationItem per flow the flowrider track measures
 *
 * The fan-out RULE is untouched — `relayTailFanOutTransformer` decides how many scopes a seed becomes
 * and in what order, and this only decides WHEN it runs. `operationsCodeweaverOrderTransformer` is
 * deliberately NOT applied: the fan-out already orders cells by package kind tier, then graph depth,
 * then name, and that transformer exists to reorder items an intake author wrote.
 *
 * A family that fans out to nothing returns an EMPTY array, and that is a real answer rather than a
 * failure — flowrider covers runtime flows alone, so an all-operational quest mints it no scope and
 * the router routes past it.
 */

import { operationItemContract } from '@dungeonmaster/shared/contracts';
import type { OperationItem, PackageName, Quest } from '@dungeonmaster/shared/contracts';
import { isCommandWorkItemRoleGuard } from '@dungeonmaster/shared/guards';
import { questFlowStatics } from '@dungeonmaster/shared/statics';

import { relayTailFanOutTransformer } from '../relay-tail-fan-out/relay-tail-fan-out-transformer';

export const familyScopesMintTransformer = ({
  quest,
  family,
}: {
  quest: Quest;
  family: string;
}): OperationItem[] => {
  // The family entry IS the seed: `questFlowStatics` carries the `role`, the `text` and the
  // `fanOutBy` every scope is cut from, keyed by the family the router just routed to.
  const familyEntry = new Map(Object.entries(questFlowStatics[quest.questType].families)).get(
    family,
  );

  // A family with no `text` is appended at merge rather than routed to, so it mints nothing here.
  if (familyEntry === undefined || !('text' in familyEntry)) {
    throw new Error(
      `familyScopesMintTransformer: quest type '${quest.questType}' declares no routable family '${family}' — the routable families are: ${Object.entries(
        questFlowStatics[quest.questType].families,
      )
        .filter(([, entry]) => 'text' in entry)
        .map(([name]) => name)
        .join(', ')}`,
    );
  }

  // `locked` protects a scope from `modify-quest` deletion (operationItemContract's own `.describe()`
  // on the field). It defaults TRUE and only codeweaver sets it false, because the flows are the
  // acceptance target and that chain has to stay unbounded.
  const locked = 'locked' in familyEntry ? familyEntry.locked : true;

  // Every package the quest's spine is tagged with, first-tagged order, deduplicated — the fallback
  // for a slice that names none of its own. Nobody authored these scopes, so the node tags are the
  // only statement of where the work lands.
  const spinePackages = new Map<unknown, PackageName>();
  for (const flow of quest.flows) {
    for (const node of flow.nodes) {
      for (const packageName of node.packages) {
        spinePackages.set(String(packageName), packageName);
      }
    }
  }

  return relayTailFanOutTransformer({ entry: familyEntry, quest }).map((slice) =>
    operationItemContract.parse({
      id: crypto.randomUUID(),
      role: familyEntry.role,
      text: slice.text,
      status: 'pending',
      locked,
      flowIds: slice.flowIds,
      // A COMMAND role is excluded from the spine fallback: `packageNames` exists to narrow an
      // AGENT's search to its slice, and the dispatcher runs a command itself with no prompt to
      // narrow. Inheriting the spine there claims riftcarver builds only the packages the flows
      // happen to tag, when what it prepares is the whole worktree.
      packageNames:
        slice.packageNames.length > 0
          ? slice.packageNames
          : isCommandWorkItemRoleGuard({ role: familyEntry.role })
            ? []
            : [...spinePackages.values()],
    }),
  );
};
