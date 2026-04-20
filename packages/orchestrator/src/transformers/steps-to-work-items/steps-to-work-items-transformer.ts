/**
 * PURPOSE: After PathSeeker creates steps, generate the full work item chain
 *          (codeweaver -> ward -> siegemaster[per flow, chained] -> lawbringer -> blightwarden -> final-ward)
 *
 * USAGE:
 * stepsToWorkItemsTransformer({ steps, flows, pathseekerWorkItemId, now });
 * // Returns: WorkItem[] with dependency chain wired (one siegeItem per flow, chained)
 */

import { workItemContract } from '@dungeonmaster/shared/contracts';
import type {
  DependencyStep,
  Flow,
  FolderTypeGroups,
  QuestWorkItemId,
  StepId,
  WorkItem,
} from '@dungeonmaster/shared/contracts';

import type { IsoTimestamp } from '../../contracts/iso-timestamp/iso-timestamp-contract';
import { slotManagerStatics } from '../../statics/slot-manager/slot-manager-statics';
import { stepsToBatchChunksTransformer } from '../steps-to-batch-chunks/steps-to-batch-chunks-transformer';

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
  const stepIdToCwId = new Map<StepId, QuestWorkItemId>();

  const cwChunks = stepsToBatchChunksTransformer({ steps, batchGroups });
  const cwItems: WorkItem[] = cwChunks.map((chunk) => {
    const cwId = workItemContract.shape.id.parse(crypto.randomUUID());
    for (const step of chunk) {
      stepIdToCwId.set(step.id, cwId);
    }

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

  // Emit one siegeItem per flow, chained sequentially via dependsOn so that
  // at most one Siegemaster runs at a time (dev server / port / FS contention).
  const siegeItems: WorkItem[] = flows.reduce<WorkItem[]>((acc, flow) => {
    const prevSiegeId: QuestWorkItemId | undefined =
      acc.length > 0 ? acc[acc.length - 1]?.id : undefined;
    const siegeDependsOn: QuestWorkItemId[] =
      prevSiegeId === undefined ? [wardItem.id] : [wardItem.id, prevSiegeId];

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

  // Blightwarden runs once per quest on the final diff, between lawbringers and the final ward.
  // Depends on all laws if any; otherwise all sieges; otherwise the ward (empty-flows edge).
  const blightwardenDependsOn: QuestWorkItemId[] =
    allLawIds.length > 0 ? allLawIds : allSiegeIds.length > 0 ? [...allSiegeIds] : [wardItem.id];

  const blightwardenItem = workItemContract.parse({
    id: crypto.randomUUID(),
    role: 'blightwarden',
    status: 'pending',
    spawnerType: 'agent',
    dependsOn: blightwardenDependsOn,
    maxAttempts: 1,
    createdAt: now,
  });

  const finalWardItem = workItemContract.parse({
    id: crypto.randomUUID(),
    role: 'ward',
    status: 'pending',
    spawnerType: 'command',
    dependsOn: [blightwardenItem.id],
    maxAttempts: slotManagerStatics.ward.maxRetries,
    createdAt: now,
    wardMode: 'full',
  });

  return [...cwItems, wardItem, ...siegeItems, ...lawItems, blightwardenItem, finalWardItem];
};
