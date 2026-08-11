/**
 * PURPOSE: Makes good on the one asymmetry `modifyQuestInputContract` promises an author — that an
 * observable on a node tagging exactly one package need not restate it. Reach for this over
 * `questObservableAttributionViolationsTransformer`, which judges a package that is already there;
 * this is what puts it there, and it has to run BEFORE the whole-quest `questContract.parse` or the
 * persisted contract's required `package` refuses the very spec the input contract invited.
 *
 * USAGE:
 * questResolvedObservablePackagesTransformer({flows: quest.flows});
 * // Returns the same flows with each single-package node's observables carrying that node's package
 */
import { packageNameContract } from '@dungeonmaster/shared/contracts';
import type { Flow } from '@dungeonmaster/shared/contracts';

export const questResolvedObservablePackagesTransformer = ({ flows }: { flows: Flow[] }): Flow[] =>
  flows.map((flow) => {
    // This reads the raw merge output, ahead of the whole-quest re-parse, so `nodes`, `observables`,
    // and `packages` may still be ABSENT on anything this write created — the contract defaults that
    // make them arrays have not been applied yet. Anything with nothing to resolve is handed back
    // untouched rather than rebuilt around an empty array, so this pass never invents a key the parse
    // would otherwise have refused.
    if (!Array.isArray(flow.nodes)) {
      return flow;
    }

    return {
      ...flow,
      nodes: flow.nodes.map((node) => {
        if (!Array.isArray(node.packages) || !Array.isArray(node.observables)) {
          return node;
        }

        // Exactly one tag is the whole precondition. Zero leaves nothing to inherit and two or more
        // leaves a choice that is the author's to make; both fall through to
        // `questUnresolvedObservablePackagesTransformer`, which names them rather than guessing.
        const [onlyPackage, secondPackage] = node.packages;
        if (onlyPackage === undefined || secondPackage !== undefined) {
          return node;
        }

        return {
          ...node,
          // An authored package always wins, including one the node does not tag: a mis-attributed
          // observable is a finding the attribution rule owes the author by name, and overwriting it
          // here would silently erase the claim instead of reporting it.
          observables: node.observables.map((observable) =>
            packageNameContract.safeParse(observable.package).success
              ? observable
              : { ...observable, package: onlyPackage },
          ),
        };
      }),
    };
  });
