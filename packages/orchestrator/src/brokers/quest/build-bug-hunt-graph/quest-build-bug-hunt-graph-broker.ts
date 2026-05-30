/**
 * PURPOSE: Builds the complete Bug Hunt work-item chain seeded at Start Quest for a `bug-hunt`
 * quest: pesteater → ward(changed) → lawbringer(whole-diff) → blightwarden → ward(full).
 *
 * USAGE:
 * const workItems = questBuildBugHuntGraphBroker({ priorWorkItemIds: [], now });
 * // Returns WorkItem[] (5 items) dependency-chained, using crypto.randomUUID() for ids.
 *
 * WHEN-TO-USE: Once per Start Quest transition for a bug-hunt quest. Unlike the feature pipeline
 * there is no PathSeeker and no post-walk hook — the whole chain is seeded here. The lawbringer
 * item carries no relatedDataItems, which routes it to whole-diff review mode
 * (work-item-to-prompt-transformer). Blightwarden already reviews the whole diff.
 */

import { questWorkItemIdContract, workItemContract } from '@dungeonmaster/shared/contracts';
import type { QuestWorkItemId, WorkItem } from '@dungeonmaster/shared/contracts';

import type { IsoTimestamp } from '../../../contracts/iso-timestamp/iso-timestamp-contract';
import { slotManagerStatics } from '../../../statics/slot-manager/slot-manager-statics';

export const questBuildBugHuntGraphBroker = ({
  priorWorkItemIds,
  now,
}: {
  priorWorkItemIds: QuestWorkItemId[];
  now: IsoTimestamp;
}): WorkItem[] => {
  const pesteaterItem = workItemContract.parse({
    id: questWorkItemIdContract.parse(crypto.randomUUID()),
    role: 'pesteater',
    status: 'pending',
    spawnerType: 'agent',
    dependsOn: priorWorkItemIds,
    maxAttempts: 1,
    createdAt: now,
  });

  const wardChangedItem = workItemContract.parse({
    id: questWorkItemIdContract.parse(crypto.randomUUID()),
    role: 'ward',
    status: 'pending',
    spawnerType: 'command',
    dependsOn: [pesteaterItem.id],
    maxAttempts: slotManagerStatics.ward.maxRetries,
    createdAt: now,
    wardMode: 'changed',
  });

  const lawbringerItem = workItemContract.parse({
    id: questWorkItemIdContract.parse(crypto.randomUUID()),
    role: 'lawbringer',
    status: 'pending',
    spawnerType: 'agent',
    dependsOn: [wardChangedItem.id],
    maxAttempts: 1,
    createdAt: now,
  });

  const blightwardenItem = workItemContract.parse({
    id: questWorkItemIdContract.parse(crypto.randomUUID()),
    role: 'blightwarden',
    status: 'pending',
    spawnerType: 'agent',
    dependsOn: [lawbringerItem.id],
    maxAttempts: 1,
    createdAt: now,
  });

  const wardFullItem = workItemContract.parse({
    id: questWorkItemIdContract.parse(crypto.randomUUID()),
    role: 'ward',
    status: 'pending',
    spawnerType: 'command',
    dependsOn: [blightwardenItem.id],
    maxAttempts: slotManagerStatics.ward.maxRetries,
    createdAt: now,
    wardMode: 'full',
  });

  return [pesteaterItem, wardChangedItem, lawbringerItem, blightwardenItem, wardFullItem];
};
