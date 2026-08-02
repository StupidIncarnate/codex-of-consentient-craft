/**
 * PURPOSE: Decomposes ONE flow into its complete set of atomic verification units — every terminal,
 * every labelled decision branch, every embedded observable, and every off-map probe family — and
 * reports which of them still carry no disposition in the quest's QA ledger
 *
 * USAGE:
 * qaChecklistBuildTransformer({ flow, ledger: quest.planningNotes.qaLedger });
 * // Returns QaChecklist — the complete surface, plus `remainingItemIds`
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

import {
  qaChecklistContract,
  qaChecklistItemContract,
  qaOffMapFamilyContract,
} from '@dungeonmaster/shared/contracts';
import type { Flow, QaChecklist, QuestQaLedgerEntry } from '@dungeonmaster/shared/contracts';
import {
  qaCheckSurfaceStatics,
  qaChecklistLimitsStatics,
  qaOffMapProbeStatics,
} from '@dungeonmaster/shared/statics';

import { qaWalkPathsTransformer } from '../qa-walk-paths/qa-walk-paths-transformer';

export const qaChecklistBuildTransformer = ({
  flow,
  ledger = [],
}: {
  flow: Flow;
  ledger?: readonly QuestQaLedgerEntry[];
}): QaChecklist => {
  const flowId = String(flow.id);
  const nodesWithOutgoing = new Set(flow.edges.map((edge) => String(edge.from)));

  const terminalItems = flow.nodes
    .filter((node) => !nodesWithOutgoing.has(String(node.id)))
    .map((node) =>
      qaChecklistItemContract.parse({
        id: `${flowId}:terminal:${String(node.id)}`,
        flowId: flow.id,
        kind: 'terminal',
        nodeId: node.id,
        label: node.label,
        checkSurface: qaCheckSurfaceStatics.byKind.terminal,
      }),
    );

  const branchItems = flow.edges
    .filter((edge) => edge.label !== undefined && String(edge.label).length > 0)
    .map((edge) =>
      qaChecklistItemContract.parse({
        id: `${flowId}:branch:${String(edge.id)}`,
        flowId: flow.id,
        kind: 'branch',
        edgeId: edge.id,
        label: `${String(edge.from)} —"${String(edge.label)}"→ ${String(edge.to)}`,
        checkSurface: qaCheckSurfaceStatics.byKind.branch,
      }),
    );

  const observableItems = flow.nodes.flatMap((node) =>
    node.observables.map((observable) =>
      qaChecklistItemContract.parse({
        id: `${flowId}:observable:${String(observable.id)}`,
        flowId: flow.id,
        kind: 'observable',
        nodeId: node.id,
        observableId: observable.id,
        observableType: observable.type,
        // A blank description is a spec hole, not a reason to omit the unit — dropping it here
        // would quietly shrink the definition of done for the whole flow.
        label:
          String(observable.description).length > 0
            ? observable.description
            : `(observable ${String(observable.id)} on node ${String(node.id)} carries no description — a spec hole. Walk the behaviour the node's own text implies, and report the hole.)`,
        checkSurface: qaCheckSurfaceStatics.byOutcomeType[observable.type],
      }),
    ),
  );

  const offMapItems = qaOffMapFamilyContract.options.map((family) =>
    qaChecklistItemContract.parse({
      id: `${flowId}:off-map:${family}`,
      flowId: flow.id,
      kind: 'off-map',
      offMapFamily: family,
      label: qaOffMapProbeStatics.byFamily[family],
      checkSurface: qaCheckSurfaceStatics.byKind['off-map'],
    }),
  );

  const items = [...terminalItems, ...branchItems, ...observableItems, ...offMapItems];
  const allPaths = qaWalkPathsTransformer({ flow });
  const dispositionedIds = new Set(ledger.map((entry) => String(entry.itemId)));

  return qaChecklistContract.parse({
    flowId: flow.id,
    flowName: flow.name,
    entryPoint: flow.entryPoint,
    paths: allPaths.slice(0, qaChecklistLimitsStatics.maxPaths),
    pathsTruncated: allPaths.length > qaChecklistLimitsStatics.maxPaths,
    items,
    remainingItemIds: items
      .filter((item) => !dispositionedIds.has(String(item.id)))
      .map((item) => item.id),
  });
};
