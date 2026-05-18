/**
 * PURPOSE: Builds the four-tier pathseeker work-item graph (surface × N → dedup + assertion-correctness → walk) and the matching scopeClassification.slices[] from a quest's packagesAffected[]
 *
 * USAGE:
 * const result = questBuildPathseekerGraphBroker({
 *   packagesAffected: ['orchestrator', 'web'],
 *   flowIds: [],
 *   priorWorkItemIds: [chaosId],
 *   now: '2024-01-15T10:00:00.000Z',
 * });
 * // Returns { workItems: WorkItem[], slices: Slice[] } using crypto.randomUUID() for ids.
 *
 * WHEN-TO-USE: Once per Start Quest transition. Replaces the legacy single-pathseeker insertion.
 * WHEN-NOT-TO-USE: During retries/replans inside a running quest — those create role-specific
 * work items directly via questWorkItemInsertBroker.
 */

import type { FlowNodeId, PackageName, WorkItem } from '@dungeonmaster/shared/contracts';
import {
  packageNameContract,
  questWorkItemIdContract,
  sliceNameContract,
  workItemContract,
  type QuestWorkItemId,
} from '@dungeonmaster/shared/contracts';
import type { Slice } from '@dungeonmaster/shared/contracts';

import type { IsoTimestamp } from '../../../contracts/iso-timestamp/iso-timestamp-contract';
import type { PathseekerGraph } from '../../../contracts/pathseeker-graph/pathseeker-graph-contract';

export const questBuildPathseekerGraphBroker = ({
  packagesAffected,
  flowIds,
  priorWorkItemIds,
  now,
}: {
  packagesAffected: PackageName[];
  flowIds: FlowNodeId[];
  priorWorkItemIds: QuestWorkItemId[];
  now: IsoTimestamp;
}): PathseekerGraph => {
  const slices: Slice[] =
    packagesAffected.length === 0
      ? [
          {
            name: sliceNameContract.parse('default'),
            packages: [],
            flowIds,
          },
        ]
      : packagesAffected.map((pkg) => ({
          name: sliceNameContract.parse(String(pkg)),
          packages: [packageNameContract.parse(String(pkg))],
          flowIds,
        }));

  const surfaceItems: WorkItem[] = slices.map(() =>
    workItemContract.parse({
      id: questWorkItemIdContract.parse(crypto.randomUUID()),
      role: 'pathseeker-surface',
      status: 'pending',
      spawnerType: 'agent',
      dependsOn: priorWorkItemIds,
      maxAttempts: 3,
      createdAt: now,
    }),
  );

  const surfaceIds = surfaceItems.map((item) => item.id);

  const dedupItem = workItemContract.parse({
    id: questWorkItemIdContract.parse(crypto.randomUUID()),
    role: 'pathseeker-dedup',
    status: 'pending',
    spawnerType: 'agent',
    dependsOn: surfaceIds,
    maxAttempts: 3,
    createdAt: now,
  });

  const assertionItem = workItemContract.parse({
    id: questWorkItemIdContract.parse(crypto.randomUUID()),
    role: 'pathseeker-assertion-correctness',
    status: 'pending',
    spawnerType: 'agent',
    dependsOn: surfaceIds,
    maxAttempts: 3,
    createdAt: now,
  });

  const walkItem = workItemContract.parse({
    id: questWorkItemIdContract.parse(crypto.randomUUID()),
    role: 'pathseeker-walk',
    status: 'pending',
    spawnerType: 'agent',
    dependsOn: [dedupItem.id, assertionItem.id],
    maxAttempts: 3,
    createdAt: now,
  });

  return {
    workItems: [...surfaceItems, dedupItem, assertionItem, walkItem],
    slices,
  };
};
