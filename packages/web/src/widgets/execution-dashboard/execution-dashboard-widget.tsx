/**
 * PURPOSE: Displays live execution progress with phase indicator, progress bar, slot grid, and agent output
 *
 * USAGE:
 * <ExecutionDashboardWidget status={orchestrationStatus} slotOutputs={outputMap} />
 * // Renders full execution dashboard with all sub-widgets
 */

import { Progress, Stack, Text } from '@mantine/core';

import type { OrchestrationStatus } from '@dungeonmaster/shared/contracts';

import type { AgentOutputLine } from '../../contracts/agent-output-line/agent-output-line-contract';
import type { SlotIndex } from '../../contracts/slot-index/slot-index-contract';
import { slotIndexContract } from '../../contracts/slot-index/slot-index-contract';
import { pipelinePhasesStatics } from '../../statics/pipeline-phases/pipeline-phases-statics';
import { AgentOutputPanelWidget } from '../agent-output-panel/agent-output-panel-widget';
import { PhaseIndicatorWidget } from '../phase-indicator/phase-indicator-widget';
import { SlotGridWidget } from '../slot-grid/slot-grid-widget';

export interface ExecutionDashboardWidgetProps {
  status: OrchestrationStatus;
  slotOutputs: Map<SlotIndex, AgentOutputLine[]>;
}

export const ExecutionDashboardWidget = ({
  status,
  slotOutputs,
}: ExecutionDashboardWidgetProps): React.JSX.Element => {
  const { progressPercentageBase } = pipelinePhasesStatics;
  const progressPercent =
    status.total > 0 ? (status.completed / status.total) * progressPercentageBase : 0;

  return (
    <Stack gap="md" data-testid="EXECUTION_DASHBOARD">
      <PhaseIndicatorWidget currentPhase={status.phase} />

      <Stack gap="xs" data-testid="EXECUTION_PROGRESS">
        <Progress value={progressPercent} data-testid="EXECUTION_PROGRESS_BAR" />
        <Text size="sm" c="dimmed" data-testid="EXECUTION_PROGRESS_TEXT">
          {String(status.completed)} / {String(status.total)} steps completed
        </Text>
        {status.currentStep !== undefined && (
          <Text size="sm" data-testid="EXECUTION_CURRENT_STEP">
            Current: {status.currentStep}
          </Text>
        )}
      </Stack>

      <SlotGridWidget slots={status.slots} />

      {status.slots
        .filter((slot) => slotOutputs.has(slotIndexContract.parse(slot.slotId)))
        .map((slot) => {
          const index = slotIndexContract.parse(slot.slotId);

          return (
            <AgentOutputPanelWidget
              key={slot.slotId}
              slotIndex={index}
              lines={slotOutputs.get(index) ?? []}
            />
          );
        })}
    </Stack>
  );
};
