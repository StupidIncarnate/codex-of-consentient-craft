/**
 * PURPOSE: Names the observables `questResolvedObservablePackagesTransformer` could not fill in, so
 * the write is refused with the offending observable, its node, and the tags it must choose between
 * — rather than by the raw ZodError the persisted contract's required `package` would otherwise
 * throw, which carries no `failedChecks` at all. Reach for this over
 * `questObservableAttributionViolationsTransformer`, which asks whether a package that IS there sits
 * on a side its node tags; this one asks only whether there is a package at all, and binds on every
 * write because no observable can reach disk without one.
 *
 * USAGE:
 * questUnresolvedObservablePackagesTransformer({flows: quest.flows});
 * // Returns ErrorMessage[] — one sentence per observable still carrying no package
 */
import { errorMessageContract, packageNameContract } from '@dungeonmaster/shared/contracts';
import type { ErrorMessage, Flow } from '@dungeonmaster/shared/contracts';

export const questUnresolvedObservablePackagesTransformer = ({
  flows,
}: {
  flows: Flow[];
}): ErrorMessage[] => {
  const offenders: ErrorMessage[] = [];

  for (const flow of flows) {
    // Runs on the raw merge output, before the whole-quest re-parse applies the array defaults, so a
    // flow or node this write created may carry neither key yet. Nothing to walk is nothing to
    // report — an untagged node with no observables is `questNodePackageCoverageViolationsTransformer`'s
    // finding, not this one's.
    if (!Array.isArray(flow.nodes)) {
      continue;
    }

    for (const node of flow.nodes) {
      if (!Array.isArray(node.observables)) {
        continue;
      }

      const nodePackages = Array.isArray(node.packages)
        ? node.packages.map((name) => String(name))
        : [];
      const tagList = nodePackages.length === 0 ? 'none' : nodePackages.join(', ');

      for (const observable of node.observables) {
        // The persisted contract's own schema is the predicate, so this can never disagree with the
        // parse it is standing in front of.
        if (packageNameContract.safeParse(observable.package).success) {
          continue;
        }

        offenders.push(
          errorMessageContract.parse(
            `Observable '${String(observable.id)}' on node '${String(node.id)}' in flow '${String(flow.id)}' names no package, and its node tags ${tagList}. An omitted package is filled in from the owning node only when that node tags exactly ONE — state the package this observable is read in, drawn from the ones its node already tags, or retag the node.`,
          ),
        );
      }
    }
  }

  return offenders;
};
