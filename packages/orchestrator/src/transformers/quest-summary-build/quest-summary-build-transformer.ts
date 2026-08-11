/**
 * PURPOSE: Computes a quest's whole verification state — per-flow, per-track sign-off counts; the
 * observables added after approval and by whom; every `unconfirmable` verdict with its reason and
 * its question; and the durable side-channel notes grouped by kind
 *
 * USAGE:
 * questSummaryBuildTransformer({ quest });
 * // Returns QuestSummary — the answer to "what actually happened on this quest?"
 *
 * questSummaryBuildTransformer({ quest, packageNames: operationItem.packageNames });
 * // The same summary narrowed to ONE operation item's package slice, so its numbers are the ones
 * // that item's completion gate will compute
 *
 * PURE. It reads the quest it is handed and nothing else, so the same quest file always produces the
 * same summary and a caller can build one from an in-memory quest without touching disk.
 *
 * WHY THIS EXISTS. A quest reaches `complete` when both tracks have SIGNED every unit, and
 * `unconfirmable` signs a unit exactly as `confirmed` does — the completion gate refuses the ABSENCE
 * of a verdict, never an honest one. So `status: complete` is compatible with real holes, real scope
 * nobody approved, and real unanswered questions, and none of that is legible from a quest file
 * without re-deriving the enumeration by hand.
 *
 * THE DENOMINATOR IS PER-TRACK, AND IT IS DATA. Every exclusion comes from
 * `signoffTrackEligibilityStatics`, never from a comparison invented here:
 *
 * - FLOW TYPE. A track only gets a row on a flow whose type it measures. The authoring tracks
 *   measure runtime flows alone, so an operational flow carries a siegemaster row and nothing else —
 *   printing a flowrider `outstanding` there would report work no Flowrider session will ever do.
 * - UNIT KIND. The off-map probe families are Siegemaster's charter and are absent from the
 *   authoring tracks' unit kinds, so they never land in their numbers.
 * - PROVENANCE. This is the subtle one. The relay runs
 *   spec → chaoswhisperer → codeweaver → flowrider → groundstomper → siegemaster, so an observable a
 *   Siegemaster walker added mid-walk did not exist while the authoring tracks were working and can
 *   never receive their sign-off. `observableOrigins` omits `siegemaster` on both for exactly that
 *   reason, and filtering on it is what keeps such an observable out of their `outstanding` instead
 *   of parking it there forever. NO TIMESTAMP IS COMPARED — `at` records when a sign-off was
 *   written, not when a role's item completed, and ordering roles by wall-clock would break the
 *   moment a resumed session wrote out of order.
 * - PACKAGE KIND. A ROW IS KEYED ON THE DENOMINATOR TRACK, so `quest.packagesAffected` IS passed and
 *   each row narrows to the package kinds its own role measures. Flowrider and Groundstomper both
 *   write `flowriderSignoff` over kinds that are DISJOINT and whose union is Siegemaster's, so the
 *   three rows partition a flow's units between them: nothing counted twice, and nothing — the
 *   browser-reachable half included — left counted in no row. A single row per sign-off FIELD would
 *   fuse the two roles into one number neither one's completion gate computes.
 *
 * `outstanding` IS TAKEN FROM `signoffFlowOutstandingTransformer`, the same call the signal-back
 * completion gate and `get-qa-checklist` both make, handed the same `packagesAffected`. The number a
 * reader sees here is therefore the number that will refuse a `done`, rather than a second
 * derivation that can drift from it. `packageNames` is the operation item's own slice and is
 * threaded on top when a caller holds one, because such a caller is asking exactly "what will MY
 * gate say".
 *
 * `midQuestObservables` DELIBERATELY IGNORES TRACK ELIGIBILITY. It answers "what did this quest grow
 * after the user approved it", which is a provenance question, not a coverage one — a Siegemaster
 * addition belongs on that list precisely because Flowrider's numbers exclude it.
 */

import type { PackageName, Quest, QuestSummary } from '@dungeonmaster/shared/contracts';
import {
  questNoteKindContract,
  questSummaryContract,
  signoffDenominatorTrackContract,
} from '@dungeonmaster/shared/contracts';

import { signoffTrackEligibilityStatics } from '../../statics/signoff-track-eligibility/signoff-track-eligibility-statics';
import { qaUnitEnumerateTransformer } from '../qa-unit-enumerate/qa-unit-enumerate-transformer';
import { qaUnitsInPackageScopeTransformer } from '../qa-units-in-package-scope/qa-units-in-package-scope-transformer';
import { signoffFlowOutstandingTransformer } from '../signoff-flow-outstanding/signoff-flow-outstanding-transformer';

export const questSummaryBuildTransformer = ({
  quest,
  packageNames = [],
}: {
  quest: Quest;
  packageNames?: readonly PackageName[];
}): QuestSummary => {
  // Enumerate ONCE per flow. Every list below is a different read of the same unit set, so
  // re-enumerating per list would let the reads disagree on a graph that changed underneath them.
  const enumeratedFlows = quest.flows.map((flow) => ({
    flow,
    units: qaUnitEnumerateTransformer({ flow }),
  }));

  // One scope per (flow, track) the track actually measures, carrying that track's denominator on
  // that flow. Both the coverage counts and the unconfirmable list read this, so a unit excluded
  // from the counts cannot appear in the list.
  const trackScopes = enumeratedFlows.flatMap(({ flow, units }) =>
    signoffDenominatorTrackContract.options
      .filter((track) =>
        new Set(signoffTrackEligibilityStatics.byTrack[track].flowTypes.map(String)).has(
          flow.flowType,
        ),
      )
      .map((track) => {
        const eligibility = signoffTrackEligibilityStatics.byTrack[track];
        const eligibleKinds = new Set(eligibility.unitKinds.map(String));
        const eligibleOrigins = new Set(eligibility.observableOrigins.map(String));

        return {
          flowId: String(flow.id),
          flow,
          track,
          signoffField: eligibility.signoffField,
          eligibleUnits: qaUnitsInPackageScopeTransformer({
            flow,
            units: units
              .filter((unit) => eligibleKinds.has(unit.kind))
              .filter((unit) => unit.kind !== 'observable' || eligibleOrigins.has(unit.addedBy)),
            track,
            packagesAffected: quest.packagesAffected,
            packageNames,
          }),
        };
      }),
  );

  return questSummaryContract.parse({
    questId: quest.id,

    flows: enumeratedFlows.map(({ flow }) => ({
      id: flow.id,
      name: flow.name,
      flowType: flow.flowType,
      tracks: trackScopes
        .filter((scope) => scope.flowId === String(flow.id))
        .map((scope) => ({
          id: scope.track,
          confirmed: scope.eligibleUnits.filter(
            (unit) => unit[scope.signoffField]?.verdict === 'confirmed',
          ).length,
          unconfirmable: scope.eligibleUnits.filter(
            (unit) => unit[scope.signoffField]?.verdict === 'unconfirmable',
          ).length,
          outstanding: signoffFlowOutstandingTransformer({
            flow,
            track: scope.track,
            packagesAffected: quest.packagesAffected,
            packageNames,
          }).length,
        })),
    })),

    midQuestObservables: enumeratedFlows.flatMap(({ units }) =>
      units.flatMap((unit) =>
        unit.kind === 'observable' && unit.addedBy !== 'spec'
          ? [
              {
                id: unit.id,
                flowId: unit.flowId,
                nodeId: unit.nodeId,
                observableId: unit.observableId,
                addedBy: unit.addedBy,
                observableType: unit.observableType,
                description: unit.observableDescription,
              },
            ]
          : [],
      ),
    ),

    unconfirmable: trackScopes.flatMap((scope) =>
      scope.eligibleUnits.flatMap((unit) => {
        const signoff = unit[scope.signoffField];

        return signoff === undefined || signoff.verdict !== 'unconfirmable'
          ? []
          : [
              {
                id: `${String(unit.id)}:${scope.track}`,
                unitId: unit.id,
                flowId: unit.flowId,
                kind: unit.kind,
                track: scope.track,
                signoff,
              },
            ];
      }),
    ),

    noteGroups: questNoteKindContract.options.map((kind) => ({
      id: kind,
      notes: quest.planningNotes.questNotes.filter((note) => note.kind === kind),
    })),
  });
};
