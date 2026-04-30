/**
 * PURPOSE: Composes the execution panel with tab bar, status bar, floor headers, and step rows for quest execution view
 *
 * USAGE:
 * <ExecutionPanelWidget quest={quest} />
 * // Renders tabbed panel with EXECUTION and QUEST SPEC tabs, floor-based step layout
 */

import { useMemo, useState } from 'react';

import { Box, Group, Stack, Text, UnstyledButton } from '@mantine/core';

import type {
  Quest,
  QuestStatus,
  SessionId,
  StepId,
  UrlSlug,
  WorkItem,
} from '@dungeonmaster/shared/contracts';

import type { ButtonLabel } from '../../contracts/button-label/button-label-contract';
import type { ChatEntry } from '@dungeonmaster/shared/contracts';
import type { CompletedCount } from '../../contracts/completed-count/completed-count-contract';
import type { DependencyLabel } from '../../contracts/dependency-label/dependency-label-contract';
import type { DisplayFilePath } from '../../contracts/display-file-path/display-file-path-contract';
import type { ExecutionRole } from '../../contracts/execution-role/execution-role-contract';
import type { ExecutionStepStatus } from '../../contracts/execution-step-status/execution-step-status-contract';
import type { SlotCount } from '../../contracts/slot-count/slot-count-contract';
import { slotCountContract } from '../../contracts/slot-count/slot-count-contract';
import type { SlotIndex } from '../../contracts/slot-index/slot-index-contract';
import type { StepName } from '../../contracts/step-name/step-name-contract';
import type { StepOrder } from '../../contracts/step-order/step-order-contract';
import { testIdContract } from '../../contracts/test-id/test-id-contract';
import type { TotalCount } from '../../contracts/total-count/total-count-contract';
import {
  isActiveWorkItemStatusGuard,
  isAnyAgentRunningQuestStatusGuard,
  isCompletedSuccessfullyQuestStatusGuard,
  isCompleteWorkItemStatusGuard,
  isQuestResumableQuestStatusGuard,
  isTerminalQuestStatusGuard,
} from '@dungeonmaster/shared/guards';
import { displayHeaderQuestStatusTransformer } from '@dungeonmaster/shared/transformers';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';
import { workItemsToFloorGroupsTransformer } from '../../transformers/work-items-to-floor-groups/work-items-to-floor-groups-transformer';
import { AutoScrollContainerWidget } from '../auto-scroll-container/auto-scroll-container-widget';
import { PixelBtnWidget } from '../pixel-btn/pixel-btn-widget';
import { QuestSpecPanelWidget } from '../quest-spec-panel/quest-spec-panel-widget';
import { QuestTitleBarWidget } from '../quest-title-bar/quest-title-bar-widget';
import { ExecutionRowLayerWidget } from './execution-row-layer-widget';
import { ExecutionStatusBarLayerWidget } from './execution-status-bar-layer-widget';
import { FloorHeaderLayerWidget } from './floor-header-layer-widget';

export interface ExecutionPanelWidgetProps {
  quest: Quest;
  slotEntries?: Map<SlotIndex, ChatEntry[]>;
  sessionEntries?: Map<SessionId, ChatEntry[]>;
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
const WARD_RESULTS_PREFIX_LENGTH = 'wardResults/'.length;
const STEPS_PREFIX = 'steps/';
const STEPS_PREFIX_LENGTH = STEPS_PREFIX.length;
const FLOOR_CONTENT_TEST_ID = testIdContract.parse('execution-panel-floor-content');
export const ExecutionPanelWidget = ({
  quest,
  slotEntries = new Map(),
  sessionEntries = new Map(),
  guildSlug,
  onStatusChange,
  onPause,
  onAbandon,
}: ExecutionPanelWidgetProps): React.JSX.Element => {
  const [activeTab, setActiveTab] = useState<'execution' | 'spec'>('execution');
  const { colors } = emberDepthsThemeStatics;

  const { steps } = quest;
  const isTerminalQuest = isTerminalQuestStatusGuard({ status: quest.status });
  const isPlanning = steps.length === 0 && !isTerminalQuest;
  const hasWorkItemsOnly = steps.length === 0 && isTerminalQuest && quest.workItems.length > 0;

  const stepWorkItemMap = new Map<StepId, WorkItem>();
  for (const step of steps) {
    const stepRef = `steps/${step.id}`;
    const matchingItem = quest.workItems.find((wi) =>
      wi.relatedDataItems.some((ref) => ref === stepRef),
    );
    if (matchingItem) {
      stepWorkItemMap.set(step.id, matchingItem);
    }
  }

  const stepsById = new Map(steps.map((s) => [s.id, s]));

  const totalCount = (hasWorkItemsOnly ? quest.workItems.length : steps.length) as TotalCount;
  const completedCount = (
    hasWorkItemsOnly
      ? quest.workItems.filter((wi) => isCompleteWorkItemStatusGuard({ status: wi.status })).length
      : [...stepWorkItemMap.values()].filter((wi) =>
          isCompleteWorkItemStatusGuard({ status: wi.status }),
        ).length
  ) as CompletedCount;

  const workItemIdToLabel = new Map<WorkItem['id'], WorkItem['role']>();
  for (const wi of quest.workItems) {
    const stepRef = wi.relatedDataItems.find((ref) => ref.startsWith(STEPS_PREFIX));
    const stepId = stepRef ? (stepRef.slice(STEPS_PREFIX_LENGTH) as StepId) : undefined;
    const step = stepId ? stepsById.get(stepId) : undefined;
    workItemIdToLabel.set(wi.id, step ? (step.name as unknown as WorkItem['role']) : wi.role);
  }

  const wardResultsById = new Map<
    (typeof quest.wardResults)[0]['id'],
    (typeof quest.wardResults)[0]
  >();
  for (const wr of quest.wardResults) {
    wardResultsById.set(wr.id, wr);
  }

  const floorGroups = useMemo(
    () =>
      workItemsToFloorGroupsTransformer({
        workItems: quest.workItems,
        allWorkItems: quest.workItems,
      }),
    [quest.workItems],
  );

  const groupActiveCounts = new Map<(typeof floorGroups)[0], SlotCount>();
  const groupTotalCounts = new Map<(typeof floorGroups)[0], SlotCount>();
  for (const group of floorGroups) {
    let active = slotCountContract.parse(0);
    let total = slotCountContract.parse(0);
    for (const wi of group.workItems) {
      total = slotCountContract.parse(total + 1);
      if (isActiveWorkItemStatusGuard({ status: wi.status })) {
        active = slotCountContract.parse(active + 1);
      }
    }
    if (active > 0) {
      groupActiveCounts.set(group, active);
    }
    groupTotalCounts.set(group, total);
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
          {isTerminalQuestStatusGuard({ status: quest.status }) ? (
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
              completedCount={completedCount}
              totalCount={totalCount}
              isPlanning={isPlanning}
            />
          )}
          <AutoScrollContainerWidget
            testId={FLOOR_CONTENT_TEST_ID}
            style={{ flex: 1, padding: '0 12px 12px' }}
          >
            {isPlanning ? (
              <>
                {floorGroups
                  .filter((group) =>
                    group.workItems.every(
                      (wi) =>
                        wi.role !== 'pathseeker' &&
                        !wi.relatedDataItems.some((ref) => ref.startsWith(STEPS_PREFIX)),
                    ),
                  )
                  .map((group) => (
                    <Box key={`planning-nonstep-${group.floorName}-${String(group.floorNumber)}`}>
                      <FloorHeaderLayerWidget
                        floorNumber={group.floorNumber}
                        name={group.floorName}
                        {...(groupActiveCounts.has(group)
                          ? {
                              concurrent: {
                                active: groupActiveCounts.get(group) ?? slotCountContract.parse(0),
                                max: groupTotalCounts.get(group) ?? slotCountContract.parse(0),
                              },
                            }
                          : {})}
                      />
                      {group.workItems.map((wi, wiIndex) => {
                        const wiEntries = wi.sessionId
                          ? (sessionEntries.get(wi.sessionId) ?? [])
                          : [];
                        const wiDepLabels = wi.dependsOn
                          .map((depId) => workItemIdToLabel.get(depId) ?? depId)
                          .filter((label) => label.length > 0);
                        return (
                          <ExecutionRowLayerWidget
                            key={wi.id}
                            order={(wiIndex + 1) as StepOrder}
                            name={
                              `${wi.role.charAt(0).toUpperCase()}${wi.role.slice(1)}${group.workItems.length > 1 ? ` #${String(wiIndex + 1)}` : ''}` as unknown as StepName
                            }
                            role={wi.role as unknown as ExecutionRole}
                            status={wi.status as unknown as ExecutionStepStatus}
                            files={[] as DisplayFilePath[]}
                            dependsOn={wiDepLabels as unknown as DependencyLabel[]}
                            isAdhoc={wi.insertedBy !== undefined}
                            entries={wiEntries}
                            attempt={wi.attempt}
                            maxAttempts={wi.maxAttempts}
                            startedAt={wi.startedAt}
                            completedAt={wi.completedAt}
                            {...(wi.errorMessage ? { errorMessage: wi.errorMessage } : {})}
                            {...(wi.summary ? { summary: wi.summary } : {})}
                            {...(wi.smoketestExpectedSignal
                              ? { expectedSignal: wi.smoketestExpectedSignal }
                              : {})}
                            {...(wi.actualSignal ? { actualSignal: wi.actualSignal } : {})}
                            {...(wi.sessionId ? { sessionId: wi.sessionId } : {})}
                            {...(guildSlug ? { guildSlug } : {})}
                          />
                        );
                      })}
                    </Box>
                  ))}
                <ExecutionRowLayerWidget
                  order={'--' as unknown as StepOrder}
                  name={'Planning steps...' as StepName}
                  role={'pathseeker' as ExecutionRole}
                  status={'in_progress' as ExecutionStepStatus}
                  files={[] as DisplayFilePath[]}
                  dependsOn={[] as DependencyLabel[]}
                  isAdhoc={false}
                  entries={slotEntries.get(0 as SlotIndex) ?? []}
                  isStreaming={true}
                />
                <Text
                  ff="monospace"
                  data-testid="execution-panel-planning-text"
                  style={{
                    fontSize: 10,
                    color: colors['text-dim'],
                    textAlign: 'center',
                    padding: '16px 0',
                  }}
                >
                  Steps will appear once cartography is complete...
                </Text>
              </>
            ) : null}
            {hasWorkItemsOnly
              ? floorGroups.map((group) => (
                  <Box key={`${group.floorName}-${String(group.floorNumber)}`}>
                    <FloorHeaderLayerWidget
                      floorNumber={group.floorNumber}
                      name={group.floorName}
                      {...(groupActiveCounts.has(group)
                        ? {
                            concurrent: {
                              active: groupActiveCounts.get(group) ?? slotCountContract.parse(0),
                              max: groupTotalCounts.get(group) ?? slotCountContract.parse(0),
                            },
                          }
                        : {})}
                    />
                    {group.workItems.map((wi, wiIndex) => {
                      const wiEntries = wi.sessionId
                        ? (sessionEntries.get(wi.sessionId) ?? [])
                        : [];
                      const wiDepLabels = wi.dependsOn
                        .map((depId) => workItemIdToLabel.get(depId) ?? depId)
                        .filter((label) => label.length > 0);
                      return (
                        <ExecutionRowLayerWidget
                          key={wi.id}
                          order={(wiIndex + 1) as StepOrder}
                          name={
                            `${wi.role.charAt(0).toUpperCase()}${wi.role.slice(1)}${group.workItems.length > 1 ? ` #${String(wiIndex + 1)}` : ''}` as unknown as StepName
                          }
                          role={wi.role as unknown as ExecutionRole}
                          status={wi.status as unknown as ExecutionStepStatus}
                          files={[] as DisplayFilePath[]}
                          dependsOn={wiDepLabels as unknown as DependencyLabel[]}
                          isAdhoc={wi.insertedBy !== undefined}
                          entries={wiEntries}
                          attempt={wi.attempt}
                          maxAttempts={wi.maxAttempts}
                          startedAt={wi.startedAt}
                          completedAt={wi.completedAt}
                          {...(wi.errorMessage ? { errorMessage: wi.errorMessage } : {})}
                          {...(wi.summary ? { summary: wi.summary } : {})}
                          {...(wi.smoketestExpectedSignal
                            ? { expectedSignal: wi.smoketestExpectedSignal }
                            : {})}
                          {...(wi.actualSignal ? { actualSignal: wi.actualSignal } : {})}
                          {...(wi.sessionId ? { sessionId: wi.sessionId } : {})}
                          {...(guildSlug ? { guildSlug } : {})}
                        />
                      );
                    })}
                  </Box>
                ))
              : null}
            {isPlanning || hasWorkItemsOnly ? null : (
              <>
                {floorGroups.map((group) => {
                  const nonStepItems = group.workItems.filter((wi) => {
                    if (wi.role === 'pathseeker') return true;
                    const hasStepRef = wi.relatedDataItems.some((ref) =>
                      ref.startsWith(STEPS_PREFIX),
                    );
                    return !hasStepRef;
                  });
                  const steppedItems =
                    steps.length > 0
                      ? group.workItems.filter((wi) =>
                          wi.relatedDataItems.some((ref) => ref.startsWith(STEPS_PREFIX)),
                        )
                      : [];
                  const allItems = [...nonStepItems, ...steppedItems];
                  if (allItems.length === 0) return null;

                  return (
                    <Box key={`floor-${group.key}`}>
                      <FloorHeaderLayerWidget
                        floorNumber={group.floorNumber}
                        name={group.floorName}
                        {...(groupActiveCounts.has(group)
                          ? {
                              concurrent: {
                                active: groupActiveCounts.get(group) ?? slotCountContract.parse(0),
                                max: groupTotalCounts.get(group) ?? slotCountContract.parse(0),
                              },
                            }
                          : {})}
                      />
                      {nonStepItems.map((wi, wiIndex) => {
                        const wiEntries = wi.sessionId
                          ? (sessionEntries.get(wi.sessionId) ?? [])
                          : [];
                        const wiDepLabels = wi.dependsOn
                          .map((depId) => workItemIdToLabel.get(depId) ?? depId)
                          .filter((label) => label.length > 0);
                        return (
                          <ExecutionRowLayerWidget
                            key={wi.id}
                            order={(wiIndex + 1) as StepOrder}
                            name={
                              `${wi.role.charAt(0).toUpperCase()}${wi.role.slice(1)}${group.workItems.length > 1 ? ` #${String(wiIndex + 1)}` : ''}` as unknown as StepName
                            }
                            role={wi.role as unknown as ExecutionRole}
                            status={wi.status as unknown as ExecutionStepStatus}
                            files={[] as DisplayFilePath[]}
                            dependsOn={wiDepLabels as unknown as DependencyLabel[]}
                            isAdhoc={wi.insertedBy !== undefined}
                            entries={wiEntries}
                            attempt={wi.attempt}
                            maxAttempts={wi.maxAttempts}
                            startedAt={wi.startedAt}
                            completedAt={wi.completedAt}
                            {...(wi.errorMessage ? { errorMessage: wi.errorMessage } : {})}
                            {...(wi.summary ? { summary: wi.summary } : {})}
                            {...(wi.smoketestExpectedSignal
                              ? { expectedSignal: wi.smoketestExpectedSignal }
                              : {})}
                            {...(wi.actualSignal ? { actualSignal: wi.actualSignal } : {})}
                            {...(wi.sessionId ? { sessionId: wi.sessionId } : {})}
                            {...(guildSlug ? { guildSlug } : {})}
                          />
                        );
                      })}
                      {steppedItems.map((wi, stepIndex) => {
                        const stepRef = wi.relatedDataItems.find((ref) =>
                          ref.startsWith(STEPS_PREFIX),
                        );
                        const stepId = stepRef
                          ? (stepRef.slice(STEPS_PREFIX_LENGTH) as StepId)
                          : undefined;
                        const step = stepId ? stepsById.get(stepId) : undefined;
                        const wiStatus = wi.status as ExecutionStepStatus;
                        const stepEntries = wi.sessionId
                          ? (sessionEntries.get(wi.sessionId) ?? [])
                          : [];
                        const wardRefs = wi.relatedDataItems.filter((ref) =>
                          ref.startsWith('wardResults/'),
                        );
                        const resolvedWardResults = wardRefs
                          .map((ref) =>
                            wardResultsById.get(
                              ref.slice(
                                WARD_RESULTS_PREFIX_LENGTH,
                              ) as (typeof quest.wardResults)[0]['id'],
                            ),
                          )
                          .filter((wr): wr is NonNullable<typeof wr> => wr !== undefined);
                        return (
                          <ExecutionRowLayerWidget
                            key={wi.id}
                            order={(stepIndex + 1) as StepOrder}
                            name={
                              step
                                ? (step.name as unknown as StepName)
                                : (`${wi.role.charAt(0).toUpperCase()}${wi.role.slice(1)}${steppedItems.length > 1 ? ` #${String(stepIndex + 1)}` : ''}` as unknown as StepName)
                            }
                            role={wi.role as unknown as ExecutionRole}
                            status={wiStatus}
                            files={
                              step
                                ? ([
                                    ...(step.focusFile ? [step.focusFile.path] : []),
                                    ...step.accompanyingFiles.map((af) => af.path),
                                  ] as unknown as DisplayFilePath[])
                                : ([] as DisplayFilePath[])
                            }
                            dependsOn={
                              step
                                ? (step.dependsOn as unknown as DependencyLabel[])
                                : ([] as DependencyLabel[])
                            }
                            isAdhoc={wi.insertedBy !== undefined}
                            entries={stepEntries}
                            isStreaming={wiStatus === ('in_progress' as ExecutionStepStatus)}
                            {...(step
                              ? {
                                  observablesSatisfied: step.observablesSatisfied,
                                  inputContracts: step.inputContracts,
                                  outputContracts: step.outputContracts,
                                }
                              : {})}
                            attempt={wi.attempt}
                            maxAttempts={wi.maxAttempts}
                            {...(wi.startedAt ? { startedAt: wi.startedAt } : {})}
                            {...(wi.completedAt ? { completedAt: wi.completedAt } : {})}
                            {...(wi.errorMessage ? { errorMessage: wi.errorMessage } : {})}
                            {...(wi.summary ? { summary: wi.summary } : {})}
                            {...(resolvedWardResults.length > 0
                              ? { wardResults: resolvedWardResults }
                              : {})}
                            {...(wi.smoketestExpectedSignal
                              ? { expectedSignal: wi.smoketestExpectedSignal }
                              : {})}
                            {...(wi.actualSignal ? { actualSignal: wi.actualSignal } : {})}
                            {...(wi.sessionId ? { sessionId: wi.sessionId } : {})}
                            {...(guildSlug ? { guildSlug } : {})}
                          />
                        );
                      })}
                    </Box>
                  );
                })}
              </>
            )}
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
