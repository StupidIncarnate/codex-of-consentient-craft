/**
 * PURPOSE: Assembles everything ONE dispatched session needs to start — its identity, its scope,
 * the units it was assigned and the ones its step is answerable for, its brief, what the sessions
 * before it left, and the git / ward / lane state it would otherwise have to run commands to learn.
 * Reach for this over `questGetQaChecklistBroker`, whose derivation it reuses: that one answers
 * "what does this flow contain" for a renderer, and this one answers "what am I and what do I owe"
 * for the session about to run.
 *
 * USAGE:
 * await questGetQuestWorkBroker({ questId, workItemId });
 * // Returns QuestWorkView, already cut to fit the MCP verbatim ceiling
 *
 * `assignedUnits` READS `workItem.assignedUnitIds` AND NOTHING ELSE. The piece's own list is
 * INTENT: the router re-filters it at dispatch to what is still unsettled and writes its decision
 * onto the work item. Serving the piece's list hands a session units its predecessor already
 * settled, and the signal gate then counts a denominator the router never assigned.
 *
 * `mintingObservation` RESOLVES THROUGH `mintedBy`, NEVER `insertedBy`. `mintedBy` names the work
 * item whose `unmet` caused this one to exist — the walker whose measured block a fixer quotes.
 * `insertedBy` means "a retry was spliced for this failed item", which
 * `work-items-to-quest-status-transformer` reads to derive completion; following it would hand a
 * fixer a ward red where it needed a walk.
 *
 * A LIVE WORK ITEM IS `!isTerminalWorkItemStatusGuard`, never `isActiveWorkItemStatusGuard`.
 * `pending` carries `isActive: false`, so the active guard drops a work item the router has minted
 * and not yet dispatched — which is the unit-claimed-by-nobody case the in-scope gate exists to
 * prevent.
 *
 * THE RETURN IS TRUNCATED LAST, after everything is assembled. `mcpToolResultStatics` bounds the
 * SERIALIZED string, so nothing can decide whether a section fits until the whole object exists.
 */

import { pathJoinAdapter } from '@dungeonmaster/shared/adapters';
import { filePathContract, stepNameContract } from '@dungeonmaster/shared/contracts';
import type { Quest, QuestId, QuestWorkItemId } from '@dungeonmaster/shared/contracts';
import { locationsStatics } from '@dungeonmaster/shared/statics';
import { questFlowSliceTransformer } from '@dungeonmaster/shared/transformers';

import { agentStepNodeContract } from '../../../contracts/agent-step-node/agent-step-node-contract';
import { questWorkViewContract } from '../../../contracts/quest-work-view/quest-work-view-contract';
import type { QuestWorkView } from '../../../contracts/quest-work-view/quest-work-view-contract';
import { agentFlowStatics } from '../../../statics/agent-flow/agent-flow-statics';
import { qaChecklistBuildTransformer } from '../../../transformers/qa-checklist-build/qa-checklist-build-transformer';
import { questWorkTruncateTransformer } from '../../../transformers/quest-work-truncate/quest-work-truncate-transformer';
import { questWorkUnitsTransformer } from '../../../transformers/quest-work-units/quest-work-units-transformer';
import { stepInScopeUnitsTransformer } from '../../../transformers/step-in-scope-units/step-in-scope-units-transformer';
import { workItemFamilyResolveTransformer } from '../../../transformers/work-item-family-resolve/work-item-family-resolve-transformer';
import { workItemLinkedOperationResolveTransformer } from '../../../transformers/work-item-linked-operation-resolve/work-item-linked-operation-resolve-transformer';
import { plannedWorkReadBroker } from '../../planned-work/read/planned-work-read-broker';
import { questFindQuestPathBroker } from '../find-quest-path/quest-find-quest-path-broker';
import { questLoadBroker } from '../load/quest-load-broker';
import { gitRowsLayerBroker } from './git-rows-layer-broker';
import { wardRowsLayerBroker } from './ward-rows-layer-broker';

export const questGetQuestWorkBroker = async ({
  questId,
  workItemId,
}: {
  questId: QuestId;
  workItemId: QuestWorkItemId;
}): Promise<QuestWorkView> => {
  const { questPath } = await questFindQuestPathBroker({ questId });
  const questFilePath = filePathContract.parse(
    pathJoinAdapter({ paths: [questPath, locationsStatics.quest.questFile] }),
  );
  const quest: Quest = await questLoadBroker({ questFilePath });

  const workItem = quest.workItems.find((item) => item.id === workItemId);

  if (workItem === undefined) {
    throw new Error(
      `get-quest-work: work item ${String(workItemId)} is not on quest ${String(questId)}`,
    );
  }

  const operationItem = workItemLinkedOperationResolveTransformer({ quest, workItem });

  if (operationItem === undefined) {
    throw new Error(
      `get-quest-work: work item ${String(workItemId)} has no linked operation item on quest ${String(questId)}, so it declares no scope — there is nothing to serve`,
    );
  }

  const family = workItemFamilyResolveTransformer({ quest, operationItem });

  if (family === undefined) {
    throw new Error(
      `get-quest-work: no family on quest type '${quest.questType}' carries role '${operationItem.role}', so work item ${String(workItemId)} runs no step graph`,
    );
  }

  // The family graph is read through `Object.entries` rather than indexed: `agentFamilyNameContract`
  // brands an OPEN string (families are data), and indexing a union of six differently-shaped
  // `steps` objects with one collapses its key set to `never`.
  const familyGraphs = Object.entries(agentFlowStatics).filter(
    (entry) => entry[0] === String(family),
  );
  const entryStep = familyGraphs.map((entry) => entry[1].entry).at(0);

  if (entryStep === undefined) {
    throw new Error(
      `get-quest-work: agentFlowStatics declares no '${String(family)}' step graph — it holds: ${Object.keys(agentFlowStatics).join(', ')}`,
    );
  }

  const step = stepNameContract.parse(workItem.step ?? entryStep);
  const stepNodes = familyGraphs.flatMap((entry) => Object.entries(entry[1].steps));
  // `agentStepNodeContract` rather than a member read: `Object.entries` over a union of six
  // differently-shaped `steps` maps widens the value to `any`, and an `any` walked into the return
  // is a role nothing checked.
  const role = stepNodes
    .filter((entry) => entry[0] === String(step))
    .flatMap((entry) => {
      const parsed = agentStepNodeContract.safeParse(entry[1]);

      return parsed.success ? [parsed.data.role] : [];
    })
    .at(0);

  if (role === undefined) {
    throw new Error(
      `get-quest-work: step \`${String(step)}\` is not declared in family \`${String(family)}\` — agentFlowStatics.${String(family)}.steps holds: ${stepNodes.map((entry) => entry[0]).join(', ')}`,
    );
  }

  const inScopeUnitIds = stepInScopeUnitsTransformer({
    quest,
    operationItemId: operationItem.id,
    step,
  });

  const inScopeUnits = questWorkUnitsTransformer({
    quest,
    operationItem,
    unitIds: inScopeUnitIds,
  });
  const assignedUnits = questWorkUnitsTransformer({
    quest,
    operationItem,
    unitIds: workItem.assignedUnitIds,
  });

  const scopedFlows = quest.flows.filter((flow) =>
    operationItem.flowIds.some((flowId) => String(flowId) === String(flow.id)),
  );

  // The package narrows the render only when the item names exactly one: a codeweaver cell owns one
  // package's half of the flow and reads it marked, where a flowrider or siegemaster item spans
  // several and is handed the whole flow with nothing marked.
  const [onlyPackageName] = operationItem.packageNames;
  const renderPackage =
    operationItem.packageNames.length === 1 && onlyPackageName !== undefined
      ? { packageName: onlyPackageName }
      : {};

  // A flow-less cell still gets a render: `questFlowSliceTransformer` with no `flowId` is the
  // FOUNDATION view — every contract that package owns and which flows it tags nodes in — which is
  // the only useful answer for an item whose whole scope is contracts.
  const flows =
    scopedFlows.length === 0 && operationItem.packageNames.length > 0
      ? [{ flowId: null, rendered: questFlowSliceTransformer({ quest, ...renderPackage }) }]
      : scopedFlows.map((flow) => ({
          flowId: flow.id,
          rendered: questFlowSliceTransformer({ quest, flowId: flow.id, ...renderPackage }),
        }));

  const checklists = scopedFlows.map((flow) =>
    qaChecklistBuildTransformer({
      flow,
      packagesAffected: quest.packagesAffected,
      packageNames: operationItem.packageNames,
    }),
  );

  const plan = await plannedWorkReadBroker({
    questFolderPath: questPath,
    operationItemId: operationItem.id,
  });

  const piece = (plan?.batches ?? [])
    .flatMap((batch) => batch.pieces)
    .find((candidate) => String(candidate.id) === String(workItem.pieceId));

  const minter =
    workItem.mintedBy === undefined
      ? undefined
      : quest.workItems.find((item) => item.id === workItem.mintedBy);
  const assignedUnitIdSet = new Set(workItem.assignedUnitIds.map(String));
  const mintingObservation = minter?.observations.find((observation) =>
    assignedUnitIdSet.has(String(observation.unitId)),
  );

  const inScopeUnitIdSet = new Set(inScopeUnits.map((unit) => String(unit.unitId)));
  const [scopeFlowId] = operationItem.flowIds;

  const sessionNotes = quest.planningNotes.questNotes.filter((note) => {
    const isQuestWide = note.flowId === undefined && note.unitId === undefined;
    const matchesFlow = note.flowId !== undefined && String(note.flowId) === String(scopeFlowId);
    const matchesUnit = note.unitId !== undefined && inScopeUnitIdSet.has(String(note.unitId));

    return isQuestWide || matchesFlow || matchesUnit;
  });

  const recipes = scopedFlows.flatMap((flow) =>
    flow.recipes.map((recipe) => ({ name: recipe.id, provenRunId: recipe.runId })),
  );

  // The ROUTER records the instance it started on the work item's payload and this serves what is
  // recorded — it starts nothing. `null` on every step that does not declare `needsLane`.
  const recordedInstance = questWorkViewContract.shape.instance.safeParse(
    workItem.payload?.instance ?? null,
  );

  // A baseline is the happy walk's own run, resolved from the attacking piece's `baselineFor`
  // through the `walked` note that piece's work item left. An attack is an ABSENCE claim, and an
  // absence is only evidence against a known-good reading taken first.
  const baselineWorkItem =
    piece?.baselineFor === undefined
      ? undefined
      : quest.workItems.find((item) => String(item.pieceId) === String(piece.baselineFor));
  const baselineNote = quest.planningNotes.questNotes.find(
    (note) =>
      note.kind === 'walked' &&
      baselineWorkItem !== undefined &&
      note.workItemId === baselineWorkItem.id &&
      note.instanceId !== undefined &&
      note.instanceId !== null &&
      note.runId !== undefined &&
      note.runId !== null,
  );

  const [gitRows, wardRows] = await Promise.all([
    gitRowsLayerBroker({ questId, quest }),
    wardRowsLayerBroker({ questPath, quest }),
  ]);

  const view = questWorkViewContract.parse({
    questId,
    workItemId,
    family,
    step,
    role,
    scope: {
      flowId: scopeFlowId ?? null,
      packageNames: operationItem.packageNames,
      operationItemId: operationItem.id,
      operationItemText: operationItem.text,
    },
    assignedUnits,
    inScopeUnits,
    flows,
    walkPaths: checklists.flatMap((checklist) => checklist.paths),
    pathsTruncated: checklists.some((checklist) => checklist.pathsTruncated),
    piece:
      piece === undefined
        ? null
        : {
            pieceId: piece.id,
            step: piece.step,
            context: piece.context,
            recipeId: piece.recipeId ?? null,
            baselineFor: piece.baselineFor ?? null,
            contextUnitIds: piece.contextUnitIds,
            payload: piece.payload ?? {},
          },
    plannerNotes: piece?.notes ?? [],
    sessionNotes,
    mintingObservation: mintingObservation ?? null,
    recipes,
    uncommittedPaths: gitRows.uncommittedPaths,
    committedPaths: gitRows.committedPaths,
    ward: wardRows.ward,
    riftcarverLogPath: wardRows.riftcarverLogPath,
    git: gitRows.git,
    instance: recordedInstance.success ? recordedInstance.data : null,
    baseline:
      baselineWorkItem === undefined ||
      baselineNote === undefined ||
      piece?.baselineFor === undefined
        ? null
        : {
            pieceId: piece.baselineFor,
            workItemId: baselineWorkItem.id,
            instanceId: baselineNote.instanceId,
            runId: baselineNote.runId,
          },
    truncated: [],
  });

  return questWorkTruncateTransformer({ view });
};
