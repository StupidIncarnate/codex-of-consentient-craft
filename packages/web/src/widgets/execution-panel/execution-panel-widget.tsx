/**
 * PURPOSE: Composes the execution panel with tab bar, status bar, floor headers, and step rows for quest execution view
 *
 * USAGE:
 * <ExecutionPanelWidget quest={quest} />
 * // Renders tabbed panel with EXECUTION and QUEST SPEC tabs, floor-based step layout
 */

import { useState } from 'react';

import { Box, Stack, UnstyledButton } from '@mantine/core';

import type { Quest } from '@dungeonmaster/shared/contracts';

import type { AgentOutputLine } from '../../contracts/agent-output-line/agent-output-line-contract';
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
import { AgentOutputPanelWidget } from '../agent-output-panel/agent-output-panel-widget';
import { QuestSpecPanelWidget } from '../quest-spec-panel/quest-spec-panel-widget';
import { ExecutionRowLayerWidget } from './execution-row-layer-widget';
import { ExecutionStatusBarLayerWidget } from './execution-status-bar-layer-widget';
import { FloorHeaderLayerWidget } from './floor-header-layer-widget';

export interface ExecutionPanelWidgetProps {
  quest: Quest;
  slotOutputs?: Map<SlotIndex, AgentOutputLine[]>;
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

export const ExecutionPanelWidget = ({
  quest,
  slotOutputs = new Map(),
}: ExecutionPanelWidgetProps): React.JSX.Element => {
  const [activeTab, setActiveTab] = useState<'execution' | 'spec'>('execution');
  const { colors } = emberDepthsThemeStatics;

  const { steps } = quest;
  const completedCount = steps.filter((s) => s.status === 'complete').length as CompletedCount;
  const totalCount = steps.length as TotalCount;
  const isPlanning = steps.length === 0;

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
          {Array.from(slotOutputs.entries()).map(([slotIndex, lines]) => (
            <AgentOutputPanelWidget key={String(slotIndex)} slotIndex={slotIndex} lines={lines} />
          ))}
          <Box
            data-testid="execution-panel-floor-content"
            style={{ flex: 1, overflowY: 'auto', padding: '0 12px 12px' }}
          >
            {floorConfigs.map((floor, floorIndex) => {
              const floorNumber = (floorIndex + 1) as FloorNumber;
              const floorLabel = floor.label;
              const colonIndex = floorLabel.indexOf(': ');
              const floorName = (
                colonIndex >= 0 ? floorLabel.slice(colonIndex + COLON_SEPARATOR_OFFSET) : floorLabel
              ) as FloorName;

              if (floor.role === 'codeweaver') {
                const codeweaverSteps = steps.filter((step) => {
                  const role =
                    (step.currentSession?.agentRole as ExecutionRole | undefined) ?? DEFAULT_ROLE;
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
                    {codeweaverSteps.map((step, stepIndex) => (
                      <ExecutionRowLayerWidget
                        key={step.id}
                        order={(stepIndex + 1) as StepOrder}
                        name={step.name as unknown as StepName}
                        role={
                          (step.currentSession?.agentRole as ExecutionRole | undefined) ??
                          DEFAULT_ROLE
                        }
                        status={step.status as ExecutionStepStatus}
                        files={
                          [
                            ...step.filesToCreate,
                            ...step.filesToModify,
                          ] as unknown as DisplayFilePath[]
                        }
                        dependsOn={step.dependsOn as unknown as DependencyLabel[]}
                        isAdhoc={step.blockingType === 'needs_role_followup'}
                        {...(step.errorMessage ? { errorMessage: step.errorMessage } : {})}
                        {...(step.blockingReason ? { blockingReason: step.blockingReason } : {})}
                      />
                    ))}
                  </Box>
                );
              }

              const floorSteps = steps.filter((step) => {
                const role =
                  (step.currentSession?.agentRole as ExecutionRole | undefined) ?? DEFAULT_ROLE;
                return role === floor.role;
              });

              if (floorSteps.length === 0) {
                return null;
              }

              return (
                <Box key={floor.role}>
                  <FloorHeaderLayerWidget floorNumber={floorNumber} name={floorName} />
                  {floorSteps.map((step, stepIndex) => (
                    <ExecutionRowLayerWidget
                      key={step.id}
                      order={(stepIndex + 1) as StepOrder}
                      name={step.name as unknown as StepName}
                      role={
                        (step.currentSession?.agentRole as ExecutionRole | undefined) ??
                        (floor.role as ExecutionRole)
                      }
                      status={step.status as ExecutionStepStatus}
                      files={
                        [
                          ...step.filesToCreate,
                          ...step.filesToModify,
                        ] as unknown as DisplayFilePath[]
                      }
                      dependsOn={step.dependsOn as unknown as DependencyLabel[]}
                      isAdhoc={step.blockingType === 'needs_role_followup'}
                      {...(step.errorMessage ? { errorMessage: step.errorMessage } : {})}
                      {...(step.blockingReason ? { blockingReason: step.blockingReason } : {})}
                    />
                  ))}
                </Box>
              );
            })}
          </Box>
        </Box>
      )}
    </Stack>
  );
};
