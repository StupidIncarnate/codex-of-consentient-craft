/**
 * PURPOSE: After PathSeeker creates steps, generate the full work item chain
 *          (codeweaver[per package] -> ward -> flowrider[per flow, chained] ->
 *           siegemaster[per flow, chained] -> lawbringer -> blightwarden minions[5 parallel] ->
 *           blightwarden synthesizer -> final-ward). Codeweaver owns every folder type EXCEPT
 *           flows/ and startup/; those steps route to the per-flow flowrider items (which own the
 *           flow-perspective test suite). Flowrider items are emitted only when ≥1 flow/startup
 *           step exists.
 *
 * USAGE:
 * stepsToWorkItemsTransformer({ steps, flows, pathseekerWorkItemId, now });
 * // Returns: WorkItem[] with dependency chain wired (one flowriderItem + one siegeItem per flow)
 */

import { workItemContract } from '@dungeonmaster/shared/contracts';
import type {
  DependencyStep,
  Flow,
  FolderType,
  FolderTypeGroups,
  QuestWorkItemId,
  StepId,
  WorkItem,
} from '@dungeonmaster/shared/contracts';
import { folderTypeContract } from '@dungeonmaster/shared/contracts';
import { folderConfigStatics } from '@dungeonmaster/shared/statics';

import type { IsoTimestamp } from '../../contracts/iso-timestamp/iso-timestamp-contract';
import { blightwardenMinionRolesStatics } from '../../statics/blightwarden-minion-roles/blightwarden-minion-roles-statics';
import { flowTestOwnedFolderTypesStatics } from '../../statics/flow-test-owned-folder-types/flow-test-owned-folder-types-statics';
import { slotManagerStatics } from '../../statics/slot-manager/slot-manager-statics';
import { pathToFolderTypeTransformer } from '../path-to-folder-type/path-to-folder-type-transformer';
import { stepsToBatchChunksTransformer } from '../steps-to-batch-chunks/steps-to-batch-chunks-transformer';
import { stepsToPackageChunksTransformer } from '../steps-to-package-chunks/steps-to-package-chunks-transformer';

export const stepsToWorkItemsTransformer = ({
  steps,
  flows,
  pathseekerWorkItemId,
  now,
  batchGroups,
}: {
  steps: DependencyStep[];
  flows: Flow[];
  pathseekerWorkItemId: QuestWorkItemId;
  now: IsoTimestamp;
  batchGroups: FolderTypeGroups;
}): WorkItem[] => {
  // Flow/startup steps are owned by flowrider (it writes their impl + flow test), not codeweaver.
  // Partition them out so codeweaver chunks exclude them and flowrider items can carry their refs.
  const ownedFolderTypes = new Set<FolderType>(
    flowTestOwnedFolderTypesStatics.value.map((ft) => folderTypeContract.parse(ft)),
  );
  const flowStartupSteps = steps.filter((step) => {
    const filePath = step.focusFile?.path;
    const folderType =
      filePath === undefined
        ? undefined
        : pathToFolderTypeTransformer({ filePath, folderConfigs: folderConfigStatics });
    return folderType !== undefined && ownedFolderTypes.has(folderType);
  });
  const flowStartupStepRefs = flowStartupSteps.map((step) => `steps/${String(step.id)}`);

  // Pass 1: chunk the codeweaver steps (one chunk per package, flow/startup excluded) AND
  // pre-populate stepIdToCwId for every step across every chunk BEFORE pass 2 reads it. This is
  // required because a step in chunk N may depend on a step in chunk M where M > N.
  const cwChunks = stepsToPackageChunksTransformer({ steps });
  const stepIdToCwId = new Map<StepId, QuestWorkItemId>();
  const assignedCwIds: QuestWorkItemId[] = cwChunks.map((chunk) => {
    const cwId = workItemContract.shape.id.parse(crypto.randomUUID());
    for (const step of chunk) {
      stepIdToCwId.set(step.id, cwId);
    }
    return cwId;
  });

  // Pass 2: build each codeweaver work item, resolving every step dep via the id map.
  const cwItems: WorkItem[] = cwChunks.map((chunk, index) => {
    const cwId = assignedCwIds[index];

    const dependsOnSet = new Set<QuestWorkItemId>([pathseekerWorkItemId]);
    for (const step of chunk) {
      for (const depStepId of step.dependsOn) {
        const depCwId = stepIdToCwId.get(depStepId);
        if (depCwId !== undefined && depCwId !== cwId) {
          dependsOnSet.add(depCwId);
        }
      }
    }

    return workItemContract.parse({
      id: cwId,
      role: 'codeweaver',
      status: 'pending',
      spawnerType: 'agent',
      relatedDataItems: chunk.map((step) => `steps/${String(step.id)}`),
      dependsOn: [...dependsOnSet],
      maxAttempts: 1,
      createdAt: now,
    });
  });

  const allCwIds = cwItems.map((item) => item.id);

  const wardItem = workItemContract.parse({
    id: crypto.randomUUID(),
    role: 'ward',
    status: 'pending',
    spawnerType: 'command',
    dependsOn: allCwIds,
    maxAttempts: slotManagerStatics.ward.maxRetries,
    createdAt: now,
    wardMode: 'changed',
  });

  // Flowrider: emitted only when ≥1 flow/startup step exists (the summoning rule). One item per
  // flow, chained sequentially so at most one runs at a time (dev server / port / FS contention),
  // first rooted on the changed-ward. Each carries its flow ref plus ALL flow/startup step refs —
  // steps have no flow link, so every chained flowrider sees the same step set; chaining means a
  // later flow's agent sees the earlier flow's committed files and extends rather than collides.
  const flowriderItems: WorkItem[] =
    flowStartupSteps.length > 0
      ? flows.reduce<WorkItem[]>((acc, flow) => {
          const prevFlowriderId: QuestWorkItemId | undefined =
            acc.length > 0 ? acc[acc.length - 1]?.id : undefined;
          const flowriderDependsOn: QuestWorkItemId[] =
            prevFlowriderId === undefined ? [wardItem.id] : [wardItem.id, prevFlowriderId];

          const flowriderItem = workItemContract.parse({
            id: crypto.randomUUID(),
            role: 'flowrider',
            status: 'pending',
            spawnerType: 'agent',
            relatedDataItems: [`flows/${String(flow.id)}`, ...flowStartupStepRefs],
            dependsOn: flowriderDependsOn,
            maxAttempts: 1,
            createdAt: now,
          });
          return [...acc, flowriderItem];
        }, [])
      : [];

  // Emit one siegeItem per flow, chained sequentially. Each siege depends on its own flow's
  // flowrider (so the flow-test suite exists before siege manually QAs + reviews it); when no
  // flowrider exists (no flow/startup steps) it falls back to the changed-ward.
  const siegeItems: WorkItem[] = flows.reduce<WorkItem[]>((acc, flow, index) => {
    const prevSiegeId: QuestWorkItemId | undefined =
      acc.length > 0 ? acc[acc.length - 1]?.id : undefined;
    const upstreamId: QuestWorkItemId = flowriderItems[index]?.id ?? wardItem.id;
    const siegeDependsOn: QuestWorkItemId[] =
      prevSiegeId === undefined ? [upstreamId] : [upstreamId, prevSiegeId];

    const siegeItem = workItemContract.parse({
      id: crypto.randomUUID(),
      role: 'siegemaster',
      status: 'pending',
      spawnerType: 'agent',
      relatedDataItems: [`flows/${String(flow.id)}`],
      dependsOn: siegeDependsOn,
      maxAttempts: 1,
      createdAt: now,
    });
    return [...acc, siegeItem];
  }, []);

  const allSiegeIds = siegeItems.map((item) => item.id);

  // Lawbringer deps: all siegeItems (so laws wait for every flow's siege).
  // Empty-flows guard: if no sieges exist, lawbringers depend on the wardItem directly.
  const lawbringerDependsOn: QuestWorkItemId[] =
    allSiegeIds.length > 0 ? [...allSiegeIds] : [wardItem.id];

  const lawChunks = stepsToBatchChunksTransformer({ steps, batchGroups });
  const lawItems: WorkItem[] = lawChunks.map((chunk) =>
    workItemContract.parse({
      id: crypto.randomUUID(),
      role: 'lawbringer',
      status: 'pending',
      spawnerType: 'agent',
      relatedDataItems: chunk.map((step) => `steps/${String(step.id)}`),
      dependsOn: lawbringerDependsOn,
      maxAttempts: 1,
      createdAt: now,
    }),
  );

  const allLawIds = lawItems.map((item) => item.id);

  // The blightwarden phase runs between lawbringers and the final ward. It is two stages:
  //   1. Five report-only minions (one per cross-cutting concern) run in PARALLEL — each audits
  //      the whole diff for its concern and writes a PlanningBlightReport. None fixes or blocks.
  //   2. The blightwarden synthesizer runs AFTER all five, reads the reports, judges/dedups, and
  //      applies the final cleanup.
  // The minions share the same upstream deps the single blightwarden used to have: all laws if any;
  // otherwise all sieges; otherwise the ward (empty-flows edge).
  const minionDependsOn: QuestWorkItemId[] =
    allLawIds.length > 0 ? allLawIds : allSiegeIds.length > 0 ? [...allSiegeIds] : [wardItem.id];

  const minionItems: WorkItem[] = blightwardenMinionRolesStatics.roles.map((role) =>
    workItemContract.parse({
      id: crypto.randomUUID(),
      role,
      status: 'pending',
      spawnerType: 'agent',
      dependsOn: minionDependsOn,
      maxAttempts: 1,
      createdAt: now,
    }),
  );

  const minionIds = minionItems.map((item) => item.id);

  const synthesizerItem = workItemContract.parse({
    id: crypto.randomUUID(),
    role: 'blightwarden',
    status: 'pending',
    spawnerType: 'agent',
    dependsOn: minionIds,
    maxAttempts: 1,
    createdAt: now,
  });

  const finalWardItem = workItemContract.parse({
    id: crypto.randomUUID(),
    role: 'ward',
    status: 'pending',
    spawnerType: 'command',
    dependsOn: [synthesizerItem.id],
    maxAttempts: slotManagerStatics.ward.maxRetries,
    createdAt: now,
    wardMode: 'full',
  });

  return [
    ...cwItems,
    wardItem,
    ...flowriderItems,
    ...siegeItems,
    ...lawItems,
    ...minionItems,
    synthesizerItem,
    finalWardItem,
  ];
};
