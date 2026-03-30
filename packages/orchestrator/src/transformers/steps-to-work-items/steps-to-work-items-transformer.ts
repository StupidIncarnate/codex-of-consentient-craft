/**
 * PURPOSE: After PathSeeker creates steps, generate the full work item chain
 *          (codeweaver -> ward -> siegemaster -> lawbringer -> final-ward)
 *
 * USAGE:
 * stepsToWorkItemsTransformer({ steps, pathseekerWorkItemId, now });
 * // Returns: WorkItem[] with dependency chain wired
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
  const stepIdToCwId = new Map<StepId, QuestWorkItemId>();

  const cwItems: WorkItem[] = steps.map((step) => {
    const cwId = crypto.randomUUID();
    stepIdToCwId.set(step.id, workItemContract.shape.id.parse(cwId));

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

  const siegeItems: WorkItem[] = flows.map((flow) =>
    workItemContract.parse({
      id: crypto.randomUUID(),
      role: 'siegemaster',
      status: 'pending',
      spawnerType: 'agent',
      relatedDataItems: [`flows/${String(flow.id)}`],
      dependsOn: [wardItem.id],
      maxAttempts: 1,
      createdAt: now,
    }),
  );

  const allSiegeIds = siegeItems.map((item) => item.id);
  const lawDependsOn = allSiegeIds.length > 0 ? allSiegeIds : [wardItem.id];

  const lawItems: WorkItem[] = steps.map((step) =>
    workItemContract.parse({
      id: crypto.randomUUID(),
      role: 'lawbringer',
      status: 'pending',
      spawnerType: 'agent',
      relatedDataItems: [`steps/${String(step.id)}`],
      dependsOn: lawDependsOn,
      maxAttempts: 1,
      createdAt: now,
    }),
  );

  const allLawIds = lawItems.map((item) => item.id);
  const finalWardDeps =
    allLawIds.length > 0 ? allLawIds : allSiegeIds.length > 0 ? allSiegeIds : [wardItem.id];

  const finalWardItem = workItemContract.parse({
    id: crypto.randomUUID(),
    role: 'ward',
    status: 'pending',
    spawnerType: 'command',
    dependsOn: finalWardDeps,
    maxAttempts: slotManagerStatics.ward.maxRetries,
    createdAt: now,
    wardMode: 'full',
  });

  return [...cwItems, wardItem, ...siegeItems, ...lawItems, finalWardItem];
};
