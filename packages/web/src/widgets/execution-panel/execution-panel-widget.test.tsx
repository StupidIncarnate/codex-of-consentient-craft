import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import {
  DependencyStepStub,
  QuestStub,
  QuestWorkItemIdStub,
  SessionIdStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';

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
            filesToCreate: ['src/auth.ts'],
            filesToModify: [],
          }),
          DependencyStepStub({
            id: 'step-2',
            name: 'Add user model',
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
          DependencyStepStub({ id: 'step-1', name: 'Step A' }),
          DependencyStepStub({ id: 'step-2', name: 'Step B' }),
          DependencyStepStub({ id: 'step-3', name: 'Step C' }),
        ],
        workItems: [
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000001',
            role: 'codeweaver',
            status: 'complete',
            relatedDataItems: ['steps/step-1'],
          }),
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000002',
            role: 'codeweaver',
            status: 'in_progress',
            relatedDataItems: ['steps/step-2'],
          }),
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000003',
            role: 'codeweaver',
            status: 'pending',
            relatedDataItems: ['steps/step-3'],
          }),
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
          DependencyStepStub({ id: 'step-1', name: 'Step A' }),
          DependencyStepStub({ id: 'step-2', name: 'Step B' }),
        ],
        workItems: [
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000001',
            role: 'codeweaver',
            status: 'complete',
            relatedDataItems: ['steps/step-1'],
          }),
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000002',
            role: 'codeweaver',
            status: 'pending',
            relatedDataItems: ['steps/step-2'],
          }),
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

  describe('[X8] ad-hoc step detection', () => {
    it('VALID: {work item has insertedBy} => renders step with AD-HOC indicator', () => {
      ExecutionPanelWidgetProxy();
      const insertedById = QuestWorkItemIdStub({
        value: 'b0000000-0000-0000-0000-000000000001',
      });
      const quest: Quest = QuestStub({
        status: 'in_progress',
        steps: [
          DependencyStepStub({
            id: 'step-adhoc',
            name: 'Fix lint errors',
            filesToCreate: [],
            filesToModify: ['src/broker.ts'],
          }),
        ],
        workItems: [
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000001',
            role: 'codeweaver',
            status: 'in_progress',
            relatedDataItems: ['steps/step-adhoc'],
            insertedBy: insertedById,
          }),
        ],
      });

      mantineRenderAdapter({
        ui: <ExecutionPanelWidget quest={quest} />,
      });

      expect(screen.getByTestId('execution-row-adhoc-tag')).toBeInTheDocument();
      expect(screen.getByTestId('execution-row-adhoc-tag').textContent).toBe('AD-HOC');
    });

    it('VALID: {work item has no insertedBy} => does not render AD-HOC indicator', () => {
      ExecutionPanelWidgetProxy();
      const quest: Quest = QuestStub({
        status: 'in_progress',
        steps: [
          DependencyStepStub({
            id: 'step-normal',
            name: 'Build auth module',
            filesToCreate: ['src/auth.ts'],
            filesToModify: [],
          }),
        ],
        workItems: [
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000002',
            role: 'codeweaver',
            status: 'in_progress',
            relatedDataItems: ['steps/step-normal'],
          }),
        ],
      });

      mantineRenderAdapter({
        ui: <ExecutionPanelWidget quest={quest} />,
      });

      expect(screen.queryByTestId('execution-row-adhoc-tag')).toBeNull();
    });
  });

  describe('terminal quest with work items only', () => {
    it('VALID: {complete quest with chaoswhisperer work item} => renders work item row, not planning', () => {
      const proxy = ExecutionPanelWidgetProxy();
      const quest: Quest = QuestStub({
        status: 'complete',
        steps: [],
        workItems: [
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000001',
            role: 'chaoswhisperer',
            status: 'complete',
          }),
        ],
      });

      mantineRenderAdapter({
        ui: <ExecutionPanelWidget quest={quest} />,
      });

      expect(proxy.hasPlanningText()).toBe(false);

      const stepRows = proxy.getStepRows();

      expect(stepRows).toHaveLength(1);
      expect(stepRows[0]?.textContent).toMatch(/CHAOSWHISPERER/u);
      expect(stepRows[0]?.textContent).toMatch(/DONE/u);
    });

    it('VALID: {complete quest with work items} => shows completion count in status bar', () => {
      ExecutionPanelWidgetProxy();
      const quest: Quest = QuestStub({
        status: 'complete',
        steps: [],
        workItems: [
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000001',
            role: 'chaoswhisperer',
            status: 'complete',
          }),
        ],
      });

      mantineRenderAdapter({
        ui: <ExecutionPanelWidget quest={quest} />,
      });

      expect(screen.getByTestId('execution-status-bar-layer-widget').textContent).toMatch(
        /1\/1 COMPLETE/u,
      );
    });

    it('VALID: {abandoned quest with work items} => renders work item rows, not planning', () => {
      const proxy = ExecutionPanelWidgetProxy();
      const quest: Quest = QuestStub({
        status: 'abandoned',
        steps: [],
        workItems: [
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000001',
            role: 'chaoswhisperer',
            status: 'complete',
          }),
        ],
      });

      mantineRenderAdapter({
        ui: <ExecutionPanelWidget quest={quest} />,
      });

      expect(proxy.hasPlanningText()).toBe(false);
      expect(proxy.getStepRows()).toHaveLength(1);
    });

    it('VALID: {complete quest with no work items and no steps} => renders no planning text and no step rows', () => {
      const proxy = ExecutionPanelWidgetProxy();
      const quest: Quest = QuestStub({
        status: 'complete',
        steps: [],
        workItems: [],
      });

      mantineRenderAdapter({
        ui: <ExecutionPanelWidget quest={quest} />,
      });

      expect(proxy.hasPlanningText()).toBe(false);
      expect(proxy.getStepRows()).toHaveLength(1);
      expect(proxy.getStepRows()[0]?.textContent).toMatch(/Planned 0 steps/u);
    });
  });

  describe('dynamic floor headers', () => {
    it('VALID: {complete quest with chaoswhisperer work item} => renders SANCTUM floor header', () => {
      const proxy = ExecutionPanelWidgetProxy();
      const quest: Quest = QuestStub({
        status: 'complete',
        steps: [],
        workItems: [
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000001',
            role: 'chaoswhisperer',
            status: 'complete',
          }),
        ],
      });

      mantineRenderAdapter({
        ui: <ExecutionPanelWidget quest={quest} />,
      });

      const floorHeaders = proxy.getFloorHeaders();

      expect(floorHeaders).toHaveLength(1);
      expect(floorHeaders[0]?.textContent).toMatch(/SANCTUM/u);
    });

    it('VALID: {complete quest with two different role work items} => renders two floor headers in config order', () => {
      const proxy = ExecutionPanelWidgetProxy();
      const quest: Quest = QuestStub({
        status: 'complete',
        steps: [],
        workItems: [
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000001',
            role: 'chaoswhisperer',
            status: 'complete',
          }),
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000002',
            role: 'pathseeker',
            status: 'complete',
          }),
        ],
      });

      mantineRenderAdapter({
        ui: <ExecutionPanelWidget quest={quest} />,
      });

      const floorHeaders = proxy.getFloorHeaders();

      expect(floorHeaders).toHaveLength(2);
      expect(floorHeaders[0]?.textContent).toMatch(/FLOOR 1: SANCTUM/u);
      expect(floorHeaders[1]?.textContent).toMatch(/FLOOR 2: CARTOGRAPHY/u);
    });

    it('VALID: {steps with ward and codeweaver roles} => renders only FORGE and GAUNTLET floors', () => {
      const proxy = ExecutionPanelWidgetProxy();
      const quest: Quest = QuestStub({
        status: 'in_progress',
        steps: [
          DependencyStepStub({ id: 'step-1', name: 'Build module' }),
          DependencyStepStub({ id: 'step-2', name: 'Run quality checks' }),
        ],
        workItems: [
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000001',
            role: 'codeweaver',
            status: 'complete',
            relatedDataItems: ['steps/step-1'],
          }),
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000002',
            role: 'ward',
            status: 'pending',
            relatedDataItems: ['steps/step-2'],
          }),
        ],
      });

      mantineRenderAdapter({
        ui: <ExecutionPanelWidget quest={quest} />,
      });

      const floorHeaders = proxy.getFloorHeaders();

      expect(floorHeaders).toHaveLength(2);
      expect(floorHeaders[0]?.textContent).toMatch(/FORGE/u);
      expect(floorHeaders[1]?.textContent).toMatch(/GAUNTLET/u);
    });

    it('VALID: {multiple pathseeker work items} => renders single CARTOGRAPHY floor with both rows', () => {
      const proxy = ExecutionPanelWidgetProxy();
      const quest: Quest = QuestStub({
        status: 'complete',
        steps: [],
        workItems: [
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000001',
            role: 'pathseeker',
            status: 'complete',
          }),
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000002',
            role: 'pathseeker',
            status: 'complete',
          }),
        ],
      });

      mantineRenderAdapter({
        ui: <ExecutionPanelWidget quest={quest} />,
      });

      const floorHeaders = proxy.getFloorHeaders();

      expect(floorHeaders).toHaveLength(1);
      expect(floorHeaders[0]?.textContent).toMatch(/CARTOGRAPHY/u);

      const stepRows = proxy.getStepRows();

      expect(stepRows).toHaveLength(2);
    });

    it('VALID: {multiple ward work items} => renders single GAUNTLET floor with both rows', () => {
      const proxy = ExecutionPanelWidgetProxy();
      const quest: Quest = QuestStub({
        status: 'complete',
        steps: [],
        workItems: [
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000001',
            role: 'ward',
            status: 'complete',
          }),
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000002',
            role: 'ward',
            status: 'complete',
          }),
        ],
      });

      mantineRenderAdapter({
        ui: <ExecutionPanelWidget quest={quest} />,
      });

      const floorHeaders = proxy.getFloorHeaders();

      expect(floorHeaders).toHaveLength(1);
      expect(floorHeaders[0]?.textContent).toMatch(/GAUNTLET/u);

      const stepRows = proxy.getStepRows();

      expect(stepRows).toHaveLength(2);
    });

    it('VALID: {pathseeker and ward work items mixed} => renders CARTOGRAPHY then GAUNTLET floors', () => {
      const proxy = ExecutionPanelWidgetProxy();
      const quest: Quest = QuestStub({
        status: 'complete',
        steps: [],
        workItems: [
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000001',
            role: 'pathseeker',
            status: 'complete',
          }),
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000002',
            role: 'ward',
            status: 'complete',
          }),
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000003',
            role: 'pathseeker',
            status: 'complete',
          }),
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000004',
            role: 'ward',
            status: 'complete',
          }),
        ],
      });

      mantineRenderAdapter({
        ui: <ExecutionPanelWidget quest={quest} />,
      });

      const floorHeaders = proxy.getFloorHeaders();

      expect(floorHeaders).toHaveLength(2);
      expect(floorHeaders[0]?.textContent).toMatch(/FLOOR 1: CARTOGRAPHY/u);
      expect(floorHeaders[1]?.textContent).toMatch(/FLOOR 2: GAUNTLET/u);

      const stepRows = proxy.getStepRows();

      expect(stepRows).toHaveLength(4);
    });

    it('VALID: {complete quest with no work items} => renders no floor headers', () => {
      const proxy = ExecutionPanelWidgetProxy();
      const quest: Quest = QuestStub({
        status: 'complete',
        steps: [],
        workItems: [],
      });

      mantineRenderAdapter({
        ui: <ExecutionPanelWidget quest={quest} />,
      });

      expect(proxy.getFloorHeaders()).toHaveLength(0);
    });
  });

  describe('session entries for work items', () => {
    it('VALID: {work item with sessionId and matching sessionEntries} => passes entries to row', async () => {
      const proxy = ExecutionPanelWidgetProxy();
      const sessionId = SessionIdStub({ value: '91c4944d-55e3-4231-bd48-140245f11867' });
      const entry = AssistantTextChatEntryStub({ content: 'Exploring codebase...' });
      const sessionEntries = new Map([[sessionId, [entry]]]);
      const quest: Quest = QuestStub({
        status: 'complete',
        steps: [],
        workItems: [
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000001',
            role: 'chaoswhisperer',
            status: 'complete',
            sessionId,
          }),
        ],
      });

      mantineRenderAdapter({
        ui: <ExecutionPanelWidget quest={quest} sessionEntries={sessionEntries} />,
      });

      await userEvent.click(screen.getByTestId('execution-row-header'));

      const messages = proxy.getExecutionMessages();

      expect(messages).toHaveLength(1);
      expect(messages[0]?.textContent).toMatch(/Exploring codebase/u);
    });

    it('VALID: {work item without sessionId} => renders row with no entries', () => {
      const proxy = ExecutionPanelWidgetProxy();
      const quest: Quest = QuestStub({
        status: 'complete',
        steps: [],
        workItems: [
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000001',
            role: 'chaoswhisperer',
            status: 'complete',
          }),
        ],
      });

      mantineRenderAdapter({
        ui: <ExecutionPanelWidget quest={quest} />,
      });

      expect(proxy.getExecutionMessages()).toHaveLength(0);
    });
  });
});
