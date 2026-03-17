/**
 * PURPOSE: Composes the execution panel with tab bar, status bar, floor headers, and step rows for quest execution view
 *
 * USAGE:
 * <ExecutionPanelWidget quest={quest} />
 * // Renders tabbed panel with EXECUTION and QUEST SPEC tabs, floor-based step layout
 */

import { useState } from 'react';

import { Box, Group, Stack, Text, UnstyledButton } from '@mantine/core';

import type { Quest, QuestStatus, StepId, WorkItem } from '@dungeonmaster/shared/contracts';

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
const COLON_SEPARATOR_OFFSET = 2;
const DEFAULT_ROLE = 'codeweaver' as ExecutionRole;
const RESUME_LABEL = 'RESUME QUEST' as ButtonLabel;
const ABANDON_LABEL = 'ABANDON QUEST' as ButtonLabel;
const CONFIRM_ABANDON_LABEL = 'CONFIRM ABANDON' as ButtonLabel;
const CANCEL_LABEL = 'CANCEL' as ButtonLabel;
const DANGER_VARIANT = 'danger' as ButtonVariant;
const GHOST_VARIANT = 'ghost' as ButtonVariant;
const ACTION_BAR_PADDING = 12;

export const ExecutionPanelWidget = ({
  quest,
  slotEntries = new Map(),
  onStatusChange,
}: ExecutionPanelWidgetProps): React.JSX.Element => {
  const [activeTab, setActiveTab] = useState<'execution' | 'spec'>('execution');
  const [confirmingAbandon, setConfirmingAbandon] = useState(false);
  const { colors } = emberDepthsThemeStatics;

  const { steps } = quest;
  const totalCount = steps.length as TotalCount;
  const isPlanning = steps.length === 0;

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

  const completedCount = [...stepWorkItemMap.values()].filter((wi) => wi.status === 'complete')
    .length as CompletedCount;

  const floorConfigs = executionFloorConfigStatics.floors;

  const otherRoles = new Set<ExecutionRole>(
    floorConfigs.filter((f) => f.role !== 'codeweaver').map((f) => f.role as ExecutionRole),
  );

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
            {isPlanning ? null : (
              <ExecutionRowLayerWidget
                order={'--' as unknown as StepOrder}
                name={`Planned ${String(totalCount)} steps` as StepName}
                role={'pathseeker' as ExecutionRole}
                status={'complete' as ExecutionStepStatus}
                files={[] as DisplayFilePath[]}
                dependsOn={[] as DependencyLabel[]}
                isAdhoc={false}
              />
            )}
            {floorConfigs.map((floor, floorIndex) => {
              const floorNumber = (floorIndex + 1) as FloorNumber;
              const floorLabel = floor.label;
              const colonIndex = floorLabel.indexOf(': ');
              const floorName = (
                colonIndex >= 0 ? floorLabel.slice(colonIndex + COLON_SEPARATOR_OFFSET) : floorLabel
              ) as FloorName;

              if (floor.role === 'codeweaver') {
                const codeweaverSteps = steps.filter((step) => {
                  const wi = stepWorkItemMap.get(step.id);
                  const role = wi ? (wi.role as ExecutionRole) : DEFAULT_ROLE;
                  return !otherRoles.has(role);
                });

                if (codeweaverSteps.length === 0 && steps.length === 0) {
                  return (
                    <Box key={floor.role}>
                      <FloorHeaderLayerWidget floorNumber={floorNumber} name={floorName} />
                    </Box>
                  );
                }

                if (codeweaverSteps.length === 0) {
                  return null;
                }

                return (
                  <Box key={floor.role}>
                    <FloorHeaderLayerWidget floorNumber={floorNumber} name={floorName} />
                    {codeweaverSteps.map((step, stepIndex) => {
                      const wi = stepWorkItemMap.get(step.id);
                      const wiStatus = (wi?.status ?? 'pending') as ExecutionStepStatus;
                      return (
                        <ExecutionRowLayerWidget
                          key={step.id}
                          order={(stepIndex + 1) as StepOrder}
                          name={step.name as unknown as StepName}
                          role={wi ? (wi.role as ExecutionRole) : DEFAULT_ROLE}
                          status={wiStatus}
                          files={
                            [
                              ...step.filesToCreate,
                              ...step.filesToModify,
                            ] as unknown as DisplayFilePath[]
                          }
                          dependsOn={step.dependsOn as unknown as DependencyLabel[]}
                          isAdhoc={wi?.insertedBy !== undefined}
                          entries={slotEntries.get(0 as SlotIndex) ?? []}
                          isStreaming={wiStatus === ('in_progress' as ExecutionStepStatus)}
                          {...(wi?.errorMessage ? { errorMessage: wi.errorMessage } : {})}
                        />
                      );
                    })}
                  </Box>
                );
              }

              const floorSteps = steps.filter((step) => {
                const wi = stepWorkItemMap.get(step.id);
                const role = wi ? (wi.role as ExecutionRole) : DEFAULT_ROLE;
                return role === floor.role;
              });

              if (floorSteps.length === 0) {
                return null;
              }

              return (
                <Box key={floor.role}>
                  <FloorHeaderLayerWidget floorNumber={floorNumber} name={floorName} />
                  {floorSteps.map((step, stepIndex) => {
                    const wi = stepWorkItemMap.get(step.id);
                    const wiStatus = (wi?.status ?? 'pending') as ExecutionStepStatus;
                    return (
                      <ExecutionRowLayerWidget
                        key={step.id}
                        order={(stepIndex + 1) as StepOrder}
                        name={step.name as unknown as StepName}
                        role={wi ? (wi.role as ExecutionRole) : (floor.role as ExecutionRole)}
                        status={wiStatus}
                        files={
                          [
                            ...step.filesToCreate,
                            ...step.filesToModify,
                          ] as unknown as DisplayFilePath[]
                        }
                        dependsOn={step.dependsOn as unknown as DependencyLabel[]}
                        isAdhoc={wi?.insertedBy !== undefined}
                        entries={slotEntries.get(0 as SlotIndex) ?? []}
                        isStreaming={wiStatus === ('in_progress' as ExecutionStepStatus)}
                        {...(wi?.errorMessage ? { errorMessage: wi.errorMessage } : {})}
                      />
                    );
                  })}
                </Box>
              );
            })}
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
