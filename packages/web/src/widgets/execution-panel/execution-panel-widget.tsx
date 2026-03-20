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
  WorkItem,
} from '@dungeonmaster/shared/contracts';

import type { ButtonLabel } from '../../contracts/button-label/button-label-contract';
import type { ButtonVariant } from '../../contracts/button-variant/button-variant-contract';
import type { ChatEntry } from '../../contracts/chat-entry/chat-entry-contract';
import type { CompletedCount } from '../../contracts/completed-count/completed-count-contract';
import type { DependencyLabel } from '../../contracts/dependency-label/dependency-label-contract';
import type { DisplayFilePath } from '../../contracts/display-file-path/display-file-path-contract';
import type { ExecutionRole } from '../../contracts/execution-role/execution-role-contract';
import type { ExecutionStepStatus } from '../../contracts/execution-step-status/execution-step-status-contract';
import type { FloorName } from '../../contracts/floor-name/floor-name-contract';
import type { FloorNumber } from '../../contracts/floor-number/floor-number-contract';
import type { SlotCount } from '../../contracts/slot-count/slot-count-contract';
import { slotCountContract } from '../../contracts/slot-count/slot-count-contract';
import type { SlotIndex } from '../../contracts/slot-index/slot-index-contract';
import type { StepName } from '../../contracts/step-name/step-name-contract';
import type { StepOrder } from '../../contracts/step-order/step-order-contract';
import type { TotalCount } from '../../contracts/total-count/total-count-contract';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';
import { executionFloorConfigStatics } from '../../statics/execution-floor-config/execution-floor-config-statics';
import { PixelBtnWidget } from '../pixel-btn/pixel-btn-widget';
import { QuestSpecPanelWidget } from '../quest-spec-panel/quest-spec-panel-widget';
import { ExecutionRowLayerWidget } from './execution-row-layer-widget';
import { ExecutionStatusBarLayerWidget } from './execution-status-bar-layer-widget';
import { FloorHeaderLayerWidget } from './floor-header-layer-widget';

export interface ExecutionPanelWidgetProps {
  quest: Quest;
  slotEntries?: Map<SlotIndex, ChatEntry[]>;
  sessionEntries?: Map<SessionId, ChatEntry[]>;
  onStatusChange?: (params: { status: QuestStatus }) => void;
}

const TABS = [
  { id: 'execution', label: 'EXECUTION' },
  { id: 'spec', label: 'QUEST SPEC' },
] as const;

const TAB_FONT_SIZE = 10;
const TAB_FONT_WEIGHT = 600;
const ACTIVE_BORDER_WIDTH = 2;
const TAB_PADDING_VERTICAL = 5;
const DEFAULT_ROLE = 'codeweaver' as ExecutionRole;
const RESUME_LABEL = 'RESUME QUEST' as ButtonLabel;
const ABANDON_LABEL = 'ABANDON QUEST' as ButtonLabel;
const CONFIRM_ABANDON_LABEL = 'CONFIRM ABANDON' as ButtonLabel;
const CANCEL_LABEL = 'CANCEL' as ButtonLabel;
const DANGER_VARIANT = 'danger' as ButtonVariant;
const GHOST_VARIANT = 'ghost' as ButtonVariant;
const ACTION_BAR_PADDING = 12;
const WARD_RESULTS_PREFIX_LENGTH = 'wardResults/'.length;

export const ExecutionPanelWidget = ({
  quest,
  slotEntries = new Map(),
  sessionEntries = new Map(),
  onStatusChange,
}: ExecutionPanelWidgetProps): React.JSX.Element => {
  const [activeTab, setActiveTab] = useState<'execution' | 'spec'>('execution');
  const [confirmingAbandon, setConfirmingAbandon] = useState(false);
  const { colors } = emberDepthsThemeStatics;

  const { steps } = quest;
  const isTerminalQuest = quest.status === 'complete' || quest.status === 'abandoned';
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

  const totalCount = (hasWorkItemsOnly ? quest.workItems.length : steps.length) as TotalCount;
  const completedCount = (
    hasWorkItemsOnly
      ? quest.workItems.filter((wi) => wi.status === 'complete').length
      : [...stepWorkItemMap.values()].filter((wi) => wi.status === 'complete').length
  ) as CompletedCount;

  const floorConfigs = executionFloorConfigStatics.floors;

  const stepRoleMap = new Map<ExecutionRole, typeof steps>();
  for (const step of steps) {
    const wi = stepWorkItemMap.get(step.id);
    const role = wi ? wi.role : DEFAULT_ROLE;
    const existing = stepRoleMap.get(role) ?? [];
    existing.push(step);
    stepRoleMap.set(role, existing);
  }

  const workItemsByRole = new Map<ExecutionRole, WorkItem[]>();
  if (hasWorkItemsOnly) {
    for (const wi of quest.workItems) {
      const { role } = wi;
      const existing = workItemsByRole.get(role) ?? [];
      existing.push(wi);
      workItemsByRole.set(role, existing);
    }
  }

  const steppedWorkItemIds = new Set<WorkItem['id']>();
  for (const wi of stepWorkItemMap.values()) {
    steppedWorkItemIds.add(wi.id);
  }

  const nonStepWorkItemsByRole = new Map<ExecutionRole, WorkItem[]>();
  for (const wi of quest.workItems) {
    if (wi.role === 'pathseeker') continue;
    if (steppedWorkItemIds.has(wi.id)) continue;
    const existing = nonStepWorkItemsByRole.get(wi.role as ExecutionRole) ?? [];
    existing.push(wi);
    nonStepWorkItemsByRole.set(wi.role as ExecutionRole, existing);
  }

  const nonStepFloorCount = floorConfigs.filter((floor) =>
    nonStepWorkItemsByRole.has(floor.role),
  ).length;

  const pathseekerWorkItem = quest.workItems.find((wi) => wi.role === 'pathseeker');

  const workItemIdToRole = new Map<WorkItem['id'], WorkItem['role']>();
  for (const wi of quest.workItems) {
    workItemIdToRole.set(wi.id, wi.role);
  }

  const wardResultsById = new Map<
    (typeof quest.wardResults)[0]['id'],
    (typeof quest.wardResults)[0]
  >();
  for (const wr of quest.wardResults) {
    wardResultsById.set(wr.id, wr);
  }

  const roleActiveCounts = new Map<ExecutionRole, SlotCount>();
  const roleTotalCounts = new Map<ExecutionRole, SlotCount>();
  for (const wi of quest.workItems) {
    const { role } = wi;
    const currentTotal = roleTotalCounts.get(role) ?? slotCountContract.parse(0);
    roleTotalCounts.set(role, slotCountContract.parse(currentTotal + 1));
    if (wi.status === 'in_progress') {
      const currentActive = roleActiveCounts.get(role) ?? slotCountContract.parse(0);
      roleActiveCounts.set(role, slotCountContract.parse(currentActive + 1));
    }
  }

  const nonStepFloorElements = useMemo((): React.JSX.Element[] | null => {
    if (hasWorkItemsOnly) return null;
    if (nonStepWorkItemsByRole.size === 0) return null;

    let floorCounter = 0;
    return floorConfigs
      .filter((floor) => nonStepWorkItemsByRole.has(floor.role))
      .map((floor) => {
        floorCounter += 1;
        const floorItems = nonStepWorkItemsByRole.get(floor.role) ?? [];
        return (
          <Box key={`nonstep-${floor.role}`}>
            <FloorHeaderLayerWidget
              floorNumber={floorCounter as FloorNumber}
              name={floor.name as FloorName}
              {...(roleActiveCounts.has(floor.role)
                ? {
                    concurrent: {
                      active: roleActiveCounts.get(floor.role) ?? slotCountContract.parse(0),
                      max: roleTotalCounts.get(floor.role) ?? slotCountContract.parse(0),
                    },
                  }
                : {})}
            />
            {floorItems.map((wi, wiIndex) => {
              const wiEntries = wi.sessionId ? (sessionEntries.get(wi.sessionId) ?? []) : [];
              const wiDepLabels = wi.dependsOn
                .map((depId) => workItemIdToRole.get(depId) ?? depId)
                .filter((label) => label.length > 0);
              return (
                <ExecutionRowLayerWidget
                  key={wi.id}
                  order={(wiIndex + 1) as StepOrder}
                  name={
                    `${wi.role.charAt(0).toUpperCase()}${wi.role.slice(1)} #${String(wiIndex + 1)}` as unknown as StepName
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
                />
              );
            })}
          </Box>
        );
      });
  }, [
    hasWorkItemsOnly,
    nonStepWorkItemsByRole,
    floorConfigs,
    roleActiveCounts,
    roleTotalCounts,
    sessionEntries,
    workItemIdToRole,
  ]);

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
          <Text
            ff="monospace"
            data-testid="execution-panel-quest-title"
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: colors['loot-gold'],
              padding: '8px 12px',
              borderBottom: `1px solid ${colors.border}`,
            }}
          >
            {quest.title}
          </Text>
          <ExecutionStatusBarLayerWidget
            completedCount={completedCount}
            totalCount={totalCount}
            isPlanning={isPlanning}
          />
          <Box
            data-testid="execution-panel-floor-content"
            style={{ flex: 1, overflowY: 'auto', padding: '0 12px 12px' }}
          >
            {isPlanning ? (
              <>
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
              ? (() => {
                  let floorCounter = 0;
                  return floorConfigs
                    .filter((floor) => workItemsByRole.has(floor.role))
                    .map((floor) => {
                      floorCounter += 1;
                      const floorItems = workItemsByRole.get(floor.role) ?? [];
                      return (
                        <Box key={floor.role}>
                          <FloorHeaderLayerWidget
                            floorNumber={floorCounter as FloorNumber}
                            name={floor.name as FloorName}
                            {...(roleActiveCounts.has(floor.role)
                              ? {
                                  concurrent: {
                                    active:
                                      roleActiveCounts.get(floor.role) ??
                                      slotCountContract.parse(0),
                                    max:
                                      roleTotalCounts.get(floor.role) ?? slotCountContract.parse(0),
                                  },
                                }
                              : {})}
                          />
                          {floorItems.map((wi, wiIndex) => {
                            const wiEntries = wi.sessionId
                              ? (sessionEntries.get(wi.sessionId) ?? [])
                              : [];
                            const wiDepLabels = wi.dependsOn
                              .map((depId) => workItemIdToRole.get(depId) ?? depId)
                              .filter((label) => label.length > 0);
                            return (
                              <ExecutionRowLayerWidget
                                key={wi.id}
                                order={(wiIndex + 1) as StepOrder}
                                name={
                                  `${wi.role.charAt(0).toUpperCase()}${wi.role.slice(1)} #${String(wiIndex + 1)}` as unknown as StepName
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
                              />
                            );
                          })}
                        </Box>
                      );
                    });
                })()
              : null}
            {nonStepFloorElements}
            {isPlanning || hasWorkItemsOnly ? null : (
              <ExecutionRowLayerWidget
                order={'--' as unknown as StepOrder}
                name={`Planned ${String(totalCount)} steps` as StepName}
                role={'pathseeker' as ExecutionRole}
                status={
                  (pathseekerWorkItem?.status ?? 'complete') as unknown as ExecutionStepStatus
                }
                files={[] as DisplayFilePath[]}
                dependsOn={[] as DependencyLabel[]}
                isAdhoc={false}
                entries={
                  pathseekerWorkItem?.sessionId
                    ? (sessionEntries.get(pathseekerWorkItem.sessionId) ?? [])
                    : []
                }
                {...(pathseekerWorkItem
                  ? {
                      attempt: pathseekerWorkItem.attempt,
                      maxAttempts: pathseekerWorkItem.maxAttempts,
                      ...(pathseekerWorkItem.startedAt
                        ? { startedAt: pathseekerWorkItem.startedAt }
                        : {}),
                      ...(pathseekerWorkItem.completedAt
                        ? { completedAt: pathseekerWorkItem.completedAt }
                        : {}),
                      ...(pathseekerWorkItem.errorMessage
                        ? { errorMessage: pathseekerWorkItem.errorMessage }
                        : {}),
                    }
                  : {})}
              />
            )}
            {steps.length > 0
              ? (() => {
                  let floorCounter = nonStepFloorCount;
                  return floorConfigs
                    .filter((floor) => stepRoleMap.has(floor.role))
                    .map((floor) => {
                      floorCounter += 1;
                      const floorSteps = stepRoleMap.get(floor.role) ?? [];
                      return (
                        <Box key={floor.role}>
                          <FloorHeaderLayerWidget
                            floorNumber={floorCounter as FloorNumber}
                            name={floor.name as FloorName}
                            {...(roleActiveCounts.has(floor.role)
                              ? {
                                  concurrent: {
                                    active:
                                      roleActiveCounts.get(floor.role) ??
                                      slotCountContract.parse(0),
                                    max:
                                      roleTotalCounts.get(floor.role) ?? slotCountContract.parse(0),
                                  },
                                }
                              : {})}
                          />
                          {floorSteps.map((step, stepIndex) => {
                            const wi = stepWorkItemMap.get(step.id);
                            const wiStatus = (wi?.status ?? 'pending') as ExecutionStepStatus;
                            const stepEntries = wi?.sessionId
                              ? (sessionEntries.get(wi.sessionId) ?? [])
                              : [];
                            const wardRefs = wi
                              ? wi.relatedDataItems.filter((ref) => ref.startsWith('wardResults/'))
                              : [];
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
                                key={step.id}
                                order={(stepIndex + 1) as StepOrder}
                                name={step.name as unknown as StepName}
                                role={wi ? (wi.role as unknown as ExecutionRole) : DEFAULT_ROLE}
                                status={wiStatus}
                                files={
                                  [
                                    ...step.filesToCreate,
                                    ...step.filesToModify,
                                  ] as unknown as DisplayFilePath[]
                                }
                                dependsOn={step.dependsOn as unknown as DependencyLabel[]}
                                isAdhoc={wi?.insertedBy !== undefined}
                                entries={stepEntries}
                                isStreaming={wiStatus === ('in_progress' as ExecutionStepStatus)}
                                description={step.description}
                                observablesSatisfied={step.observablesSatisfied}
                                inputContracts={step.inputContracts}
                                outputContracts={step.outputContracts}
                                {...(wi
                                  ? {
                                      attempt: wi.attempt,
                                      maxAttempts: wi.maxAttempts,
                                      ...(wi.startedAt ? { startedAt: wi.startedAt } : {}),
                                      ...(wi.completedAt ? { completedAt: wi.completedAt } : {}),
                                      ...(wi.errorMessage ? { errorMessage: wi.errorMessage } : {}),
                                    }
                                  : {})}
                                {...(resolvedWardResults.length > 0
                                  ? { wardResults: resolvedWardResults }
                                  : {})}
                              />
                            );
                          })}
                        </Box>
                      );
                    });
                })()
              : null}
          </Box>
          {(quest.status === 'blocked' || quest.status === 'in_progress') && onStatusChange && (
            <Box
              data-testid="execution-panel-action-bar"
              style={{
                padding: ACTION_BAR_PADDING,
                borderTop: `1px solid ${colors.border}`,
                flexShrink: 0,
              }}
            >
              <Group gap="xs">
                {quest.status === 'blocked' && !confirmingAbandon && (
                  <PixelBtnWidget
                    label={RESUME_LABEL}
                    onClick={() => {
                      onStatusChange({ status: 'in_progress' as QuestStatus });
                    }}
                  />
                )}
                {confirmingAbandon ? (
                  <>
                    <PixelBtnWidget
                      label={CONFIRM_ABANDON_LABEL}
                      variant={DANGER_VARIANT}
                      onClick={() => {
                        setConfirmingAbandon(false);
                        onStatusChange({ status: 'abandoned' as QuestStatus });
                      }}
                    />
                    <PixelBtnWidget
                      label={CANCEL_LABEL}
                      variant={GHOST_VARIANT}
                      onClick={() => {
                        setConfirmingAbandon(false);
                      }}
                    />
                  </>
                ) : (
                  <PixelBtnWidget
                    label={ABANDON_LABEL}
                    variant={GHOST_VARIANT}
                    onClick={() => {
                      setConfirmingAbandon(true);
                    }}
                  />
                )}
              </Group>
            </Box>
          )}
        </Box>
      )}
    </Stack>
  );
};
