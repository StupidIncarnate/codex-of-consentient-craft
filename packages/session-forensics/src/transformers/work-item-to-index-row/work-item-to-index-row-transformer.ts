/**
 * PURPOSE: Joins one work item to the operation item its `relatedDataItems` names, and to any ward
 * or riftcarver result it points at (by ref, or by `lastWardRunId` matching a result's own
 * `runId`), then settles its wall clock. This is the one place that replaces
 * `.claude/commands/quest-forensics.md` Step 1's by-hand join — everything here is pure, and the
 * two numbers it cannot derive itself (transcript size, sub-agent count) arrive already computed
 * from the caller, which is the only piece of this join that touches the filesystem.
 *
 * USAGE:
 * workItemToIndexRowTransformer({
 *   workItem: WorkItemStub(), operations: [], wardResults: [], riftcarverResults: [],
 *   transcriptSizeBytes: 0, subagentCount: 0,
 * });
 * // Returns a WorkItemIndexRow with operationText/flowIds/packageNames undefined/empty — no
 * // operation ref matched
 */
import type {
  WorkItem,
  OperationItem,
  WardResult,
  RiftcarverResult,
} from '@dungeonmaster/shared/contracts';

import {
  workItemIndexRowContract,
  type WorkItemIndexRow,
} from '../../contracts/work-item-index-row/work-item-index-row-contract';

const OPERATIONS_PREFIX = 'operations/';
const WARD_RESULTS_PREFIX = 'wardResults/';
const RIFTCARVER_RESULTS_PREFIX = 'riftcarverResults/';
const MILLISECONDS_PER_SECOND = 1000;

export const workItemToIndexRowTransformer = ({
  workItem,
  operations,
  wardResults,
  riftcarverResults,
  transcriptSizeBytes,
  subagentCount,
}: {
  workItem: WorkItem;
  operations: readonly OperationItem[];
  wardResults: readonly WardResult[];
  riftcarverResults: readonly RiftcarverResult[];
  transcriptSizeBytes: number;
  subagentCount: number;
}): WorkItemIndexRow => {
  const [operationId] = workItem.relatedDataItems
    .filter((ref) => ref.startsWith(OPERATIONS_PREFIX))
    .map((ref) => ref.slice(OPERATIONS_PREFIX.length));
  const operation = operations.find((candidate) => candidate.id === operationId);

  const startIso = workItem.startedAt ?? workItem.createdAt;
  const { completedAt } = workItem;
  const wallClockSeconds =
    completedAt === undefined || completedAt === null
      ? undefined
      : (new Date(completedAt).getTime() - new Date(startIso).getTime()) / MILLISECONDS_PER_SECOND;

  const wardRefIds = workItem.relatedDataItems
    .filter((ref) => ref.startsWith(WARD_RESULTS_PREFIX))
    .map((ref) => ref.slice(WARD_RESULTS_PREFIX.length));
  const riftcarverRefIds = workItem.relatedDataItems
    .filter((ref) => ref.startsWith(RIFTCARVER_RESULTS_PREFIX))
    .map((ref) => ref.slice(RIFTCARVER_RESULTS_PREFIX.length));

  const wardResultIdsByRunId =
    workItem.lastWardRunId === undefined
      ? []
      : wardResults
          .filter((result) => result.runId === workItem.lastWardRunId)
          .map((result) => result.id);
  const matchedWardResultIds = new Set([...wardRefIds, ...wardResultIdsByRunId]);

  const wardSummaries = wardResults
    .filter((result) => matchedWardResultIds.has(result.id))
    .map(
      (result) =>
        `ward exit ${result.exitCode}${result.wardMode === undefined ? '' : ` (${result.wardMode})`}`,
    );

  const riftcarverSummaries = riftcarverResults
    .filter((result) => riftcarverRefIds.includes(result.id))
    .map((result) => `riftcarver ${result.outcome} (exit ${result.exitCode})`);

  const wardRiftcarverSummaries = [...wardSummaries, ...riftcarverSummaries];

  return workItemIndexRowContract.parse({
    workItemId: workItem.id,
    role: workItem.role,
    status: workItem.status,
    ...(workItem.sessionId === undefined ? {} : { sessionId: workItem.sessionId }),
    ...(wallClockSeconds === undefined ? {} : { wallClockSeconds }),
    ...(operation === undefined
      ? {}
      : {
          operationText: operation.text,
          flowIds: operation.flowIds,
          packageNames: operation.packageNames,
        }),
    transcriptSizeBytes,
    subagentCount,
    ...(wardRiftcarverSummaries.length === 0
      ? {}
      : { wardRiftcarverSummary: wardRiftcarverSummaries.join('; ') }),
  });
};
