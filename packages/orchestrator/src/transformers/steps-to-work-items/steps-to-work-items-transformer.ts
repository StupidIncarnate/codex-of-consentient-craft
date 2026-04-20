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
  QuestWorkItemId,
  StepId,
  WorkItem,
} from '@dungeonmaster/shared/contracts';

import type { IsoTimestamp } from '../../contracts/iso-timestamp/iso-timestamp-contract';
import { slotManagerStatics } from '../../statics/slot-manager/slot-manager-statics';

export const stepsToWorkItemsTransformer = ({
  steps,
  flows,
  pathseekerWorkItemId,
  now,
}: {
  steps: DependencyStep[];
  flows: Flow[];
  pathseekerWorkItemId: QuestWorkItemId;
  now: IsoTimestamp;
}): WorkItem[] => {
  // Pass 1: assign a workItem id for every step so forward refs (a step depending on
  // another step declared later in the array) can be resolved in pass 2.
  const stepIdToCwId = new Map<StepId, QuestWorkItemId>();
  const assignedCwIds: QuestWorkItemId[] = steps.map((step) => {
    const cwId = workItemContract.shape.id.parse(crypto.randomUUID());
    stepIdToCwId.set(step.id, cwId);
    return cwId;
  });

  // Pass 2: build each codeweaver work item, resolving every step dep via the id map.
  const cwItems: WorkItem[] = steps.map((step, index) => {
    const cwId = assignedCwIds[index];

    const dependsOn: QuestWorkItemId[] = [pathseekerWorkItemId];
    for (const depStepId of step.dependsOn) {
      const depCwId = stepIdToCwId.get(depStepId);
      if (depCwId) {
        dependsOn.push(depCwId);
      }
    }

    return workItemContract.parse({
      id: cwId,
      role: 'codeweaver',
      status: 'pending',
      spawnerType: 'agent',
      relatedDataItems: [`steps/${String(step.id)}`],
      dependsOn,
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

  const lawItems: WorkItem[] = steps.map((step) =>
    workItemContract.parse({
      id: crypto.randomUUID(),
      role: 'lawbringer',
      status: 'pending',
      spawnerType: 'agent',
      relatedDataItems: [`steps/${String(step.id)}`],
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
