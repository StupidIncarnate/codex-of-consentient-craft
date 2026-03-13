import { screen } from '@testing-library/react';

import { DependencyStepStub, QuestStub } from '@dungeonmaster/shared/contracts';

import { AssistantTextChatEntryStub } from '../../contracts/chat-entry/chat-entry.stub';
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

      // pathseeker done row + 2 step rows = 3
      expect(stepRows).toHaveLength(3);
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

  describe('action bar', () => {
    it('VALID: {blocked quest with onStatusChange} => shows RESUME QUEST and ABANDON QUEST buttons', () => {
      const proxy = ExecutionPanelWidgetProxy();
      const quest: Quest = QuestStub({ status: 'blocked' });
      const onStatusChange = jest.fn();

      mantineRenderAdapter({
        ui: <ExecutionPanelWidget quest={quest} onStatusChange={onStatusChange} />,
      });

      expect(proxy.hasActionBar()).toBe(true);

      const labels = proxy.getActionButtons().map((btn) => btn.textContent);

      expect(labels).toStrictEqual(['RESUME QUEST', 'ABANDON QUEST']);
    });

    it('VALID: {in_progress quest with onStatusChange} => shows ABANDON QUEST button only', () => {
      const proxy = ExecutionPanelWidgetProxy();
      const quest: Quest = QuestStub({ status: 'in_progress' });
      const onStatusChange = jest.fn();

      mantineRenderAdapter({
        ui: <ExecutionPanelWidget quest={quest} onStatusChange={onStatusChange} />,
      });

      expect(proxy.hasActionBar()).toBe(true);

      const labels = proxy.getActionButtons().map((btn) => btn.textContent);

      expect(labels).toStrictEqual(['ABANDON QUEST']);
    });

    it('VALID: {complete quest} => does not show action bar', () => {
      const proxy = ExecutionPanelWidgetProxy();
      const quest: Quest = QuestStub({ status: 'complete' });

      mantineRenderAdapter({
        ui: <ExecutionPanelWidget quest={quest} onStatusChange={jest.fn()} />,
      });

      expect(proxy.hasActionBar()).toBe(false);
    });

    it('VALID: {no onStatusChange prop} => does not show action bar', () => {
      const proxy = ExecutionPanelWidgetProxy();
      const quest: Quest = QuestStub({ status: 'blocked' });

      mantineRenderAdapter({
        ui: <ExecutionPanelWidget quest={quest} />,
      });

      expect(proxy.hasActionBar()).toBe(false);
    });

    it('VALID: {click RESUME QUEST} => calls onStatusChange with in_progress', async () => {
      const proxy = ExecutionPanelWidgetProxy();
      const quest: Quest = QuestStub({ status: 'blocked' });
      const onStatusChange = jest.fn();

      mantineRenderAdapter({
        ui: <ExecutionPanelWidget quest={quest} onStatusChange={onStatusChange} />,
      });

      await proxy.clickButtonByLabel({ label: 'RESUME QUEST' });

      expect(onStatusChange).toHaveBeenCalledWith({ status: 'in_progress' });
    });

    it('VALID: {click ABANDON QUEST} => shows confirmation buttons', async () => {
      const proxy = ExecutionPanelWidgetProxy();
      const quest: Quest = QuestStub({ status: 'in_progress' });
      const onStatusChange = jest.fn();

      mantineRenderAdapter({
        ui: <ExecutionPanelWidget quest={quest} onStatusChange={onStatusChange} />,
      });

      await proxy.clickButtonByLabel({ label: 'ABANDON QUEST' });

      const labels = proxy.getActionButtons().map((btn) => btn.textContent);

      expect(labels).toStrictEqual(['CONFIRM ABANDON', 'CANCEL']);
    });

    it('VALID: {click CONFIRM ABANDON} => calls onStatusChange with abandoned', async () => {
      const proxy = ExecutionPanelWidgetProxy();
      const quest: Quest = QuestStub({ status: 'in_progress' });
      const onStatusChange = jest.fn();

      mantineRenderAdapter({
        ui: <ExecutionPanelWidget quest={quest} onStatusChange={onStatusChange} />,
      });

      await proxy.clickButtonByLabel({ label: 'ABANDON QUEST' });
      await proxy.clickButtonByLabel({ label: 'CONFIRM ABANDON' });

      expect(onStatusChange).toHaveBeenCalledWith({ status: 'abandoned' });
    });

    it('VALID: {click CANCEL after ABANDON QUEST} => returns to normal buttons', async () => {
      const proxy = ExecutionPanelWidgetProxy();
      const quest: Quest = QuestStub({ status: 'blocked' });
      const onStatusChange = jest.fn();

      mantineRenderAdapter({
        ui: <ExecutionPanelWidget quest={quest} onStatusChange={onStatusChange} />,
      });

      await proxy.clickButtonByLabel({ label: 'ABANDON QUEST' });
      await proxy.clickButtonByLabel({ label: 'CANCEL' });

      const labels = proxy.getActionButtons().map((btn) => btn.textContent);

      expect(labels).toStrictEqual(['RESUME QUEST', 'ABANDON QUEST']);
      expect(onStatusChange).not.toHaveBeenCalled();
    });

    it('VALID: {blocked quest confirming abandon} => hides RESUME QUEST button', async () => {
      const proxy = ExecutionPanelWidgetProxy();
      const quest: Quest = QuestStub({ status: 'blocked' });
      const onStatusChange = jest.fn();

      mantineRenderAdapter({
        ui: <ExecutionPanelWidget quest={quest} onStatusChange={onStatusChange} />,
      });

      await proxy.clickButtonByLabel({ label: 'ABANDON QUEST' });

      const labels = proxy.getActionButtons().map((btn) => btn.textContent);

      expect(labels).toStrictEqual(['CONFIRM ABANDON', 'CANCEL']);
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

  describe('pathseeker planning row', () => {
    it('VALID: {quest with no steps and slotEntries} => renders planning row with streaming bar', () => {
      const proxy = ExecutionPanelWidgetProxy();
      const quest: Quest = QuestStub({ status: 'in_progress', steps: [] });
      const slotIndex = SlotIndexStub({ value: 0 });
      const entry = AssistantTextChatEntryStub({ content: 'Analyzing quest requirements...' });
      const slotEntries = new Map([[slotIndex, [entry]]]);

      mantineRenderAdapter({
        ui: <ExecutionPanelWidget quest={quest} slotEntries={slotEntries} />,
      });

      expect(proxy.hasPlanningText()).toBe(true);
      expect(proxy.hasStreamingBar()).toBe(true);

      const stepRows = proxy.getStepRows();

      expect(stepRows.length).toBeGreaterThanOrEqual(1);
    });

    it('VALID: {quest with no steps} => renders planning text', () => {
      const proxy = ExecutionPanelWidgetProxy();
      const quest: Quest = QuestStub({ status: 'in_progress', steps: [] });

      mantineRenderAdapter({
        ui: <ExecutionPanelWidget quest={quest} />,
      });

      expect(proxy.hasPlanningText()).toBe(true);
      expect(screen.getByTestId('execution-panel-planning-text').textContent).toBe(
        'Steps will appear once cartography is complete...',
      );
    });
  });

  describe('pathseeker done row', () => {
    it('VALID: {quest with steps} => renders pathseeker done row with step count', () => {
      const proxy = ExecutionPanelWidgetProxy();
      const quest: Quest = QuestStub({
        status: 'in_progress',
        steps: [
          DependencyStepStub({ id: 'step-1', name: 'Step A', status: 'complete' }),
          DependencyStepStub({ id: 'step-2', name: 'Step B', status: 'pending' }),
        ],
      });

      mantineRenderAdapter({
        ui: <ExecutionPanelWidget quest={quest} />,
      });

      const stepRows = proxy.getStepRows();

      // Should have pathseeker done row + 2 step rows = 3 total
      expect(stepRows).toHaveLength(3);
      // First row should be pathseeker done
      expect(stepRows[0]?.textContent).toMatch(/Planned 2 steps/u);
    });
  });
});
