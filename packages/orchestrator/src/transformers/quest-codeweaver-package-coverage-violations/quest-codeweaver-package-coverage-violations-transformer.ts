/**
 * PURPOSE: Names every package a flow node lands in that no codeweaver operation item claims. The
 * ledger is what dispatch orders dependencies-first and what tells each session which packages to
 * read before it searches, so a package tagged on the spine but absent from every item is work the
 * relay has nowhere to schedule. Reach for this over
 * `questNodePackageCoverageViolationsTransformer` when the question is whether the PLAN covers the
 * spine; that one asks whether the spine's tags are declared at all.
 *
 * The caller scopes this to feature quests. A bug-hunt's implementation op is the orchestrator-seeded
 * pesteater item, which does not exist until Start, so there is no ledger to measure at the gate.
 *
 * USAGE:
 * questCodeweaverPackageCoverageViolationsTransformer({flows: quest.flows, operations: quest.operations});
 * // Returns ErrorMessage[] — one sentence per uncovered package, naming a node that tags it.
 */
import type { FlowStub, OperationItemStub } from '@dungeonmaster/shared/contracts';
import { errorMessageContract } from '@dungeonmaster/shared/contracts';
import type { ErrorMessage } from '@dungeonmaster/shared/contracts';

type Flow = ReturnType<typeof FlowStub>;
type OperationItem = ReturnType<typeof OperationItemStub>;

export const questCodeweaverPackageCoverageViolationsTransformer = ({
  flows,
  operations,
}: {
  flows: Flow[];
  operations: OperationItem[];
}): ErrorMessage[] => {
  const claimedPackages = new Set<unknown>();
  for (const operation of operations) {
    if (operation.role !== 'codeweaver') {
      continue;
    }
    for (const packageName of operation.packageNames) {
      claimedPackages.add(String(packageName));
    }
  }

  // First witness wins: one sentence per uncovered package, pointing at a node that proves the
  // package is really on the spine, rather than one sentence per (node, package) pair.
  const firstWitnessByPackage = new Map<unknown, ErrorMessage>();

  for (const flow of flows) {
    for (const node of flow.nodes) {
      for (const packageName of node.packages) {
        const name = String(packageName);
        if (claimedPackages.has(name) || firstWitnessByPackage.has(name)) {
          continue;
        }
        firstWitnessByPackage.set(
          name,
          errorMessageContract.parse(
            `Package '${name}' is tagged on node '${String(node.id)}' in flow '${String(flow.id)}' but no codeweaver operation item declares it in packageNames. Every package the spine lands in needs an implementation item that names it, or the dependency-ordered dispatch has nothing to schedule there — add '${name}' to an existing codeweaver item's packageNames, or author an item for it.`,
          ),
        );
      }
    }
  }

  return [...firstWitnessByPackage.values()];
};
