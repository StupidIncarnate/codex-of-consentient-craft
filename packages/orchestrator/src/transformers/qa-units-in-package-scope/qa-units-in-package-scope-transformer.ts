/**
 * PURPOSE: Applies the two PACKAGE narrowings a verification denominator carries — the track's
 * package KINDS and the operation item's own declared package NAMES — in one place, so the
 * completion gate, `get-qa-checklist` and the quest summary cannot disagree about which units an
 * item is measured over. Reach for this whenever a caller holds units plus a track;
 * `signoffFlowOutstandingTransformer` is the caller that also applies kind, provenance and
 * sign-off state on top.
 *
 * USAGE:
 * qaUnitsInPackageScopeTransformer({ flow, units, track: 'flowrider', packageNames: ['web'] });
 * // Returns the subset of `units` that flowrider item is measured over
 *
 * A UNIT ROUTES BY ITS OWNING NODE, NEVER BY ITS OBSERVABLE. Only one of the four unit kinds is an
 * observable — terminals and branches are properties of the graph, and a decision node carrying no
 * observables at all still emits branch units — so the owning node is the node itself for a terminal
 * or an observable, and the node an edge LEAVES for a branch, since that is where the decision is
 * taken. An off-map family hangs off no node.
 *
 * NAMES AND KINDS ARE INDEPENDENT INPUTS. `packagesAffected` resolves a node's names to KINDS and is
 * what splits Groundstomper from Flowrider; `packageNames` is the item's own slice and needs no
 * resolution at all, so an item still narrows correctly on a quest whose `packagesAffected` is
 * empty or lags its node tags.
 *
 * HOW `packageNames` NARROWS is `signoffTrackEligibilityStatics.byTrack[track].packageScope`, so the
 * seam rule is data rather than a role comparison here. Under `partition` a one-name item owns the
 * units whose node tags exactly that package and a many-name item owns the glue units — which is
 * what makes Flowrider's N per-package items plus one seam item a true partition, each with a pt
 * budget that means something. Under `intersection` an item owns every unit whose node tags any of
 * its names, glue included.
 *
 * NOTHING IS EXCLUDED ON DATA THAT CANNOT BE RESOLVED. A unit hanging off no node, a node the flow
 * does not carry, and a node tagged with a package absent from `packagesAffected` all stay in. A
 * multi-package item also keeps a glue unit whose packages it does not name. Every one of those is
 * over-inclusion, which leaves the gate binding; the alternative empties a denominator on incomplete
 * data, which silently turns the gate off — the one failure this narrowing exists not to cause.
 */

import type { Flow, PackageName, QuestPackageEntry } from '@dungeonmaster/shared/contracts';

import type { QaVerificationUnit } from '../../contracts/qa-verification-unit/qa-verification-unit-contract';
import { signoffTrackEligibilityStatics } from '../../statics/signoff-track-eligibility/signoff-track-eligibility-statics';

export const qaUnitsInPackageScopeTransformer = ({
  flow,
  units,
  track,
  packagesAffected = [],
  packageNames = [],
}: {
  flow: Flow;
  units: readonly QaVerificationUnit[];
  track: keyof typeof signoffTrackEligibilityStatics.byTrack;
  packagesAffected?: readonly QuestPackageEntry[];
  packageNames?: readonly PackageName[];
}): QaVerificationUnit[] => {
  const eligibility = signoffTrackEligibilityStatics.byTrack[track];
  const eligiblePackageTypes = new Set(eligibility.packageTypes.map(String));
  const declaredNames = new Set(packageNames.map(String));
  const packageTypeByName = new Map(
    packagesAffected.map((entry) => [String(entry.name), String(entry.packageType)]),
  );

  const nodePackagesById = new Map(
    flow.nodes.map((node) => [String(node.id), node.packages.map(String)]),
  );

  return units.filter((unit) => {
    const owningNodeId =
      unit.kind === 'off-map'
        ? undefined
        : unit.kind === 'branch'
          ? String(unit.edgeFrom)
          : String(unit.nodeId);
    const owningPackages =
      owningNodeId === undefined ? [] : (nodePackagesById.get(owningNodeId) ?? []);

    if (owningPackages.length === 0) {
      return true;
    }

    const owningPackageTypes = owningPackages.flatMap((name) => {
      const packageType = packageTypeByName.get(name);
      return packageType === undefined ? [] : [packageType];
    });

    const outOfKind =
      owningPackageTypes.length > 0 &&
      !owningPackageTypes.some((packageType) => eligiblePackageTypes.has(packageType));

    if (outOfKind) {
      return false;
    }

    if (declaredNames.size === 0) {
      return true;
    }

    if (eligibility.packageScope === 'partition') {
      // The item's ARITY is the marker, and it is the one `relayTailFanOutTransformer` already
      // writes: a per-package slice carries exactly one name, the seam slice carries the union of
      // the glue packages. So one name owns the units whose node tags that package ALONE, and more
      // than one owns the glue. Reading a per-package item as "any node including my package"
      // instead would hand every glue unit to two items at once, and leave the seam item — the
      // honest replacement for the whole-quest reconcile — owning nothing of its own.
      return owningPackages.length > 1
        ? declaredNames.size > 1
        : declaredNames.size === 1 && owningPackages.every((name) => declaredNames.has(name));
    }

    return owningPackages.some((name) => declaredNames.has(name));
  });
};
