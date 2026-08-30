/**
 * PURPOSE: Applies the two PACKAGE narrowings a verification denominator carries — the track's
 * package KINDS and the operation item's own declared package NAMES — in one place, so
 * `get-qa-checklist` and the quest summary cannot disagree about which units an
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
 * NAMES AND KINDS ARE INDEPENDENT INPUTS. `packagesAffected` resolves a node's names to KINDS, which
 * is what a track's `packageTypes` narrows on; `packageNames` is the item's own slice and needs no
 * resolution at all, so an item still narrows correctly on a quest whose `packagesAffected` is
 * empty or lags its node tags.
 *
 * A NAME RESOLVES TO A SET OF KINDS, not one. A package can be several — widgets+react behind a
 * hono adapter is browser-reachable AND an http-backend — and each entry's stamped set is what says
 * so, since the detector's priority table names a single winner and returns.
 *
 * `packageNames` NARROWS BY INTERSECTION for every track — an item owns every unit whose node tags
 * ANY of its names, glue included. No track mints a seam item, so a glue unit a stricter reading
 * dropped would be owned by nobody at all. Each track declares that as
 * `signoffTrackEligibilityStatics.byTrack[track].packageScope`, so a track that needs a different
 * rule declares it there and gets a branch here rather than a role comparison.
 *
 * NOTHING IS EXCLUDED ON DATA THAT CANNOT BE RESOLVED. A unit hanging off no node, a node the flow
 * does not carry, and a node tagged with a package absent from `packagesAffected` all stay in. A
 * multi-package item also keeps a glue unit whose packages it does not name. Every one of those is
 * over-inclusion, which leaves the gate binding; the alternative empties a denominator on incomplete
 * data, which silently turns the gate off — the one failure this narrowing exists not to cause.
 */

import type { Flow, PackageName, QuestPackageEntry } from '@dungeonmaster/shared/contracts';
import { questPackageEntryKindsTransformer } from '@dungeonmaster/shared/transformers';

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
  // The entry's KIND SET, never its single display label — a package can be more than one kind, and
  // the detector's priority table reports only the first match, so a package that serves HTTP and
  // also renders widgets would resolve wholly to one track and drop out of the other's denominator.
  const packageKindsByName = new Map(
    packagesAffected.map((entry) => [
      String(entry.name),
      questPackageEntryKindsTransformer({ entry }).map(String),
    ]),
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

    const owningPackageTypes = owningPackages.flatMap((name) => packageKindsByName.get(name) ?? []);

    const outOfKind =
      owningPackageTypes.length > 0 &&
      !owningPackageTypes.some((packageType) => eligiblePackageTypes.has(packageType));

    if (outOfKind) {
      return false;
    }

    if (declaredNames.size === 0) {
      return true;
    }

    return owningPackages.some((name) => declaredNames.has(name));
  });
};
