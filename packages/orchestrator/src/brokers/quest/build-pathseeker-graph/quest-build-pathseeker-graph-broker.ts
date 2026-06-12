/**
 * PURPOSE: Builds the single `pathseeker` planning work item and the matching
 * scopeClassification.slices[] from a quest's packagesAffected[]. PathSeeker classifies scope,
 * summons surface + cleanup minions as `Agent` sub-agents, then runs the architect-review walk
 * itself, so the graph is a single work item.
 *
 * USAGE:
 * const result = questBuildPathseekerGraphBroker({
 *   packagesAffected: ['orchestrator', 'web'],
 *   flowIds: [],
 *   priorWorkItemIds: [chaosId],
 *   now: '2024-01-15T10:00:00.000Z',
 * });
 * // Returns { workItems: [pathseekerItem], slices: Slice[] } using crypto.randomUUID() for ids.
 * // The slices seed scopeClassification.slices[]; PathSeeker resumes off that into its summon wave.
 *
 * WHEN-TO-USE: Once per Start Quest transition (feature quests).
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

  const pathseekerItem: WorkItem = workItemContract.parse({
    id: questWorkItemIdContract.parse(crypto.randomUUID()),
    role: 'pathseeker',
    status: 'pending',
    spawnerType: 'agent',
    dependsOn: priorWorkItemIds,
    maxAttempts: 3,
    createdAt: now,
  });

  return {
    workItems: [pathseekerItem],
    slices,
  };
};
