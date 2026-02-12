/**
 * PURPOSE: Displays pipeline phase progression as a Mantine Stepper component
 *
 * USAGE:
 * <PhaseIndicatorWidget currentPhase="codeweaver" />
 * // Renders a stepper with all phases, highlighting codeweaver as active
 */

import { Stepper } from '@mantine/core';

import type { OrchestrationStatus } from '@dungeonmaster/shared/contracts';

import { pipelinePhasesStatics } from '../../statics/pipeline-phases/pipeline-phases-statics';

export interface PhaseIndicatorWidgetProps {
  currentPhase: OrchestrationStatus['phase'];
}

export const PhaseIndicatorWidget = ({
  currentPhase,
}: PhaseIndicatorWidgetProps): React.JSX.Element => {
  const { phases } = pipelinePhasesStatics;
  const activeIndex = phases.findIndex((phase) => phase.key === currentPhase);

  return (
    <Stepper active={activeIndex === -1 ? 0 : activeIndex} data-testid="PHASE_STEPPER">
      {phases.map((phase) => (
        <Stepper.Step key={phase.key} label={phase.label} data-testid={`PHASE_STEP_${phase.key}`} />
      ))}
    </Stepper>
  );
};
