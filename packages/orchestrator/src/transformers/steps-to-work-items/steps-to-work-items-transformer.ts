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
  QuestWorkItemId,
  StepId,
  WorkItem,
} from '@dungeonmaster/shared/contracts';

import type { IsoTimestamp } from '../../contracts/iso-timestamp/iso-timestamp-contract';
import { slotManagerStatics } from '../../statics/slot-manager/slot-manager-statics';

export const stepsToWorkItemsTransformer = ({
  steps,
  pathseekerWorkItemId,
  now,
}: {
  steps: DependencyStep[];
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
      timeoutMs: slotManagerStatics.codeweaver.timeoutMs,
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
  });

  const siegeItem = workItemContract.parse({
    id: crypto.randomUUID(),
    role: 'siegemaster',
    status: 'pending',
    spawnerType: 'agent',
    dependsOn: [wardItem.id],
    timeoutMs: slotManagerStatics.siegemaster.timeoutMs,
    maxAttempts: 1,
    createdAt: now,
  });

  const lawItems: WorkItem[] = steps.map((step) =>
    workItemContract.parse({
      id: crypto.randomUUID(),
      role: 'lawbringer',
      status: 'pending',
      spawnerType: 'agent',
      relatedDataItems: [`steps/${String(step.id)}`],
      dependsOn: [siegeItem.id],
      timeoutMs: slotManagerStatics.lawbringer.timeoutMs,
      maxAttempts: 1,
      createdAt: now,
    }),
  );

  const allLawIds = lawItems.map((item) => item.id);
  const finalWardDeps = allLawIds.length > 0 ? allLawIds : [siegeItem.id];

  const finalWardItem = workItemContract.parse({
    id: crypto.randomUUID(),
    role: 'ward',
    status: 'pending',
    spawnerType: 'command',
    dependsOn: finalWardDeps,
    maxAttempts: slotManagerStatics.ward.maxRetries,
    createdAt: now,
  });

  return [...cwItems, wardItem, siegeItem, ...lawItems, finalWardItem];
};
