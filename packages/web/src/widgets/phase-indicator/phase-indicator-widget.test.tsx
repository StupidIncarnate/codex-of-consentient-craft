import { screen } from '@testing-library/react';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { PhaseIndicatorWidget } from './phase-indicator-widget';
import { PhaseIndicatorWidgetProxy } from './phase-indicator-widget.proxy';

describe('PhaseIndicatorWidget', () => {
  describe('phase rendering', () => {
    it('VALID: {currentPhase: "pathseeker"} => renders first three phase steps', () => {
      PhaseIndicatorWidgetProxy();

      mantineRenderAdapter({ ui: <PhaseIndicatorWidget currentPhase="pathseeker" /> });

      expect(screen.getByTestId('PHASE_STEP_pathseeker')).toBeInTheDocument();
      expect(screen.getByTestId('PHASE_STEP_codeweaver')).toBeInTheDocument();
      expect(screen.getByTestId('PHASE_STEP_ward')).toBeInTheDocument();
    });

    it('VALID: {currentPhase: "pathseeker"} => renders last three phase steps', () => {
      PhaseIndicatorWidgetProxy();

      mantineRenderAdapter({ ui: <PhaseIndicatorWidget currentPhase="pathseeker" /> });

      expect(screen.getByTestId('PHASE_STEP_siegemaster')).toBeInTheDocument();
      expect(screen.getByTestId('PHASE_STEP_lawbringer')).toBeInTheDocument();
      expect(screen.getByTestId('PHASE_STEP_complete')).toBeInTheDocument();
    });

    it('VALID: {currentPhase: "codeweaver"} => renders stepper with codeweaver active', () => {
      PhaseIndicatorWidgetProxy();

      mantineRenderAdapter({ ui: <PhaseIndicatorWidget currentPhase="codeweaver" /> });

      expect(screen.getByTestId('PHASE_STEPPER')).toBeInTheDocument();
    });

    it('VALID: {currentPhase: "complete"} => renders stepper with last phase active', () => {
      PhaseIndicatorWidgetProxy();

      mantineRenderAdapter({ ui: <PhaseIndicatorWidget currentPhase="complete" /> });

      expect(screen.getByTestId('PHASE_STEPPER')).toBeInTheDocument();
    });

    it('EDGE: {currentPhase: "idle"} => defaults to first phase when phase not found in stepper', () => {
      PhaseIndicatorWidgetProxy();

      mantineRenderAdapter({ ui: <PhaseIndicatorWidget currentPhase="idle" /> });

      expect(screen.getByTestId('PHASE_STEPPER')).toBeInTheDocument();
    });
  });
});
