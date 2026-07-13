/**
 * PURPOSE: Composes the execution panel with tab bar, status bar, operations ledger, and a flat
 * list of work-item rows for the quest execution view
 *
 * USAGE:
 * <ExecutionPanelWidget quest={quest} />
 * // Renders tabbed panel with EXECUTION and QUEST SPEC tabs; the operations ledger renders above
 * // one row per work item in quest.workItems order
 */

import { useState } from 'react';

import { Box, Group, Stack, UnstyledButton } from '@mantine/core';

import type {
  Quest,
  QuestStatus,
  QuestWorkItemId,
  SessionId,
  UrlSlug,
  WorkItem,
} from '@dungeonmaster/shared/contracts';

import type { ButtonLabel } from '../../contracts/button-label/button-label-contract';
import type { ChatEntry } from '@dungeonmaster/shared/contracts';
import type { CompletedCount } from '../../contracts/completed-count/completed-count-contract';
import type { DependencyLabel } from '../../contracts/dependency-label/dependency-label-contract';
import type { DisplayFilePath } from '../../contracts/display-file-path/display-file-path-contract';
import { displayLabelContract } from '../../contracts/display-label/display-label-contract';
import type { ExecutionRole } from '../../contracts/execution-role/execution-role-contract';
import type { ExecutionStepStatus } from '../../contracts/execution-step-status/execution-step-status-contract';
import type { RowOrder } from '../../contracts/row-order/row-order-contract';
import { testIdContract } from '../../contracts/test-id/test-id-contract';
import type { TotalCount } from '../../contracts/total-count/total-count-contract';
import {
  isAnyAgentRunningQuestStatusGuard,
  isCompletedSuccessfullyQuestStatusGuard,
  isQuestResumableQuestStatusGuard,
  isSkippedWorkItemStatusGuard,
  isTerminalQuestStatusGuard,
} from '@dungeonmaster/shared/guards';
import { displayHeaderQuestStatusTransformer } from '@dungeonmaster/shared/transformers';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';
import { mergeDescendantSubagentEntriesTransformer } from '../../transformers/merge-descendant-subagent-entries/merge-descendant-subagent-entries-transformer';
import { AutoScrollContainerWidget } from '../auto-scroll-container/auto-scroll-container-widget';
import { DumpsterCommandBannerWidget } from '../dumpster-command-banner/dumpster-command-banner-widget';
import { OperationsLedgerWidget } from '../operations-ledger/operations-ledger-widget';
import { PixelBtnWidget } from '../pixel-btn/pixel-btn-widget';
import { QuestSpecPanelWidget } from '../quest-spec-panel/quest-spec-panel-widget';
import { QuestTitleBarWidget } from '../quest-title-bar/quest-title-bar-widget';
import { ExecutionRowLayerWidget } from './execution-row-layer-widget';
import { ExecutionStatusBarLayerWidget } from './execution-status-bar-layer-widget';

const DUMPSTER_LAUNCH_BANNER_MESSAGE = displayLabelContract.parse(
  "Run this in your Claude session — it'll pick this quest up on its next pass.",
);
const DUMPSTER_LAUNCH_COMMAND = displayLabelContract.parse('/dumpster-launch');

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
}

const TABS = [
  { id: 'execution', label: 'EXECUTION' },
  { id: 'spec', label: 'QUEST SPEC' },
] as const;

const TAB_FONT_SIZE = 10;
const TAB_FONT_WEIGHT = 600;
const ACTIVE_BORDER_WIDTH = 2;
const TAB_PADDING_VERTICAL = 5;
const PAUSE_LABEL = 'PAUSE QUEST' as ButtonLabel;
const RESUME_LABEL = 'RESUME QUEST' as ButtonLabel;
const ACTION_BAR_PADDING = 12;
const WARD_RESULTS_PREFIX = 'wardResults/';
const WARD_RESULTS_PREFIX_LENGTH = WARD_RESULTS_PREFIX.length;
const OPERATIONS_PREFIX = 'operations/';
const OPERATIONS_PREFIX_LENGTH = OPERATIONS_PREFIX.length;
const FLOOR_CONTENT_TEST_ID = testIdContract.parse('execution-panel-floor-content');
export const ExecutionPanelWidget = ({
  quest,
  sessionEntries = new Map(),
  workItemEntries = new Map(),
  guildSlug,
  onStatusChange,
  onPause,
  onAbandon,
}: ExecutionPanelWidgetProps): React.JSX.Element => {
  const [activeTab, setActiveTab] = useState<'execution' | 'spec'>('execution');
  const { colors } = emberDepthsThemeStatics;

  const isTerminalQuest = isTerminalQuestStatusGuard({ status: quest.status });

  // Terminal-quest-with-no-operations is the abandon-early case:
  // OrchestrationAbandonResponder marks every non-terminal work item as
  // `skipped` while transitioning to `abandoned`, so an abandon during the
  // chaoswhisperer phase produces { status: 'abandoned', workItems:
  // [{ role: 'chaoswhisperer', status: 'skipped', sessionId }] }. Filtering
  // skipped items out (the active-quest default) would hide the only row that
  // could display the chaos transcript, leaving a blank panel even though the
  // server is replaying chat-output for that sessionId. For every other render,
  // skipped items stay hidden so the visible chain reflects what actually ran.
  const includeSkipped = isTerminalQuest && quest.operations.length === 0;

  const visibleWorkItems = quest.workItems.filter(
    (wi) => includeSkipped || !isSkippedWorkItemStatusGuard({ status: wi.status }),
  );

  const totalOperations = quest.operations.length as TotalCount;
  const completedOperations = quest.operations.filter((op) => op.status === 'complete')
    .length as CompletedCount;

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

  return (
    <Stack gap={0} style={{ height: '100%' }} data-testid="execution-panel-widget">
      <Box
        data-testid="execution-panel-tab-bar"
        style={{ display: 'flex', borderBottom: `1px solid ${colors.border}`, flexShrink: 0 }}
      >
        {TABS.map((tab) => (
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
      ) : (
        <Box style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          <QuestTitleBarWidget title={quest.title} {...(onAbandon ? { onAbandon } : {})} />
          {isTerminalQuest ? null : (
            <DumpsterCommandBannerWidget
              message={DUMPSTER_LAUNCH_BANNER_MESSAGE}
              command={DUMPSTER_LAUNCH_COMMAND}
            />
          )}
          {isTerminalQuest ? (
            <Box
              data-testid="execution-panel-terminal-banner"
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
              completedCount={completedOperations}
              totalCount={totalOperations}
            />
          )}
          <AutoScrollContainerWidget
            testId={FLOOR_CONTENT_TEST_ID}
            style={{ flex: 1, padding: '0 12px 12px' }}
          >
            <OperationsLedgerWidget operations={quest.operations} />
            {visibleWorkItems.map((wi, wiIndex) => {
              const wiOwnEntries =
                workItemEntries.get(wi.id) ??
                (wi.sessionId ? sessionEntries.get(wi.sessionId) : undefined) ??
                [];
              const wiEntries = mergeDescendantSubagentEntriesTransformer({
                ownEntries: wiOwnEntries,
                poolEntries: wi.sessionId ? (sessionEntries.get(wi.sessionId) ?? []) : [],
              });
              const wiDepLabels = wi.dependsOn
                .map((depId) => workItemIdToLabel.get(depId) ?? depId)
                .filter((label) => label.length > 0);
              const wiWardRefs = wi.relatedDataItems.filter((ref) =>
                ref.startsWith(WARD_RESULTS_PREFIX),
              );
              const wiWardResults = wiWardRefs
                .map((ref) =>
                  wardResultsById.get(
                    ref.slice(WARD_RESULTS_PREFIX_LENGTH) as (typeof quest.wardResults)[0]['id'],
                  ),
                )
                .filter((wr): wr is NonNullable<typeof wr> => wr !== undefined);
              const wiStatus = wi.status as ExecutionStepStatus;
              const wiOperationRef = wi.relatedDataItems.find((ref) =>
                ref.startsWith(OPERATIONS_PREFIX),
              );
              const wiOperation = wiOperationRef
                ? operationsById.get(
                    wiOperationRef.slice(
                      OPERATIONS_PREFIX_LENGTH,
                    ) as (typeof quest.operations)[0]['id'],
                  )
                : undefined;
              const wiName = displayLabelContract.parse(
                wiOperation
                  ? wiOperation.text
                  : `${wi.role.charAt(0).toUpperCase()}${wi.role.slice(1)}`,
              );
              return (
                <ExecutionRowLayerWidget
                  key={wi.id}
                  order={(wiIndex + 1) as RowOrder}
                  name={wiName}
                  role={wi.role as unknown as ExecutionRole}
                  status={wiStatus}
                  files={[] as DisplayFilePath[]}
                  dependsOn={wiDepLabels as unknown as DependencyLabel[]}
                  isAdhoc={wi.insertedBy !== undefined}
                  entries={wiEntries}
                  isStreaming={wiStatus === ('in_progress' as ExecutionStepStatus)}
                  {...(includeSkipped ? { autoExpand: true } : {})}
                  attempt={wi.attempt}
                  maxAttempts={wi.maxAttempts}
                  {...(wi.startedAt ? { startedAt: wi.startedAt } : {})}
                  {...(wi.completedAt ? { completedAt: wi.completedAt } : {})}
                  {...(wi.errorMessage ? { errorMessage: wi.errorMessage } : {})}
                  {...(wi.summary ? { summary: wi.summary } : {})}
                  {...(wiWardResults.length > 0
                    ? { wardResults: wiWardResults, questId: quest.id }
                    : {})}
                  {...(wi.actualSignal ? { actualSignal: wi.actualSignal } : {})}
                  {...(wi.sessionId ? { sessionId: wi.sessionId } : {})}
                  {...(guildSlug ? { guildSlug } : {})}
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
        </Box>
      )}
    </Stack>
  );
};
