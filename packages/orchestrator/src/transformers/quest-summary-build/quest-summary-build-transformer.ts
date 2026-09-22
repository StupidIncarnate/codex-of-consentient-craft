/**
 * PURPOSE: Computes a quest's whole verification state — per-flow, per-track mark counts; the
 * observables added after approval and by whom; every unit carrying debt with its evidence and the
 * action that would settle it; and the durable side-channel notes grouped by kind
 *
 * USAGE:
 * questSummaryBuildTransformer({ quest });
 * // Returns QuestSummary — the answer to "what actually happened on this quest?"
 *
 * questSummaryBuildTransformer({ quest, packageNames: operationItem.packageNames });
 * // The same summary narrowed to ONE operation item's package slice, so its numbers are the ones
 * // that item's own work list will compute
 *
 * PURE. It reads the quest it is handed and nothing else, so the same quest file always produces the
 * same summary and a caller can build one from an in-memory quest without touching disk.
 *
 * WHY THIS EXISTS. A quest reaches `complete` when its operations ledger drains, not when every unit
 * is marked `met` — a `cant-meet` settles a unit without proving it and an `unmet` leaves the work
 * open, and neither one holds the ledger. So `status: complete` is compatible with real holes, real
 * scope nobody approved, and real unanswered questions, and none of that is legible from a quest file
 * without re-deriving the enumeration by hand.
 *
 * THE FOUR COUNTS PARTITION THE DENOMINATOR, AND `unmet` NEVER FOLDS INTO `outstanding`. `unmet` is a
 * session of THIS track that looked at the unit and left work open; `outstanding` is a unit no session
 * of this track has marked at all. One has a verdict behind it and a successor owed to it, the other
 * has nobody — and a reader deciding what to pick up needs the two apart. `outstanding` is therefore
 * DERIVED (denominator minus the units this track marked) rather than counted, which is what makes
 * `met + cantMeet + unmet + outstanding` equal the denominator by construction.
 *
 * COUNTS ATTRIBUTE PER TRACK, off `workItem.role`. A unit a codeweaver work item marked `met` leaves
 * flowrider's row untouched and stays in flowrider's `outstanding`: two roles produce two independent
 * verdicts on the same unit, which is the whole reason marks moved onto the work item. The record read
 * is `workItem.observations` — the single per-unit record every role writes — and the ATTRIBUTION rule
 * is the one `qaChecklistBuildTransformer` already applies to `remainingItemIds`.
 *
 * LAST WRITE PER (UNIT, TRACK) WINS, BY WORK-ITEM ARRAY ORDER. A `review` step that marked a unit
 * `unmet` mints a successor, and that successor's `met` is the track's current verdict. Array order is
 * what the router itself reads for "the last work item on this scope" — `createdAt` is not, because a
 * parallel batch is minted inside one persist and shares a timestamp.
 *
 * THE DENOMINATOR IS PER-TRACK, AND IT IS DATA. Every exclusion comes from `stepScopeStatics`, never
 * from a comparison invented here:
 *
 * - FLOW TYPE. A track only gets a row on a flow whose type it measures. The authoring tracks
 *   measure runtime flows alone, so an operational flow carries a codeweaver row and nothing else —
 *   printing a flowrider `outstanding` there would report work no Flowrider session will ever do.
 * - UNIT KIND. The off-map probe families are Siegemaster's charter and are absent from the
 *   authoring tracks' unit kinds, so they never land in their numbers.
 * - PROVENANCE. This is the subtle one. The relay runs
 *   spec → chaoswhisperer → codeweaver → flowrider → siegemaster, so an observable a Siegemaster
 *   walker added mid-walk did not exist while the authoring tracks were working and can never
 *   receive their mark. `observableOrigins` omits `siegemaster` on both for exactly that reason, and
 *   filtering on it is what keeps such an observable out of their `outstanding` instead of parking
 *   it there forever. NO TIMESTAMP IS COMPARED — `at` records when a mark was written, not when a
 *   role's item completed, and ordering roles by wall-clock would break the moment a resumed session
 *   wrote out of order.
 * - PACKAGE KIND. A ROW IS KEYED ON THE DENOMINATOR TRACK, so `quest.packagesAffected` IS passed and
 *   each row narrows to the package kinds its own role measures. A single row per FIELD would fuse
 *   every role writing that field into one number no single track's work list computes.
 *
 * `packageNames` is an operation item's own slice and is threaded on top when a caller holds one,
 * because such a caller is asking exactly "what does MY work list say".
 *
 * THE DEBT LIST IS WHOLE-QUEST AND CARRIES EXACTLY THE UNPROVEN MARKS. One entry per (unit, track)
 * whose current mark is `cant-meet` or `unmet`, keyed on both because one unit can carry debt on more
 * than one track for different reasons. `met` is excluded — a proven unit is not debt — and so is an
 * `outstanding` unit, which has no evidence, no work item and no moment to report and is already
 * counted in its track's row. The entry copies `evidence`, `toSettle`, `workItemId` and `at` off the
 * observation so a reader can route the debt without re-joining to the work item.
 *
 * `midQuestObservables` DELIBERATELY IGNORES TRACK ELIGIBILITY. It answers "what did this quest grow
 * after the user approved it", which is a provenance question, not a coverage one — a Siegemaster
 * addition belongs on that list precisely because Flowrider's numbers exclude it.
 *
 * THE FINAL `.parse()` TAKES `unknown`, SO TYPESCRIPT GRADES NOTHING HERE. `questSummaryContract` and
 * `questSummaryTrackCountsContract` are `.strict()` for that reason: a field renamed in the contract
 * and missed here throws on the first call instead of being stripped in silence and rendering as a
 * defaulted zero.
 */

import type { PackageName, Quest, QuestSummary } from '@dungeonmaster/shared/contracts';
import {
  questNoteKindContract,
  questSummaryContract,
  signoffDenominatorTrackContract,
} from '@dungeonmaster/shared/contracts';

import { stepScopeStatics } from '../../statics/step-scope/step-scope-statics';
import { qaUnitEnumerateTransformer } from '../qa-unit-enumerate/qa-unit-enumerate-transformer';
import { qaUnitsInPackageScopeTransformer } from '../qa-units-in-package-scope/qa-units-in-package-scope-transformer';

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
  // that flow, its four counts and its share of the quest's debt.
  const trackScopes = enumeratedFlows.flatMap(({ flow, units }) =>
    signoffDenominatorTrackContract.options
      .filter((track) => {
        const familySteps = stepScopeStatics.byFamilyStep[track];
        const stepScope = 'review' in familySteps ? familySteps.review : familySteps.happyWalk;

        return new Set(stepScope.flowTypes.map(String)).has(flow.flowType);
      })
      .map((track) => {
        const familySteps = stepScopeStatics.byFamilyStep[track];
        const stepScope = 'review' in familySteps ? familySteps.review : familySteps.happyWalk;
        const eligibleKinds = new Set(stepScope.unitKinds.map(String));
        const eligibleOrigins = new Set(stepScope.observableOrigins.map(String));
        const eligibleMethods = new Set(stepScope.verificationMethods.map(String));

        const eligibleUnits = qaUnitsInPackageScopeTransformer({
          flow,
          units: units
            .filter((unit) => eligibleKinds.has(unit.kind))
            .filter((unit) => unit.kind !== 'observable' || eligibleOrigins.has(unit.addedBy))
            .filter(
              (unit) =>
                unit.kind !== 'observable' ||
                eligibleMethods.has(unit.verifyByReading === true ? 'reading' : 'test'),
            ),
          track,
          packagesAffected: quest.packagesAffected,
          packageNames,
          packageGraph: quest.packageGraph,
        });

        // THIS track's marks alone, keyed by unit. A later entry overwrites an earlier one, so the
        // map holds each unit's current verdict for this track and a re-minted successor supersedes
        // the `unmet` that minted it.
        const marksByUnitId = new Map(
          quest.workItems
            .filter((workItem) => workItem.role === track)
            .flatMap((workItem) =>
              workItem.observations.map(
                (observation) =>
                  [String(observation.unitId), { observation, workItemId: workItem.id }] as const,
              ),
            ),
        );

        const markedUnits = eligibleUnits.flatMap((unit) => {
          const mark = marksByUnitId.get(String(unit.id));

          return mark === undefined ? [] : [{ unit, ...mark }];
        });

        return {
          flowId: String(flow.id),
          track,
          met: markedUnits.filter(({ observation }) => observation.mark === 'met').length,
          cantMeet: markedUnits.filter(({ observation }) => observation.mark === 'cant-meet')
            .length,
          unmet: markedUnits.filter(({ observation }) => observation.mark === 'unmet').length,
          // Denominator minus what this track marked, so the four numbers reconcile against the unit
          // count without a fifth read of the same set that could disagree with them.
          outstanding: eligibleUnits.length - markedUnits.length,
          debt: markedUnits
            .filter(({ observation }) => observation.mark !== 'met')
            .map(({ unit, observation, workItemId }) => ({
              id: `${String(unit.id)}:${track}`,
              unitId: unit.id,
              flowId: unit.flowId,
              kind: unit.kind,
              track,
              mark: observation.mark,
              evidence: observation.evidence,
              // Spread rather than assigned: the debt contract REFUSES a `toSettle` on an `unmet`,
              // and `exactOptionalPropertyTypes` refuses an explicit `undefined` in its place.
              ...(observation.toSettle === undefined ? {} : { toSettle: observation.toSettle }),
              workItemId,
              at: observation.at,
            })),
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
          met: scope.met,
          cantMeet: scope.cantMeet,
          unmet: scope.unmet,
          outstanding: scope.outstanding,
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

    debt: trackScopes.flatMap((scope) => scope.debt),

    noteGroups: questNoteKindContract.options.map((kind) => ({
      id: kind,
      notes: quest.planningNotes.questNotes.filter((note) => note.kind === kind),
    })),
  });
};
