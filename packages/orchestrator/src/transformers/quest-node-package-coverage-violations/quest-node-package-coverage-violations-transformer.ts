/**
 * PURPOSE: Names every flow node whose package tag is missing or draws on a package the quest never
 * declared. This is the only place the untagged-node rejection can live: `modifyQuestInputContract`
 * cannot express it, because a node arriving without `packages` is shape-identical to a legitimate
 * partial patch that simply left the field alone. Reach for this over
 * `questUngluedSeamEdgesTransformer` when the question is whether each node's tag is well-formed at
 * all; that one asks whether two already-well-formed tags meet.
 *
 * USAGE:
 * questNodePackageCoverageViolationsTransformer({flows: quest.flows, packagesAffected: quest.packagesAffected});
 * // Returns ErrorMessage[] — one sentence per offending node/tag, each carrying its own remediation.
 */
import type { QuestStub } from '@dungeonmaster/shared/contracts';
import { errorMessageContract } from '@dungeonmaster/shared/contracts';
import type { ErrorMessage } from '@dungeonmaster/shared/contracts';

type Quest = ReturnType<typeof QuestStub>;

export const questNodePackageCoverageViolationsTransformer = ({
  flows,
  packagesAffected,
}: {
  flows: Quest['flows'];
  packagesAffected: Quest['packagesAffected'];
}): ErrorMessage[] => {
  const declaredNames = new Set<unknown>(packagesAffected.map((entry) => String(entry.name)));
  const offenders: ErrorMessage[] = [];

  for (const flow of flows) {
    for (const node of flow.nodes) {
      if (node.packages.length === 0) {
        offenders.push(
          errorMessageContract.parse(
            `Node '${String(node.id)}' in flow '${String(flow.id)}' tags no package. Every node names at least one package it lands in — the tag is what routes the node's terminal and branch units, which carry no observable to read a package from. Tag it with a name from quest.packagesAffected, or with two when it spans a seam.`,
          ),
        );
        continue;
      }

      for (const packageName of node.packages) {
        if (declaredNames.has(String(packageName))) {
          continue;
        }
        offenders.push(
          errorMessageContract.parse(
            `Node '${String(node.id)}' in flow '${String(flow.id)}' tags package '${String(packageName)}', which is not in quest.packagesAffected. Add an entry { name, location, changeType: 'edit' | 'new', packageType } — and for a 'new' package, usedBy[] naming its consumers — in the same modify-quest call, or retag the node.`,
          ),
        );
      }
    }
  }

  return offenders;
};
