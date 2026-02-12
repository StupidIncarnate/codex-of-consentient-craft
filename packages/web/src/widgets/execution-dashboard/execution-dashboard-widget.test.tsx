import { screen } from '@testing-library/react';

import { OrchestrationSlotStub, OrchestrationStatusStub } from '@dungeonmaster/shared/contracts';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { AgentOutputLineStub } from '../../contracts/agent-output-line/agent-output-line.stub';
import { SlotIndexStub } from '../../contracts/slot-index/slot-index.stub';
import { ExecutionDashboardWidget } from './execution-dashboard-widget';
import { ExecutionDashboardWidgetProxy } from './execution-dashboard-widget.proxy';

describe('ExecutionDashboardWidget', () => {
  describe('dashboard layout', () => {
    it('VALID: {status with slots} => renders dashboard container', () => {
      ExecutionDashboardWidgetProxy();

      const status = OrchestrationStatusStub({
        phase: 'codeweaver',
        completed: 2 as never,
        total: 5 as never,
        slots: [OrchestrationSlotStub({ slotId: 0 as never, status: 'running' })],
      });

      mantineRenderAdapter({
        ui: <ExecutionDashboardWidget status={status} slotOutputs={new Map()} />,
      });

      expect(screen.getByTestId('EXECUTION_DASHBOARD')).toBeInTheDocument();
    });

    it('VALID: {status with phase} => renders phase indicator', () => {
      ExecutionDashboardWidgetProxy();

      const status = OrchestrationStatusStub({
        phase: 'codeweaver',
        completed: 2 as never,
        total: 5 as never,
      });

      mantineRenderAdapter({
        ui: <ExecutionDashboardWidget status={status} slotOutputs={new Map()} />,
      });

      expect(screen.getByTestId('PHASE_STEPPER')).toBeInTheDocument();
    });
  });

  describe('progress display', () => {
    it('VALID: {completed: 2, total: 5} => renders progress text', () => {
      ExecutionDashboardWidgetProxy();

      const status = OrchestrationStatusStub({
        phase: 'codeweaver',
        completed: 2 as never,
        total: 5 as never,
      });

      mantineRenderAdapter({
        ui: <ExecutionDashboardWidget status={status} slotOutputs={new Map()} />,
      });

      expect(screen.getByTestId('EXECUTION_PROGRESS_TEXT')).toHaveTextContent(
        '2 / 5 steps completed',
      );
    });

    it('VALID: {currentStep defined} => renders current step text', () => {
      ExecutionDashboardWidgetProxy();

      const status = OrchestrationStatusStub({
        phase: 'codeweaver',
        completed: 1 as never,
        total: 5 as never,
        currentStep: 'Create user model' as never,
      });

      mantineRenderAdapter({
        ui: <ExecutionDashboardWidget status={status} slotOutputs={new Map()} />,
      });

      expect(screen.getByTestId('EXECUTION_CURRENT_STEP')).toHaveTextContent(
        'Current: Create user model',
      );
    });

    it('VALID: {currentStep undefined} => does not render current step text', () => {
      ExecutionDashboardWidgetProxy();

      const status = OrchestrationStatusStub({
        phase: 'idle',
        completed: 0 as never,
        total: 5 as never,
      });

      mantineRenderAdapter({
        ui: <ExecutionDashboardWidget status={status} slotOutputs={new Map()} />,
      });

      expect(screen.queryByTestId('EXECUTION_CURRENT_STEP')).toBeNull();
    });
  });

  describe('slot grid', () => {
    it('VALID: {slots: [running]} => renders slot grid with slots', () => {
      ExecutionDashboardWidgetProxy();

      const status = OrchestrationStatusStub({
        phase: 'codeweaver',
        completed: 1 as never,
        total: 3 as never,
        slots: [OrchestrationSlotStub({ slotId: 0 as never, status: 'running' })],
      });

      mantineRenderAdapter({
        ui: <ExecutionDashboardWidget status={status} slotOutputs={new Map()} />,
      });

      expect(screen.getByTestId('SLOT_CARD_0')).toBeInTheDocument();
    });
  });

  describe('agent output panels', () => {
    it('VALID: {slotOutputs with lines} => renders agent output panel for slot', () => {
      ExecutionDashboardWidgetProxy();

      const slot = OrchestrationSlotStub({ slotId: 0 as never, status: 'running' });
      const status = OrchestrationStatusStub({
        phase: 'codeweaver',
        completed: 1 as never,
        total: 3 as never,
        slots: [slot],
      });
      const slotOutputs = new Map([
        [SlotIndexStub({ value: 0 }), [AgentOutputLineStub({ value: 'Building...' })]],
      ]);

      mantineRenderAdapter({
        ui: <ExecutionDashboardWidget status={status} slotOutputs={slotOutputs} />,
      });

      expect(screen.getByTestId('AGENT_OUTPUT_PANEL_0')).toBeInTheDocument();
    });
  });
});
