/**
 * PURPOSE: Renders a readable, pick-ordered snapshot of a quest's work-item queue for orchestration-loop stderr logging
 *
 * USAGE:
 * orchestrationLoopSummaryTransformer({ questId, questStatus, workItems, ready, chatRoles });
 * // Returns: OrchestrationLoopSummary — header counts + items grouped ready -> running -> waiting -> done -> failed -> skipped,
 * //          with ready items numbered in dispatch order, each line carrying the work-item id and a why-blocked reason.
 */

import type { QuestId, QuestStatus, WorkItem, WorkItemRole } from '@dungeonmaster/shared/contracts';
import {
  isActiveWorkItemStatusGuard,
  isCompleteWorkItemStatusGuard,
  isFailureWorkItemStatusGuard,
  isPendingWorkItemStatusGuard,
  satisfiesDependencyWorkItemStatusGuard,
} from '@dungeonmaster/shared/guards';

import type { OrchestrationLoopSummary } from '../../contracts/orchestration-loop-summary/orchestration-loop-summary-contract';
import { orchestrationLoopSummaryContract } from '../../contracts/orchestration-loop-summary/orchestration-loop-summary-contract';

const LINE_INDENT = '    ';
const NUM_PAD = 3;
const TAG_PAD = 5;
const ROLE_PAD = 15;

// Display buckets, lowest number dispatched first — drives the pick-order sort.
const PRIORITY_READY = 0;
const PRIORITY_RUN = 1;
const PRIORITY_WAIT = 2;
const PRIORITY_DONE = 3;
const PRIORITY_FAIL = 4;
const PRIORITY_SKIP = 5;

export const orchestrationLoopSummaryTransformer = ({
  questId,
  questStatus,
  workItems,
  ready,
  chatRoles,
}: {
  questId: QuestId;
  questStatus: QuestStatus;
  workItems: WorkItem[];
  ready: WorkItem[];
  chatRoles: readonly WorkItemRole[];
}): OrchestrationLoopSummary => {
  const readyIds = new Set(ready.map((item) => item.id));
  const chatRoleSet = new Set<WorkItemRole>(chatRoles);
  const itemById = new Map(workItems.map((item) => [item.id, item]));
  const satisfiedIds = new Set(
    workItems
      .filter((item) => satisfiesDependencyWorkItemStatusGuard({ status: item.status }))
      .map((item) => item.id),
  );

  // Classify every item into a single display bucket. Priority drives the pick-order sort:
  // ready items come first (the loop's dispatch candidates, numbered), then in-flight, then
  // items still waiting on deps, then the terminal buckets. `ready` membership is authoritative
  // for the READY bucket because it already encodes "pending AND every dependency satisfied".
  const decorated = workItems.map((item) => {
    let tag = 'SKIP';
    let priority = PRIORITY_SKIP;
    if (readyIds.has(item.id)) {
      tag = 'READY';
      priority = PRIORITY_READY;
    } else if (isActiveWorkItemStatusGuard({ status: item.status })) {
      tag = 'RUN';
      priority = PRIORITY_RUN;
    } else if (isPendingWorkItemStatusGuard({ status: item.status })) {
      tag = 'WAIT';
      priority = PRIORITY_WAIT;
    } else if (isCompleteWorkItemStatusGuard({ status: item.status })) {
      tag = 'DONE';
      priority = PRIORITY_DONE;
    } else if (isFailureWorkItemStatusGuard({ status: item.status })) {
      tag = 'FAIL';
      priority = PRIORITY_FAIL;
    }

    let detail = '';
    if (tag === 'READY') {
      detail = chatRoleSet.has(item.role) ? '[chat]' : '[exec]';
    } else if (tag === 'WAIT') {
      const unmetRoles = item.dependsOn
        .filter((depId) => !satisfiedIds.has(depId))
        .map((depId) => {
          const dep = itemById.get(depId);
          return dep ? dep.role : 'unknown';
        });
      const parts = [...new Set(unmetRoles)].map((roleName) => {
        const count = unmetRoles.filter((name) => name === roleName).length;
        return count > 1 ? `${roleName} x${String(count)}` : roleName;
      });
      detail = parts.length > 0 ? `waiting on: ${parts.join(', ')}` : 'waiting';
    }

    return { item, priority, tag, detail };
  });

  const sorted = [...decorated].sort((a, b) => a.priority - b.priority);

  const pickNumberById = new Map(
    sorted
      .filter((entry) => entry.tag === 'READY')
      .map((entry, index) => [entry.item.id, index + 1]),
  );

  const lines = sorted.map((entry) => {
    const pick = pickNumberById.get(entry.item.id);
    const numCol = pick === undefined ? ' '.repeat(NUM_PAD) : `#${String(pick)}`.padEnd(NUM_PAD);
    const tagCol = entry.tag.padEnd(TAG_PAD);
    const roleCol = entry.item.role.padEnd(ROLE_PAD);
    const detailPart = entry.detail === '' ? '' : `  ${entry.detail}`;
    return `${LINE_INDENT}${numCol} ${tagCol} ${roleCol} ${entry.item.id}${detailPart}`;
  });

  const runningCount = decorated.filter((entry) => entry.tag === 'RUN').length;
  const waitingCount = decorated.filter((entry) => entry.tag === 'WAIT').length;
  const doneCount = decorated.filter((entry) => entry.tag === 'DONE').length;
  const failedCount = decorated.filter((entry) => entry.tag === 'FAIL').length;
  const skippedCount = decorated.filter((entry) => entry.tag === 'SKIP').length;

  const header = `[orchestration-loop] quest=${questId} status=${questStatus} items=${String(workItems.length)} (ready=${String(ready.length)} running=${String(runningCount)} waiting=${String(waitingCount)} done=${String(doneCount)} failed=${String(failedCount)} skipped=${String(skippedCount)})`;

  if (lines.length === 0) {
    return orchestrationLoopSummaryContract.parse(header);
  }

  const sectionHeader = '  queue (pick order - ready first, then running, waiting, done):';

  return orchestrationLoopSummaryContract.parse([header, sectionHeader, ...lines].join('\n'));
};
