/**
 * PURPOSE: Renders ONE flow's atomic verification units — every terminal, every labelled decision
 * branch, every embedded observable, and every off-map probe family — as the checklist a session
 * reads, with the walk's routes alongside them and all units initially remaining for verification
 *
 * USAGE:
 * qaChecklistBuildTransformer({ flow });
 * // Returns QaChecklist whose `remainingItemIds` are all units in the flow initially remaining
 *
 * THE UNITS THEMSELVES COME FROM `qaUnitEnumerateTransformer`, which the quest summary reads too.
 * This file owns only the presentation on top of them: the label wording, the check surface, the
 * path walk, and the truncation. Sharing one enumerator is what makes the ids this tool prints the
 * same ids every other reader of a track's coverage names — a second derivation would drift
 * silently.
 *
 * `remainingItemIds` IS THE WORK LIST, NOT A GATE. With sign-off fields retired from flows, all
 * checklist items are initially remaining, subject to verification by work items.
 *
 * NO MODEL IS IN THIS LOOP, and that is the entire point. A session asked to enumerate a
 * 45-observable flow summarises, drops the tail, or paraphrases the wording; this walks the data
 * and cannot. Ids are derived from the graph rather than minted, so re-running against an unchanged
 * flow reproduces byte-identical ids and a later session resumes against what a predecessor
 * actually landed instead of re-deriving its pass from prose.
 *
 * Every observable's `checkSurface` comes from `qaCheckSurfaceStatics.byOutcomeType`, indexed
 * directly rather than defensively: the key set is exactly `outcomeTypeContract`'s options, so
 * adding an outcome type without a surface is a COMPILE error here rather than a blank surface
 * shipped to a walker.
 *
 * Observables are the definition of done, terminals and branches are the shape of the walk, and the
 * off-map families are emitted for every flow unconditionally — a flow graph only shows the paths
 * its author imagined, so the families can only leave the ledger carrying a real observation or an
 * explicit justified `gap`.
 */

import { qaChecklistContract, qaChecklistItemContract } from '@dungeonmaster/shared/contracts';
import type {
  Flow,
  PackageGraphEntry,
  PackageName,
  QaChecklist,
  QuestPackageEntry,
} from '@dungeonmaster/shared/contracts';
import {
  qaCheckSurfaceStatics,
  qaChecklistLimitsStatics,
  qaOffMapProbeStatics,
} from '@dungeonmaster/shared/statics';

import type { stepScopeStatics } from '../../statics/step-scope/step-scope-statics';
import { qaUnitEnumerateTransformer } from '../qa-unit-enumerate/qa-unit-enumerate-transformer';
import { qaWalkPathsTransformer } from '../qa-walk-paths/qa-walk-paths-transformer';

export const qaChecklistBuildTransformer = ({
  flow,
}: {
  flow: Flow;
  // Keyed on stepScopeStatics rather than retired signoffTrackEligibilityStatics.
  track?: keyof typeof stepScopeStatics.byFamilyStep;
  packagesAffected?: readonly QuestPackageEntry[];
  packageNames?: readonly PackageName[];
  packageGraph?: readonly PackageGraphEntry[];
}): QaChecklist => {
  // The unit's own fields (anchors, source text) are spread in and `qaChecklistItem`'s
  // schema strips whatever it does not declare, so this file adds exactly the two rendered fields.
  const items = qaUnitEnumerateTransformer({ flow }).map((unit) => {
    if (unit.kind === 'terminal') {
      return qaChecklistItemContract.parse({
        ...unit,
        label: unit.nodeLabel,
        checkSurface: qaCheckSurfaceStatics.byKind.terminal,
      });
    }

    if (unit.kind === 'branch') {
      return qaChecklistItemContract.parse({
        ...unit,
        label: `${String(unit.edgeFrom)} —"${String(unit.edgeLabel)}"→ ${String(unit.edgeTo)}`,
        checkSurface: qaCheckSurfaceStatics.byKind.branch,
      });
    }

    if (unit.kind === 'off-map') {
      return qaChecklistItemContract.parse({
        ...unit,
        label: qaOffMapProbeStatics.byFamily[unit.offMapFamily],
        checkSurface: qaCheckSurfaceStatics.byKind['off-map'],
      });
    }

    return qaChecklistItemContract.parse({
      ...unit,
      // A blank description is a spec hole, not a reason to omit the unit — dropping it here
      // would quietly shrink the definition of done for the whole flow.
      label:
        String(unit.observableDescription).length > 0
          ? unit.observableDescription
          : `(observable ${String(unit.observableId)} on node ${String(unit.nodeId)} carries no description — a spec hole. Walk the behaviour the node's own text implies, and report the hole.)`,
      // `readCheck` OVERRIDES the type's surface. The type stays honest — a read-check is routinely
      // a `custom` invariant — but a surface sentence telling a session to drive the real path and
      // inspect the result is unfollowable for a criterion about which file a literal lives in, and
      // a session that follows it anyway reports a green it never measured.
      checkSurface:
        unit.verifyByReading === true
          ? qaCheckSurfaceStatics.readCheck
          : qaCheckSurfaceStatics.byOutcomeType[unit.observableType],
    });
  });

  const allPaths = qaWalkPathsTransformer({ flow });

  return qaChecklistContract.parse({
    flowId: flow.id,
    flowName: flow.name,
    entryPoint: flow.entryPoint,
    paths: allPaths.slice(0, qaChecklistLimitsStatics.maxPaths),
    pathsTruncated: allPaths.length > qaChecklistLimitsStatics.maxPaths,
    items,
    remainingItemIds: items.map((item) => item.id),
  });
};
