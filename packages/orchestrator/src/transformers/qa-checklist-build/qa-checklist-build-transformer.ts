/**
 * PURPOSE: Renders ONE flow's atomic verification units — every terminal, every labelled decision
 * branch, every embedded observable, and every off-map probe family — as the checklist a session
 * reads, with the walk's routes alongside them and the units still carrying no disposition in the
 * quest's QA ledger
 *
 * USAGE:
 * qaChecklistBuildTransformer({ flow, track: 'flowrider' });
 * // Returns QaChecklist whose `remainingItemIds` are the units awaiting a `flowriderSignoff`
 *
 * qaChecklistBuildTransformer({ flow, ledger: quest.planningNotes.qaLedger });
 * // Returns QaChecklist whose `remainingItemIds` are the units carrying no ledger disposition
 *
 * THE UNITS THEMSELVES COME FROM `qaUnitEnumerateTransformer`, which the signal-back completion
 * gate reads too. This file owns only the presentation on top of them: the label wording, the check
 * surface, the path walk, and the truncation. Sharing one enumerator is what makes the ids named in
 * a refused `done` the same strings this tool printed — a second derivation would drift silently,
 * and a gate naming ids the checklist never showed is indistinguishable from a hallucinating gate.
 *
 * `remainingItemIds` IS MEASURED THE WAY THE CALLER WILL BE JUDGED. Name a `track` and it is
 * `signoffFlowOutstandingTransformer` — the very call the completion gate makes — so the count a
 * session reads here is the count that will refuse its `done`, off-map and late-provenance
 * exclusions included. Omit the track and it falls back to the flow-wide ledger difference, which
 * is what a reader with no track in hand (a human, a whole-quest listing) is actually asking for.
 *
 * PASS THE PACKAGE SCOPE TOO, or the count over-reports. `packagesAffected` is what resolves a
 * node's tags to the package KINDS the named track measures, and `packageNames` is the operation
 * item's own slice — Flowrider's tail seed fans out to one item per package plus a seam item, and a
 * session reading a whole-quest remainder while its gate clears at zero is exactly the number that
 * makes an operator stop believing the checklist. Both are omitted by a caller holding no quest and
 * no item, and then nothing is narrowed.
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
  PackageName,
  QaChecklist,
  QuestPackageEntry,
  QuestQaLedgerEntry,
} from '@dungeonmaster/shared/contracts';
import {
  qaCheckSurfaceStatics,
  qaChecklistLimitsStatics,
  qaOffMapProbeStatics,
} from '@dungeonmaster/shared/statics';

import type { signoffTrackEligibilityStatics } from '../../statics/signoff-track-eligibility/signoff-track-eligibility-statics';
import { qaUnitEnumerateTransformer } from '../qa-unit-enumerate/qa-unit-enumerate-transformer';
import { qaWalkPathsTransformer } from '../qa-walk-paths/qa-walk-paths-transformer';
import { signoffFlowOutstandingTransformer } from '../signoff-flow-outstanding/signoff-flow-outstanding-transformer';

export const qaChecklistBuildTransformer = ({
  flow,
  ledger = [],
  track,
  packagesAffected = [],
  packageNames = [],
}: {
  flow: Flow;
  ledger?: readonly QuestQaLedgerEntry[];
  // Keyed on the ELIGIBILITY statics rather than `signoffTrackContract`, because there are three
  // denominators over two sign-off fields and `groundstomper` is one of them. Indexing the same
  // lookup the gate indexes is the compile-time pin that a new track cannot reach this surface
  // without a denominator to measure it against.
  track?: keyof typeof signoffTrackEligibilityStatics.byTrack;
  packagesAffected?: readonly QuestPackageEntry[];
  packageNames?: readonly PackageName[];
}): QaChecklist => {
  // The unit's own fields (anchors, source text, sign-offs) are spread in and `qaChecklistItem`'s
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
      checkSurface: qaCheckSurfaceStatics.byOutcomeType[unit.observableType],
    });
  });

  const allPaths = qaWalkPathsTransformer({ flow });
  const dispositionedIds = new Set(ledger.map((entry) => String(entry.itemId)));

  return qaChecklistContract.parse({
    flowId: flow.id,
    flowName: flow.name,
    entryPoint: flow.entryPoint,
    paths: allPaths.slice(0, qaChecklistLimitsStatics.maxPaths),
    pathsTruncated: allPaths.length > qaChecklistLimitsStatics.maxPaths,
    items,
    remainingItemIds:
      track === undefined
        ? items.filter((item) => !dispositionedIds.has(String(item.id))).map((item) => item.id)
        : signoffFlowOutstandingTransformer({ flow, track, packagesAffected, packageNames }),
  });
};
