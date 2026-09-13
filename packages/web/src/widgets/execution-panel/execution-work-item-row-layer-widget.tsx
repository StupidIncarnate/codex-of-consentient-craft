/**
 * PURPOSE: Derives one visible-work-item row's entries, dependency labels, ward/riftcarver results,
 * status and display name from the quest-wide lookups the panel builds once, then renders the row.
 * This is what the panel's one numbered list maps over for a claimed work item — the counterpart to
 * rendering ExecutionRowLayerWidget directly for an unclaimed operation, which has none of this to
 * derive.
 *
 * USAGE:
 * <ExecutionWorkItemRowLayerWidget
 *   order={order}
 *   workItem={workItem}
 *   questId={quest.id}
 *   includeSkipped={includeSkipped}
 *   workItemEntries={workItemEntries}
 *   sessionEntries={sessionEntries}
 *   workItemIdToLabel={workItemIdToLabel}
 *   wardResultsById={wardResultsById}
 *   riftcarverResultsById={riftcarverResultsById}
 *   operationsById={operationsById}
 * />
 */

import type {
  ChatEntry,
  OperationItem,
  QuestId,
  QuestWorkItemId,
  RiftcarverResult,
  SessionId,
  UrlSlug,
  WardResult,
  WorkItem,
} from '@dungeonmaster/shared/contracts';
import { riftcarverResultContract } from '@dungeonmaster/shared/contracts';

import type { DependencyLabel } from '../../contracts/dependency-label/dependency-label-contract';
import type { DisplayFilePath } from '../../contracts/display-file-path/display-file-path-contract';
import { displayLabelContract } from '../../contracts/display-label/display-label-contract';
import type { ExecutionRole } from '../../contracts/execution-role/execution-role-contract';
import type { ExecutionStepStatus } from '../../contracts/execution-step-status/execution-step-status-contract';
import type { IsoTimestamp } from '../../contracts/iso-timestamp/iso-timestamp-contract';
import type { RowOrder } from '../../contracts/row-order/row-order-contract';
import { mergeDescendantSubagentEntriesTransformer } from '../../transformers/merge-descendant-subagent-entries/merge-descendant-subagent-entries-transformer';
import { ExecutionRowLayerWidget } from './execution-row-layer-widget';

const WARD_RESULTS_PREFIX = 'wardResults/';
const WARD_RESULTS_PREFIX_LENGTH = WARD_RESULTS_PREFIX.length;
const RIFTCARVER_RESULTS_PREFIX = 'riftcarverResults/';
const RIFTCARVER_RESULTS_PREFIX_LENGTH = RIFTCARVER_RESULTS_PREFIX.length;
const OPERATIONS_PREFIX = 'operations/';
const OPERATIONS_PREFIX_LENGTH = OPERATIONS_PREFIX.length;

export interface ExecutionWorkItemRowLayerWidgetProps {
  order: RowOrder;
  workItem: WorkItem;
  questId: QuestId;
  now?: IsoTimestamp;
  // Terminal-quest-with-no-operations rendering (see the panel) auto-expands every row so the
  // abandon-early transcript is visible without a click.
  includeSkipped: boolean;
  guildSlug?: UrlSlug;
  workItemEntries: Map<QuestWorkItemId, ChatEntry[]>;
  sessionEntries: Map<SessionId, ChatEntry[]>;
  // Built once for the whole quest, above the row list — rebuilding it per row would be
  // O(work items × dependencies) instead of O(work items). Keyed by QuestWorkItemId rather than
  // WorkItem['id'] so this stays at one indexed WorkItem property (`role`).
  workItemIdToLabel: Map<QuestWorkItemId, WorkItem['role']>;
  wardResultsById: Map<WardResult['id'], WardResult>;
  riftcarverResultsById: Map<RiftcarverResult['id'], RiftcarverResult>;
  operationsById: Map<OperationItem['id'], OperationItem>;
}

export const ExecutionWorkItemRowLayerWidget = ({
  order,
  workItem,
  questId,
  now,
  includeSkipped,
  guildSlug,
  workItemEntries,
  sessionEntries,
  workItemIdToLabel,
  wardResultsById,
  riftcarverResultsById,
  operationsById,
}: ExecutionWorkItemRowLayerWidgetProps): React.JSX.Element => {
  const ownEntries =
    workItemEntries.get(workItem.id) ??
    (workItem.sessionId ? sessionEntries.get(workItem.sessionId) : undefined) ??
    [];
  const entries = mergeDescendantSubagentEntriesTransformer({
    ownEntries,
    poolEntries: workItem.sessionId ? (sessionEntries.get(workItem.sessionId) ?? []) : [],
  });
  const depLabels = workItem.dependsOn
    .map((depId) => workItemIdToLabel.get(depId) ?? depId)
    .filter((label) => label.length > 0);
  const wardRefs = workItem.relatedDataItems.filter((ref) => ref.startsWith(WARD_RESULTS_PREFIX));
  const wardResults = wardRefs
    .map((ref) => wardResultsById.get(ref.slice(WARD_RESULTS_PREFIX_LENGTH) as WardResult['id']))
    .filter((wr): wr is NonNullable<typeof wr> => wr !== undefined);
  const riftcarverRefs = workItem.relatedDataItems.filter((ref) =>
    ref.startsWith(RIFTCARVER_RESULTS_PREFIX),
  );
  const riftcarverResults = riftcarverRefs
    .map((ref) => {
      // Parse the sliced id through the contract's own id schema to re-brand it, rather than
      // asserting the raw slice into RiftcarverResult['id'] — a ref that fails to parse
      // (corrupt/legacy data) is treated as not-found instead of lying to the type system about a
      // string that was never validated.
      const parsedId = riftcarverResultContract.shape.id.safeParse(
        ref.slice(RIFTCARVER_RESULTS_PREFIX_LENGTH),
      );
      return parsedId.success ? riftcarverResultsById.get(parsedId.data) : undefined;
    })
    .filter((rr): rr is NonNullable<typeof rr> => rr !== undefined);
  const status = workItem.status as ExecutionStepStatus;
  const operationRef = workItem.relatedDataItems.find((ref) => ref.startsWith(OPERATIONS_PREFIX));
  const operation = operationRef
    ? operationsById.get(operationRef.slice(OPERATIONS_PREFIX_LENGTH) as OperationItem['id'])
    : undefined;
  const name = displayLabelContract.parse(
    operation
      ? operation.text
      : `${workItem.role.charAt(0).toUpperCase()}${workItem.role.slice(1)}`,
  );

  return (
    <ExecutionRowLayerWidget
      order={order}
      name={name}
      role={workItem.role as unknown as ExecutionRole}
      status={status}
      files={[] as DisplayFilePath[]}
      dependsOn={depLabels as unknown as DependencyLabel[]}
      isAdhoc={workItem.insertedBy !== undefined}
      entries={entries}
      isStreaming={status === ('in_progress' as ExecutionStepStatus)}
      {...(includeSkipped ? { autoExpand: true } : {})}
      workItem={workItem}
      {...(now === undefined ? {} : { now })}
      {...(workItem.errorMessage ? { errorMessage: workItem.errorMessage } : {})}
      {...(wardResults.length > 0 ? { wardResults, questId } : {})}
      {...(riftcarverResults.length > 0 ? { riftcarverResults, questId } : {})}
      {...(workItem.sessionId ? { sessionId: workItem.sessionId } : {})}
      {...(guildSlug ? { guildSlug } : {})}
    />
  );
};
