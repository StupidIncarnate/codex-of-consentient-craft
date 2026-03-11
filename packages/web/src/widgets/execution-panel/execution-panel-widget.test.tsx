import { screen } from '@testing-library/react';

import { DependencyStepStub, QuestStub } from '@dungeonmaster/shared/contracts';

import { AgentOutputLineStub } from '../../contracts/agent-output-line/agent-output-line.stub';
import { SlotIndexStub } from '../../contracts/slot-index/slot-index.stub';
import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { ExecutionPanelWidget } from './execution-panel-widget';
import { ExecutionPanelWidgetProxy } from './execution-panel-widget.proxy';

type Quest = ReturnType<typeof QuestStub>;

describe('ExecutionPanelWidget', () => {
  describe('tab bar', () => {
    it('VALID: {quest} => renders tab bar with EXECUTION and QUEST SPEC tabs', () => {
      const proxy = ExecutionPanelWidgetProxy();
      const quest: Quest = QuestStub({ status: 'in_progress' });

      mantineRenderAdapter({
        ui: <ExecutionPanelWidget quest={quest} />,
      });

      expect(proxy.hasTabBar()).toBe(true);
      expect(screen.getByTestId('execution-panel-tab-execution').textContent).toBe('EXECUTION');
      expect(screen.getByTestId('execution-panel-tab-spec').textContent).toBe('QUEST SPEC');
    });

    it('VALID: {quest} => defaults to EXECUTION tab', () => {
      const proxy = ExecutionPanelWidgetProxy();
      const quest: Quest = QuestStub({ status: 'in_progress' });

      mantineRenderAdapter({
        ui: <ExecutionPanelWidget quest={quest} />,
      });

      expect(proxy.hasStatusBar()).toBe(true);
      expect(proxy.hasFloorContent()).toBe(true);
      expect(proxy.hasSpecPanel()).toBe(false);
    });

    it('VALID: {click QUEST SPEC tab} => shows spec panel in readOnly mode', async () => {
      const proxy = ExecutionPanelWidgetProxy();
      const quest: Quest = QuestStub({ status: 'in_progress' });

      mantineRenderAdapter({
        ui: <ExecutionPanelWidget quest={quest} />,
      });

      await proxy.clickTab({ tabId: 'spec' });

      expect(proxy.hasSpecPanel()).toBe(true);
      expect(proxy.hasStatusBar()).toBe(false);
      expect(screen.queryByTestId('ACTION_BAR')).toBeNull();
    });

    it('VALID: {click QUEST SPEC then EXECUTION} => returns to execution view', async () => {
      const proxy = ExecutionPanelWidgetProxy();
      const quest: Quest = QuestStub({ status: 'in_progress' });

      mantineRenderAdapter({
        ui: <ExecutionPanelWidget quest={quest} />,
      });

      await proxy.clickTab({ tabId: 'spec' });
      await proxy.clickTab({ tabId: 'execution' });

      expect(proxy.hasStatusBar()).toBe(true);
      expect(proxy.hasFloorContent()).toBe(true);
      expect(proxy.hasSpecPanel()).toBe(false);
    });
  });

  describe('execution tab content', () => {
    it('VALID: {quest with no steps} => renders PLANNING status and floor header', () => {
      const proxy = ExecutionPanelWidgetProxy();
      const quest: Quest = QuestStub({ status: 'in_progress', steps: [] });

      mantineRenderAdapter({
        ui: <ExecutionPanelWidget quest={quest} />,
      });

      expect(proxy.hasStatusBar()).toBe(true);
      expect(screen.getByTestId('execution-status-bar-layer-widget').textContent).toMatch(
        /PLANNING/u,
      );
    });

    it('VALID: {quest with steps} => renders step rows', () => {
      const proxy = ExecutionPanelWidgetProxy();
      const quest: Quest = QuestStub({
        status: 'in_progress',
        steps: [
          DependencyStepStub({
            id: 'step-1',
            name: 'Build auth module',
            status: 'in_progress',
            filesToCreate: ['src/auth.ts'],
            filesToModify: [],
          }),
          DependencyStepStub({
            id: 'step-2',
            name: 'Add user model',
            status: 'pending',
            filesToCreate: ['src/user.ts'],
            filesToModify: [],
          }),
        ],
      });

      mantineRenderAdapter({
        ui: <ExecutionPanelWidget quest={quest} />,
      });

      const stepRows = proxy.getStepRows();

      expect(stepRows).toHaveLength(2);
    });

    it('VALID: {quest with completed steps} => shows correct count in status bar', () => {
      ExecutionPanelWidgetProxy();
      const quest: Quest = QuestStub({
        status: 'in_progress',
        steps: [
          DependencyStepStub({ id: 'step-1', name: 'Step A', status: 'complete' }),
          DependencyStepStub({ id: 'step-2', name: 'Step B', status: 'in_progress' }),
          DependencyStepStub({ id: 'step-3', name: 'Step C', status: 'pending' }),
        ],
      });

      mantineRenderAdapter({
        ui: <ExecutionPanelWidget quest={quest} />,
      });

      expect(screen.getByTestId('execution-status-bar-layer-widget').textContent).toMatch(
        /1\/3 COMPLETE/u,
      );
    });
  });

  describe('data-testid', () => {
    it('VALID: {quest} => renders with execution-panel-widget testid', () => {
      ExecutionPanelWidgetProxy();
      const quest: Quest = QuestStub({ status: 'in_progress' });

      mantineRenderAdapter({
        ui: <ExecutionPanelWidget quest={quest} />,
      });

      expect(screen.getByTestId('execution-panel-widget')).toBeInTheDocument();
    });
  });

  describe('slotOutputs rendering', () => {
    it('VALID: {quest with slotOutputs} => renders agent output panels for each slot', () => {
      ExecutionPanelWidgetProxy();
      const quest: Quest = QuestStub({ status: 'in_progress', steps: [] });
      const slotIndex = SlotIndexStub({ value: 0 });
      const line = AgentOutputLineStub({ value: 'Building auth guard...' });
      const slotOutputs = new Map([[slotIndex, [line]]]);

      mantineRenderAdapter({
        ui: <ExecutionPanelWidget quest={quest} slotOutputs={slotOutputs} />,
      });

      expect(screen.getByTestId('AGENT_OUTPUT_PANEL_0')).toBeInTheDocument();
    });

    it('EMPTY: {quest with empty slotOutputs} => renders no agent output panels', () => {
      ExecutionPanelWidgetProxy();
      const quest: Quest = QuestStub({ status: 'in_progress', steps: [] });

      mantineRenderAdapter({
        ui: <ExecutionPanelWidget quest={quest} slotOutputs={new Map()} />,
      });

      expect(screen.queryByTestId('AGENT_OUTPUT_PANEL_0')).toBeNull();
    });
  });
});
