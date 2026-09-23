/**
 * PURPOSE: Composes the execution panel with tab bar, status bar, the numbered execution rows, and
 * — once a quest stops running — the follow-up chat tab and the post-quest action bar (FOLLOW-UP,
 * merge) for the quest execution view
 *
 * USAGE:
 * <ExecutionPanelWidget quest={quest} />
 * // Renders tabbed panel with EXECUTION and QUEST SPEC tabs (FOLLOW-UP joins them once opened);
 * // the execution tab is ONE numbered list — a row per SCOPE (an operation, or a role fallback) in
 * // first-visible-appearance order, then a row per operation no work item has claimed, in
 * // quest.operations order. A scope holding one visible work item numbers that row directly
 * // (decision 2's bare tier); a scope holding several numbers an operation header row instead and
 * // nests every one of its work items beneath it, unnumbered — see the row-building block below.
 */

import { useEffect, useMemo, useState } from 'react';

import { Box, Group, Stack, UnstyledButton } from '@mantine/core';

import type {
  Quest,
  QuestStatus,
  QuestWorkItemId,
  SessionId,
  UrlSlug,
  UserInput,
  WorkItem,
} from '@dungeonmaster/shared/contracts';

import { useElapsedTickBinding } from '../../bindings/use-elapsed-tick/use-elapsed-tick-binding';
import { useQuestProjectionBinding } from '../../bindings/use-quest-projection/use-quest-projection-binding';
import type { ButtonLabel } from '../../contracts/button-label/button-label-contract';
import type { ChatEntry } from '@dungeonmaster/shared/contracts';
import { completedCountContract } from '@dungeonmaster/shared/contracts';
import type { CompletedCount } from '@dungeonmaster/shared/contracts';
import type { DependencyLabel } from '../../contracts/dependency-label/dependency-label-contract';
import type { DisplayFilePath } from '../../contracts/display-file-path/display-file-path-contract';
import type { DisplayLabel } from '../../contracts/display-label/display-label-contract';
import { displayLabelContract } from '../../contracts/display-label/display-label-contract';
import { executionRoleContract } from '../../contracts/execution-role/execution-role-contract';
import type { ExecutionRole } from '../../contracts/execution-role/execution-role-contract';
import type { ExecutionStepStatus } from '../../contracts/execution-step-status/execution-step-status-contract';
import type { PastedImageUpload } from '@dungeonmaster/shared/contracts';
import type { RowOrder } from '../../contracts/row-order/row-order-contract';
import { testIdContract } from '../../contracts/test-id/test-id-contract';
import { totalCountContract } from '@dungeonmaster/shared/contracts';
import type { TotalCount } from '@dungeonmaster/shared/contracts';
import type { UploadProgressHandler } from '../../contracts/upload-progress-post/upload-progress-post-contract';
import {
  isActiveWorkItemStatusGuard,
  isAnyAgentRunningQuestStatusGuard,
  isCompleteWorkItemStatusGuard,
  isCompletedSuccessfullyQuestStatusGuard,
  isFailureWorkItemStatusGuard,
  isFollowupChatableQuestStatusGuard,
  isMergeableQuestStatusGuard,
  isQuestResumableQuestStatusGuard,
  isSkippedWorkItemStatusGuard,
  isTerminalQuestStatusGuard,
  shouldRenderStatusBannerQuestStatusGuard,
} from '@dungeonmaster/shared/guards';
import { displayHeaderQuestStatusTransformer } from '@dungeonmaster/shared/transformers';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';
import { unclaimedOperationsTransformer } from '../../transformers/unclaimed-operations/unclaimed-operations-transformer';
import { AutoScrollContainerWidget } from '../auto-scroll-container/auto-scroll-container-widget';
import { ChatPanelWidget } from '../chat-panel/chat-panel-widget';
import { DumpsterCommandBannerWidget } from '../dumpster-command-banner/dumpster-command-banner-widget';
import { PixelBtnWidget } from '../pixel-btn/pixel-btn-widget';
import { QuestSpecPanelWidget } from '../quest-spec-panel/quest-spec-panel-widget';
import { QuestTitleBarWidget } from '../quest-title-bar/quest-title-bar-widget';
import { ExecutionRowLayerWidget } from './execution-row-layer-widget';
import { ExecutionStatusBarLayerWidget } from './execution-status-bar-layer-widget';
import { ExecutionWorkItemRowLayerWidget } from './execution-work-item-row-layer-widget';

const DUMPSTER_LAUNCH_BANNER_MESSAGE = displayLabelContract.parse(
  "Run this in your Claude session — it'll pick this quest up on its next pass.",
);
const DUMPSTER_LAUNCH_COMMAND = displayLabelContract.parse('/dumpster-launch');
// The FOLLOW-UP tab's ChatPanelWidget always carries the tavernkeeper's own conversation — it is
// the one role isPostQuestChatWorkItemRoleGuard admits — so the label is a constant, not derived
// per-render from a work item.
const FOLLOWUP_ROLE_LABEL = executionRoleContract.parse('tavernkeeper');

export interface ExecutionPanelWidgetProps {
  quest: Quest;
  sessionEntries?: Map<SessionId, ChatEntry[]>;
  // Transcript entries keyed by workItemId. Preferred over sessionEntries for scoping a
  // row: sibling Task-dispatched sub-agents share one parent sessionId, so sessionEntries
  // alone hands every row the merged union. Falls back to the sessionId bucket for rows
  // whose entries arrived without a workItemId.
  workItemEntries?: Map<QuestWorkItemId, ChatEntry[]>;
  guildSlug?: UrlSlug;
  onStatusChange?: (params: { status: QuestStatus }) => void;
  onPause?: () => void;
  onAbandon?: () => void;
  followupEntries?: ChatEntry[];
  isFollowupStreaming?: boolean;
  onSendFollowupMessage?: (params: {
    message: UserInput;
    images?: readonly PastedImageUpload[];
    onProgress?: UploadProgressHandler;
  }) => Promise<void>;
  onStopFollowup?: () => void;
  onMerge?: () => void;
}

const TABS = [
  { id: 'execution', label: 'EXECUTION' },
  { id: 'spec', label: 'QUEST SPEC' },
] as const;
const FOLLOWUP_TAB = { id: 'followup', label: 'FOLLOW-UP' } as const;
const DEFAULT_TAB_ID = 'execution' as const;

const TAB_FONT_SIZE = 10;
const TAB_FONT_WEIGHT = 600;
const ACTIVE_BORDER_WIDTH = 2;
const TAB_PADDING_VERTICAL = 5;
const PAUSE_LABEL = 'PAUSE QUEST' as ButtonLabel;
const RESUME_LABEL = 'RESUME QUEST' as ButtonLabel;
const FOLLOWUP_LABEL = 'FOLLOW-UP' as ButtonLabel;
const MERGE_LABEL = 'Teleport with Booty (Merge)' as ButtonLabel;
const ACTION_BAR_PADDING = 12;
// Floors the ledger/rows container so the tab bar, title bar, banner, and (on a blocked
// quest) both the pause/resume bar and the post-quest bar can never squeeze it to nothing —
// a flex item's default min-height: auto does not floor it here because its own content
// scrolls internally.
const EXECUTION_FLOOR_MIN_HEIGHT = 160;
const OPERATIONS_PREFIX = 'operations/';
const OPERATIONS_PREFIX_LENGTH = OPERATIONS_PREFIX.length;
const FLOOR_CONTENT_TEST_ID = testIdContract.parse('execution-panel-floor-content');
// ChatPanelWidget's onSendMessage/onStopChat are required props. onSendFollowupMessage is
// only reachable as undefined for the single render tick between a prop change and the
// clamp effect below correcting activeTab away from 'followup' — these keep that tick
// type-safe without allocating a fresh function identity every render.
const NOOP_FOLLOWUP_HANDLERS = {
  sendMessage: async (): Promise<void> => Promise.resolve(),
  stopChat: (): void => undefined,
};
// A scope needs an operation header (decision 2's NESTED ruling) once it holds more than one
// visible work item; below that it renders BARE, unchanged from before decision 2.
const SCOPE_HOLDS_MULTIPLE_SESSIONS = 2;
// Sentinel piece-group key for a work item with no `pieceId` at all — real piece labels (a
// payload's own name, or `pieceId` itself) are never empty, so '' cannot collide with one.
const NO_PIECE_GROUP_KEY = displayLabelContract.parse('');

export const ExecutionPanelWidget = ({
  quest,
  sessionEntries = new Map(),
  workItemEntries = new Map(),
  guildSlug,
  onStatusChange,
  onPause,
  onAbandon,
  followupEntries,
  isFollowupStreaming,
  onSendFollowupMessage,
  onStopFollowup,
  onMerge,
}: ExecutionPanelWidgetProps): React.JSX.Element => {
  const [activeTab, setActiveTab] = useState<'followup' | 'execution' | 'spec'>('execution');
  const [followupTabOpen, setFollowupTabOpen] = useState(false);
  const { colors } = emberDepthsThemeStatics;

  const hasFollowupTab = followupTabOpen && onSendFollowupMessage !== undefined;
  // Memoised so the clamp effect below runs on a real membership change rather than every render.
  const tabs = useMemo(
    () => (hasFollowupTab ? [FOLLOWUP_TAB, ...TABS] : [...TABS]),
    [hasFollowupTab],
  );

  // The tab list is derived every render from hasFollowupTab; activeTab is a mount-time
  // useState default that would otherwise dangle on a tab no longer rendered (e.g. once
  // onSendFollowupMessage stops being passed), leaving the panel selected on nothing. Testing
  // membership against `tabs` rather than a parallel id list is what keeps the clamp honest as
  // tabs are added; EXECUTION is the landing tab because it is the one tab always rendered.
  useEffect(() => {
    if (!tabs.some((tab) => tab.id === activeTab)) {
      setActiveTab(DEFAULT_TAB_ID);
    }
  }, [activeTab, tabs]);

  const isTerminalQuestStatus = isTerminalQuestStatusGuard({ status: quest.status });
  const shouldRenderStatusBanner = shouldRenderStatusBannerQuestStatusGuard({
    status: quest.status,
  });

  // Each post-quest segment needs BOTH a status that permits the action and the handler that
  // performs it — the same pairing the pause/resume bar above uses. `mergeSegmentHandler` keeps
  // the handler rather than a boolean so the click callback narrows without a second check.
  const showsFollowupSegment =
    isFollowupChatableQuestStatusGuard({ status: quest.status }) &&
    onSendFollowupMessage !== undefined;
  const mergeSegmentHandler = isMergeableQuestStatusGuard({ status: quest.status })
    ? onMerge
    : undefined;

  // Terminal-quest-with-no-operations is the abandon-early case:
  // OrchestrationAbandonResponder marks every non-terminal work item as
  // `skipped` while transitioning to `abandoned`, so an abandon during the
  // chaoswhisperer phase produces { status: 'abandoned', workItems:
  // [{ role: 'chaoswhisperer', status: 'skipped', sessionId }] }. Filtering
  // skipped items out (the active-quest default) would hide the only row that
  // could display the chaos transcript, leaving a blank panel even though the
  // server is replaying chat-output for that sessionId. For every other render,
  // skipped items stay hidden so the visible chain reflects what actually ran.
  const includeSkipped = isTerminalQuestStatus && quest.operations.length === 0;

  const visibleWorkItems = quest.workItems.filter(
    (wi) => includeSkipped || !isSkippedWorkItemStatusGuard({ status: wi.status }),
  );

  // The tail of the one numbered list: the plan items nothing has been dispatched for yet. Derived
  // from quest.workItems rather than visibleWorkItems, so an operation whose work item was skipped
  // stays off the tail instead of reappearing as if it were still waiting.
  const unclaimedOperations = unclaimedOperationsTransformer({
    operations: quest.operations,
    workItems: quest.workItems,
  });

  // One shared tick drives every visible running row's elapsed figure, rather than a timer per
  // row — a per-row interval would start counting from that row's own mount time, so two items
  // dispatched in the same batch (genuinely the same age) would drift apart by up to a tick
  // period. `enabled` is what stops the timer: the binding clears its own interval once the last
  // running row leaves in_progress. This predicate has to match ExecutionRowLayerWidget's own
  // `isRunning` test exactly — a `queued` item passes isActiveWorkItemStatusGuard but the row
  // draws no figure for it, and diverging from the row's test would hold the timer for a row that
  // draws nothing.
  const hasRunningWorkItem = visibleWorkItems.some((wi) => {
    const wiRowStatus = wi.status as ExecutionStepStatus;
    return wiRowStatus === ('in_progress' as ExecutionStepStatus) && wi.startedAt !== undefined;
  });
  const { now } = useElapsedTickBinding({ enabled: hasRunningWorkItem });

  const totalOperations = quest.operations.length as TotalCount;
  const completedOperations = quest.operations.filter((op) => op.status === 'complete')
    .length as CompletedCount;

  // The status bar prefers the PROJECTION's own step walk (27d) — it counts every family's actual
  // and planned STEPS, not merely operations, so it advances even mid-scope. `data` stays null both
  // while the fetch is in flight and after it fails outright, so testing it alone covers both
  // fallback cases; a refetch that fails after an earlier success is caught by the error check too,
  // so a stale projection is never shown as though it were live.
  const { data: projection, error: projectionError } = useQuestProjectionBinding({
    questId: quest.id,
  });
  const projectionTotalSteps = projection?.totalPlannedSteps;
  const projectionCompletedSteps = projection?.completedSteps;
  const projectionUsable = projectionTotalSteps !== undefined && projectionError === null;
  const progressSource: 'projection' | 'ledger' = projectionUsable ? 'projection' : 'ledger';
  const rawTotalSteps = projectionUsable ? Number(projectionTotalSteps) : Number(totalOperations);
  const rawCompletedSteps = projectionUsable
    ? Number(projectionCompletedSteps ?? 0)
    : Number(completedOperations);
  // 27d's own ASSERT: the ratio must never exceed 1. `questProjectionContract`'s doc says
  // completedSteps <= totalPlannedSteps "by construction", but this bar clamps anyway rather than
  // trust a producer it cannot see fail — a stale or malformed projection must never read past 100%.
  const progressTotalCount = totalCountContract.parse(rawTotalSteps);
  const progressCompletedCount = completedCountContract.parse(
    Math.min(rawCompletedSteps, rawTotalSteps),
  );

  const operationsById = new Map(quest.operations.map((op) => [op.id, op]));

  const workItemIdToLabel = new Map<WorkItem['id'], WorkItem['role']>();
  for (const wi of quest.workItems) {
    workItemIdToLabel.set(wi.id, wi.role);
  }

  const wardResultsById = new Map<
    (typeof quest.wardResults)[0]['id'],
    (typeof quest.wardResults)[0]
  >();
  for (const wr of quest.wardResults) {
    wardResultsById.set(wr.id, wr);
  }

  const riftcarverResultsById = new Map<
    (typeof quest.riftcarverResults)[0]['id'],
    (typeof quest.riftcarverResults)[0]
  >();
  for (const rr of quest.riftcarverResults) {
    riftcarverResultsById.set(rr.id, rr);
  }

  // A row's SCOPE is the operation its relatedDataItems ref resolves to (matching the fallback
  // ExecutionWorkItemRowLayerWidget itself applies), or its role when the ref is absent or dangling.
  // Grouped here — the only place that sees every visible sibling at once — because a scope holding
  // several dispatched sessions (a codeweaver cell's plan, several parallel workers, review, commit,
  // ward, repair) renders one operation header plus one nested row per session (decision 2's NESTED
  // ruling), and every one of those rows shares this same scope. `scopeKey` is branded through
  // `displayLabelContract` rather than kept as a raw string, matching every other Map key this file
  // builds.
  //
  // Every grouping/tiering step below runs inside a `.forEach()`/`.map()` callback rather than a
  // `for` loop or a named helper — ESLint scores each callback's own branching separately from
  // ExecutionPanelWidget's, which is what keeps the component itself under this repo's complexity
  // ceiling without moving the logic to a second file.
  const scopeGroups = new Map<
    DisplayLabel,
    { workItems: WorkItem[]; operation?: (typeof quest.operations)[0] }
  >();
  const workItemScopeKey = new Map<WorkItem['id'], DisplayLabel>();
  visibleWorkItems.forEach((wi) => {
    const operationRef = wi.relatedDataItems.find((ref) => ref.startsWith(OPERATIONS_PREFIX));
    const rawOperationId = operationRef?.slice(OPERATIONS_PREFIX_LENGTH) as
      | (typeof quest.operations)[0]['id']
      | undefined;
    const operation = rawOperationId === undefined ? undefined : operationsById.get(rawOperationId);
    const scopeKey = displayLabelContract.parse(
      operation ? `op:${operation.id}` : `role:${wi.role}`,
    );
    workItemScopeKey.set(wi.id, scopeKey);
    const existing = scopeGroups.get(scopeKey);
    if (existing) {
      existing.workItems.push(wi);
    } else {
      scopeGroups.set(scopeKey, operation ? { workItems: [wi], operation } : { workItems: [wi] });
    }
  });

  // Decision 2 (scrolls/consolidated-plan.md) plus the operator's NESTED ruling: a scope holding
  // one visible work item stays BARE (unchanged — that row already carries the scope label via
  // ExecutionWorkItemRowLayerWidget's own fallback). A scope holding several instead gets ONE
  // operation header — the scope's text (or the capitalized role, when no operation resolves) with
  // that scope's own role and status — and a `stepLabel` per nested work item. Web cannot import
  // `agentFlowStatics` (orchestrator-only), so `workItem.step` is read exactly as stored — it is
  // already the real step key.
  const headerInfoByScopeKey = new Map<
    DisplayLabel,
    { name: DisplayLabel; role: WorkItem['role']; status: ExecutionStepStatus }
  >();
  const stepLabelByWorkItemId = new Map<WorkItem['id'], DisplayLabel>();
  scopeGroups.forEach(({ workItems: group, operation }, scopeKey) => {
    if (group.length < SCOPE_HOLDS_MULTIPLE_SESSIONS) {
      return;
    }
    const [firstItem] = group;
    if (firstItem === undefined) {
      return;
    }
    // An operation-backed header takes the operation's OWN status verbatim — that is the field
    // decision 2's worked example shows in the header column. A role-fallback scope (no operation
    // to read a status off) folds its children worst-first: any failure outranks any run, which
    // outranks a clean sweep, matching the order agentFlowStatics' own outcome words fold in.
    const headerName = operation
      ? displayLabelContract.parse(operation.text)
      : displayLabelContract.parse(
          `${firstItem.role.charAt(0).toUpperCase()}${firstItem.role.slice(1)}`,
        );
    const headerStatus: ExecutionStepStatus = operation
      ? (operation.status as ExecutionStepStatus)
      : group.some((wi) => isFailureWorkItemStatusGuard({ status: wi.status }))
        ? ('failed' as ExecutionStepStatus)
        : group.some((wi) => isActiveWorkItemStatusGuard({ status: wi.status }))
          ? ('in_progress' as ExecutionStepStatus)
          : group.every((wi) => isCompleteWorkItemStatusGuard({ status: wi.status }))
            ? ('complete' as ExecutionStepStatus)
            : (firstItem.status as ExecutionStepStatus);
    headerInfoByScopeKey.set(scopeKey, {
      name: headerName,
      role: firstItem.role,
      status: headerStatus,
    });

    // Tier 2/3/4: group by STEP first, then by PIECE within a shared step.
    const stepGroups = new Map<DisplayLabel, WorkItem[]>();
    group.forEach((wi) => {
      const stepKey = displayLabelContract.parse(wi.step ?? `${wi.role} role`);
      const stepGroup = stepGroups.get(stepKey);
      if (stepGroup) {
        stepGroup.push(wi);
      } else {
        stepGroups.set(stepKey, [wi]);
      }
    });

    stepGroups.forEach((stepGroup, stepKey) => {
      const [soleStepItem] = stepGroup;
      if (stepGroup.length < SCOPE_HOLDS_MULTIPLE_SESSIONS) {
        // Tier 2 — this step is unique within the scope: the step name alone.
        if (soleStepItem !== undefined) {
          stepLabelByWorkItemId.set(soleStepItem.id, stepKey);
        }
        return;
      }
      // Piece name: a human name off the payload if one exists there, else the plan's own
      // mnemonic pieceId — `payload` is `z.record(z.unknown())` (the per-family shape lives on
      // the orchestrator's own plan-file contract, which this package may not import), so
      // `pieceName` is the one key checked defensively. A work item with no `pieceId` at all
      // groups under the sentinel.
      const pieceGroups = new Map<DisplayLabel, WorkItem[]>();
      stepGroup.forEach((wi) => {
        const payloadPieceName = wi.payload?.pieceName;
        const pieceLabel =
          wi.pieceId === undefined
            ? undefined
            : typeof payloadPieceName === 'string' && payloadPieceName.length > 0
              ? payloadPieceName
              : wi.pieceId;
        const pieceKey =
          pieceLabel === undefined ? NO_PIECE_GROUP_KEY : displayLabelContract.parse(pieceLabel);
        const pieceGroup = pieceGroups.get(pieceKey);
        if (pieceGroup) {
          pieceGroup.push(wi);
        } else {
          pieceGroups.set(pieceKey, [wi]);
        }
      });
      if (pieceGroups.size < SCOPE_HOLDS_MULTIPLE_SESSIONS) {
        // Every item in this step shares one piece (or none at all) — a true duplicate.
        stepGroup.forEach((wi, idx) => {
          stepLabelByWorkItemId.set(wi.id, displayLabelContract.parse(`${stepKey} pt: ${idx + 1}`));
        });
        return;
      }
      pieceGroups.forEach((pieceGroup, pieceKey) => {
        const [solePieceItem] = pieceGroup;
        if (pieceGroup.length >= SCOPE_HOLDS_MULTIPLE_SESSIONS) {
          // Tier 4 — same step AND same piece: a true duplicate, numbered in array order.
          pieceGroup.forEach((wi, idx) => {
            stepLabelByWorkItemId.set(
              wi.id,
              displayLabelContract.parse(`${stepKey} pt: ${idx + 1}`),
            );
          });
          return;
        }
        if (solePieceItem === undefined) {
          return;
        }
        // Tier 3 — this piece is unique within the step: `step - piece`.
        const resolvedPieceLabel =
          pieceKey === NO_PIECE_GROUP_KEY
            ? displayLabelContract.parse(solePieceItem.sessionId ?? solePieceItem.id)
            : pieceKey;
        stepLabelByWorkItemId.set(
          solePieceItem.id,
          displayLabelContract.parse(`${stepKey} - ${resolvedPieceLabel}`),
        );
      });
    });
  });

  // Resolves `workItem.mintedBy` to the label of the row it names, for the back-edge badge (27f) —
  // the SAME four-tier text (T2-1) that row renders for itself, never the raw id. Built once over
  // ALL of quest.workItems, not just visibleWorkItems: a minter can already be filtered out by the
  // skip guard while its own label is still the right one to show. A nested row's label is the tier
  // label already computed above; a bare row falls back to the identical scope-label rule
  // ExecutionWorkItemRowLayerWidget applies for its own name (operation text, or the capitalized role).
  const workItemIdToDisplayLabel = new Map<WorkItem['id'], DisplayLabel>();
  quest.workItems.forEach((wi) => {
    const tierLabel = stepLabelByWorkItemId.get(wi.id);
    if (tierLabel !== undefined) {
      workItemIdToDisplayLabel.set(wi.id, tierLabel);
      return;
    }
    const operationRef = wi.relatedDataItems.find((ref) => ref.startsWith(OPERATIONS_PREFIX));
    const operation =
      operationRef === undefined
        ? undefined
        : operationsById.get(
            operationRef.slice(OPERATIONS_PREFIX_LENGTH) as (typeof quest.operations)[0]['id'],
          );
    workItemIdToDisplayLabel.set(
      wi.id,
      operation
        ? displayLabelContract.parse(operation.text)
        : displayLabelContract.parse(`${wi.role.charAt(0).toUpperCase()}${wi.role.slice(1)}`),
    );
  });
  // The ONE numbered list this widget renders, built once so the JSX below is a single flat
  // `.map()`. Order is assigned only to a TOP-LEVEL row — a bare work item, an operation header, or
  // an unclaimed operation — never to a step row nested under a header, which carries `stepLabel`
  // instead. Scopes are emitted in first-visible-appearance order (a scope's later work items are
  // skipped here and rendered together with its first, via `emittedScopeKeys`), then every
  // still-unclaimed operation continues the same running number.
  type ExecutionRenderRow =
    | { kind: 'header'; scopeKey: DisplayLabel; order: RowOrder }
    | {
        kind: 'workItem';
        workItem: WorkItem;
        order?: RowOrder;
        indented?: boolean;
        stepLabel?: DisplayLabel;
        mintedByLabel?: DisplayLabel;
      }
    | { kind: 'unclaimed'; operation: (typeof quest.operations)[0]; order: RowOrder };

  const renderRows: ExecutionRenderRow[] = [];
  const emittedScopeKeys = new Set<DisplayLabel>();
  let nextRowOrder = 1;
  visibleWorkItems.forEach((wi) => {
    const scopeKey = workItemScopeKey.get(wi.id);
    if (scopeKey === undefined || emittedScopeKeys.has(scopeKey)) {
      return;
    }
    emittedScopeKeys.add(scopeKey);
    const scope = scopeGroups.get(scopeKey);
    if (scope === undefined) {
      return;
    }
    const { workItems: group } = scope;
    if (group.length < SCOPE_HOLDS_MULTIPLE_SESSIONS) {
      const [soleItem] = group;
      if (soleItem !== undefined) {
        const soleItemMintedByLabel =
          soleItem.mintedBy === undefined
            ? undefined
            : workItemIdToDisplayLabel.get(soleItem.mintedBy);
        renderRows.push({
          kind: 'workItem',
          workItem: soleItem,
          order: nextRowOrder++ as RowOrder,
          ...(soleItemMintedByLabel === undefined ? {} : { mintedByLabel: soleItemMintedByLabel }),
        });
      }
      return;
    }
    renderRows.push({ kind: 'header', scopeKey, order: nextRowOrder++ as RowOrder });
    group.forEach((child) => {
      const childStepLabel = stepLabelByWorkItemId.get(child.id);
      const childMintedByLabel =
        child.mintedBy === undefined ? undefined : workItemIdToDisplayLabel.get(child.mintedBy);
      renderRows.push({
        kind: 'workItem',
        workItem: child,
        indented: true,
        ...(childStepLabel === undefined ? {} : { stepLabel: childStepLabel }),
        ...(childMintedByLabel === undefined ? {} : { mintedByLabel: childMintedByLabel }),
      });
    });
  });
  unclaimedOperations.forEach((op) => {
    renderRows.push({ kind: 'unclaimed', operation: op, order: nextRowOrder++ as RowOrder });
  });

  return (
    <Stack gap={0} style={{ height: '100%' }} data-testid="execution-panel-widget">
      <Box
        data-testid="execution-panel-tab-bar"
        style={{ display: 'flex', borderBottom: `1px solid ${colors.border}`, flexShrink: 0 }}
      >
        {tabs.map((tab) => (
          <UnstyledButton
            key={tab.id}
            data-testid={`execution-panel-tab-${tab.id}`}
            onClick={() => {
              setActiveTab(tab.id);
            }}
            px="sm"
            py={TAB_PADDING_VERTICAL}
            style={{
              fontFamily: 'monospace',
              fontSize: TAB_FONT_SIZE,
              fontWeight: TAB_FONT_WEIGHT,
              color: activeTab === tab.id ? colors.primary : colors['text-dim'],
              borderBottom:
                activeTab === tab.id
                  ? `${ACTIVE_BORDER_WIDTH}px solid ${colors.primary}`
                  : `${ACTIVE_BORDER_WIDTH}px solid transparent`,
            }}
          >
            {tab.label}
          </UnstyledButton>
        ))}
      </Box>

      {activeTab === 'spec' ? (
        <QuestSpecPanelWidget quest={quest} readOnly={true} />
      ) : activeTab === 'followup' ? (
        <Box style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          <ChatPanelWidget
            entries={followupEntries ?? []}
            isStreaming={isFollowupStreaming ?? false}
            onSendMessage={onSendFollowupMessage ?? NOOP_FOLLOWUP_HANDLERS.sendMessage}
            onStopChat={onStopFollowup ?? NOOP_FOLLOWUP_HANDLERS.stopChat}
            roleLabel={FOLLOWUP_ROLE_LABEL}
            surface="followup"
          />
        </Box>
      ) : (
        <Box style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          <QuestTitleBarWidget title={quest.title} {...(onAbandon ? { onAbandon } : {})} />
          {isTerminalQuestStatus ? null : (
            <DumpsterCommandBannerWidget
              message={DUMPSTER_LAUNCH_BANNER_MESSAGE}
              command={DUMPSTER_LAUNCH_COMMAND}
            />
          )}
          {shouldRenderStatusBanner ? (
            <Box
              data-testid="execution-panel-status-banner"
              style={{
                padding: '8px 12px',
                textAlign: 'center',
                backgroundColor: colors['bg-raised'],
                borderBottom: `1px solid ${colors.border}`,
                color: isCompletedSuccessfullyQuestStatusGuard({ status: quest.status })
                  ? colors.success
                  : colors.danger,
                fontFamily: 'monospace',
                fontWeight: 700,
                fontSize: 12,
                letterSpacing: '0.1em',
                flexShrink: 0,
              }}
            >
              {displayHeaderQuestStatusTransformer({ status: quest.status })}
            </Box>
          ) : (
            <ExecutionStatusBarLayerWidget
              completedCount={progressCompletedCount}
              totalCount={progressTotalCount}
              source={progressSource}
            />
          )}
          <AutoScrollContainerWidget
            testId={FLOOR_CONTENT_TEST_ID}
            style={{ flex: 1, padding: '0 12px 12px', minHeight: EXECUTION_FLOOR_MIN_HEIGHT }}
          >
            {/* The numbering continues straight on from a scope's rows to the next scope's, and
                then to the unclaimed tail, because this is ONE list: an operation nothing has
                claimed is the next thing that will run, not a separate register. An unclaimed row
                is handed no entries, no timestamps and no results — nothing has run for it, so
                there is nothing for a disclosure to open onto. */}
            {renderRows.map((row) => {
              if (row.kind === 'header') {
                const info = headerInfoByScopeKey.get(row.scopeKey);
                if (info === undefined) {
                  return null;
                }
                // The scope's own work items, in array order — lets the header's expanded detail
                // render the churn sequence (27c) a single claimed row's own workItem cannot see past.
                const scopeWorkItems = scopeGroups.get(row.scopeKey)?.workItems;
                return (
                  <ExecutionRowLayerWidget
                    key={row.scopeKey}
                    order={row.order}
                    name={info.name}
                    role={info.role as unknown as ExecutionRole}
                    status={info.status}
                    files={[] as DisplayFilePath[]}
                    dependsOn={[] as DependencyLabel[]}
                    isAdhoc={false}
                    {...(scopeWorkItems === undefined ? {} : { scopeWorkItems })}
                  />
                );
              }
              if (row.kind === 'unclaimed') {
                return (
                  <ExecutionRowLayerWidget
                    key={row.operation.id}
                    order={row.order}
                    name={displayLabelContract.parse(row.operation.text)}
                    role={row.operation.role as unknown as ExecutionRole}
                    status={row.operation.status as ExecutionStepStatus}
                    files={[] as DisplayFilePath[]}
                    dependsOn={[] as DependencyLabel[]}
                    isAdhoc={false}
                  />
                );
              }
              return (
                <ExecutionWorkItemRowLayerWidget
                  key={row.workItem.id}
                  workItem={row.workItem}
                  questId={quest.id}
                  now={now}
                  includeSkipped={includeSkipped}
                  workItemEntries={workItemEntries}
                  sessionEntries={sessionEntries}
                  workItemIdToLabel={workItemIdToLabel}
                  wardResultsById={wardResultsById}
                  riftcarverResultsById={riftcarverResultsById}
                  operationsById={operationsById}
                  {...(guildSlug ? { guildSlug } : {})}
                  {...(row.order === undefined ? {} : { order: row.order })}
                  {...(row.indented === true ? { indented: true } : {})}
                  {...(row.stepLabel === undefined ? {} : { stepLabel: row.stepLabel })}
                  {...(row.mintedByLabel === undefined ? {} : { mintedByLabel: row.mintedByLabel })}
                />
              );
            })}
          </AutoScrollContainerWidget>
          {((isAnyAgentRunningQuestStatusGuard({ status: quest.status }) && onPause) ||
            (isQuestResumableQuestStatusGuard({ status: quest.status }) && onStatusChange)) && (
            <Box
              data-testid="execution-panel-action-bar"
              style={{
                padding: ACTION_BAR_PADDING,
                borderTop: `1px solid ${colors.border}`,
                flexShrink: 0,
              }}
            >
              <Group gap="xs">
                {isAnyAgentRunningQuestStatusGuard({ status: quest.status }) && onPause && (
                  <Box data-testid="EXECUTION_PAUSE_BUTTON">
                    <PixelBtnWidget
                      label={PAUSE_LABEL}
                      onClick={() => {
                        onPause();
                      }}
                    />
                  </Box>
                )}
                {isQuestResumableQuestStatusGuard({ status: quest.status }) && onStatusChange && (
                  <Box data-testid="EXECUTION_RESUME_BUTTON">
                    <PixelBtnWidget
                      label={RESUME_LABEL}
                      onClick={() => {
                        onStatusChange({ status: 'in_progress' as QuestStatus });
                      }}
                    />
                  </Box>
                )}
              </Group>
            </Box>
          )}
          {(showsFollowupSegment || mergeSegmentHandler !== undefined) && (
            <Box
              data-testid="execution-panel-post-quest-bar"
              style={{
                padding: ACTION_BAR_PADDING,
                borderTop: `1px solid ${colors.border}`,
                flexShrink: 0,
              }}
            >
              <Group gap="xs">
                {showsFollowupSegment && (
                  <Box data-testid="EXECUTION_FOLLOWUP_BUTTON">
                    <PixelBtnWidget
                      label={FOLLOWUP_LABEL}
                      onClick={() => {
                        setFollowupTabOpen(true);
                        setActiveTab('followup');
                      }}
                    />
                  </Box>
                )}
                {mergeSegmentHandler !== undefined && (
                  <Box data-testid="EXECUTION_MERGE_BUTTON">
                    <PixelBtnWidget
                      label={MERGE_LABEL}
                      onClick={() => {
                        mergeSegmentHandler();
                      }}
                    />
                  </Box>
                )}
              </Group>
            </Box>
          )}
        </Box>
      )}
    </Stack>
  );
};
