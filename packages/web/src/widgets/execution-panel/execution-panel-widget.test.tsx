import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import {
  DependencyStepStub,
  QuestStub,
  QuestWorkItemIdStub,
  SessionIdStub,
  WardResultStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';

import { AssistantTextChatEntryStub } from '@dungeonmaster/shared/contracts';
import { questStatusMetadataStatics } from '@dungeonmaster/shared/statics';
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
      expect(screen.queryByTestId('ACTION_BAR')).toBe(null);
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
      expect(screen.getByTestId('execution-status-bar-layer-widget').textContent).toBe(
        'EXECUTIONPLANNING',
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
            focusFile: { path: 'src/auth.ts', action: 'create' },
          }),
          DependencyStepStub({
            id: 'step-2',
            name: 'Add user model',
            focusFile: { path: 'src/user.ts', action: 'create' },
          }),
        ],
        workItems: [
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000010',
            role: 'pathseeker',
            status: 'complete',
          }),
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000011',
            role: 'codeweaver',
            status: 'pending',
            relatedDataItems: ['steps/step-1'],
          }),
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000012',
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

      // pathseeker done row + 2 step rows = 3
      expect(stepRows.map((r) => r.getAttribute('data-testid'))).toStrictEqual([
        'execution-row-layer-widget',
        'execution-row-layer-widget',
        'execution-row-layer-widget',
      ]);
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

      expect(screen.getByTestId('execution-status-bar-layer-widget').textContent).toBe(
        'EXECUTION1/3 COMPLETE',
      );
    });
  });

  describe('action bar', () => {
    it('VALID: {blocked quest with onStatusChange} => shows RESUME QUEST in action bar', () => {
      const proxy = ExecutionPanelWidgetProxy();
      const quest: Quest = QuestStub({ status: 'blocked' });
      const onStatusChange = jest.fn();

      mantineRenderAdapter({
        ui: <ExecutionPanelWidget quest={quest} onStatusChange={onStatusChange} />,
      });

      expect(proxy.hasActionBar()).toBe(true);

      const labels = proxy.getActionButtons().map((btn) => btn.textContent);

      expect(labels).toStrictEqual(['RESUME QUEST']);
    });

    it('VALID: {paused quest with onStatusChange} => shows RESUME QUEST in action bar', () => {
      const proxy = ExecutionPanelWidgetProxy();
      const quest: Quest = QuestStub({ status: 'paused' });
      const onStatusChange = jest.fn();

      mantineRenderAdapter({
        ui: <ExecutionPanelWidget quest={quest} onStatusChange={onStatusChange} />,
      });

      expect(proxy.hasActionBar()).toBe(true);

      const labels = proxy.getActionButtons().map((btn) => btn.textContent);

      expect(labels).toStrictEqual(['RESUME QUEST']);
    });

    it('VALID: {in_progress quest with onPause} => shows PAUSE QUEST in action bar', () => {
      const proxy = ExecutionPanelWidgetProxy();
      const quest: Quest = QuestStub({ status: 'in_progress' });
      const onPause = jest.fn();

      mantineRenderAdapter({
        ui: <ExecutionPanelWidget quest={quest} onPause={onPause} />,
      });

      expect(proxy.hasActionBar()).toBe(true);

      const labels = proxy.getActionButtons().map((btn) => btn.textContent);

      expect(labels).toStrictEqual(['PAUSE QUEST']);
    });

    it('VALID: {in_progress quest with onAbandon only} => does not show action bar', () => {
      const proxy = ExecutionPanelWidgetProxy();
      const quest: Quest = QuestStub({ status: 'in_progress' });
      const onAbandon = jest.fn();

      mantineRenderAdapter({
        ui: <ExecutionPanelWidget quest={quest} onAbandon={onAbandon} />,
      });

      expect(proxy.hasActionBar()).toBe(false);
    });

    it('VALID: {click PAUSE QUEST} => calls onPause', async () => {
      const proxy = ExecutionPanelWidgetProxy();
      const quest: Quest = QuestStub({ status: 'in_progress' });
      const onStatusChange = jest.fn();
      const onPause = jest.fn();

      mantineRenderAdapter({
        ui: (
          <ExecutionPanelWidget quest={quest} onStatusChange={onStatusChange} onPause={onPause} />
        ),
      });

      await proxy.clickButtonByLabel({ label: 'PAUSE QUEST' });

      expect(onPause).toHaveBeenCalledTimes(1);
      expect(onStatusChange.mock.calls).toStrictEqual([]);
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
      const quest: Quest = QuestStub({ status: 'paused' });

      mantineRenderAdapter({
        ui: <ExecutionPanelWidget quest={quest} />,
      });

      expect(proxy.hasActionBar()).toBe(false);
    });

    it('VALID: {click RESUME QUEST} => calls onStatusChange with in_progress', async () => {
      const proxy = ExecutionPanelWidgetProxy();
      const quest: Quest = QuestStub({ status: 'paused' });
      const onStatusChange = jest.fn();

      mantineRenderAdapter({
        ui: <ExecutionPanelWidget quest={quest} onStatusChange={onStatusChange} />,
      });

      await proxy.clickButtonByLabel({ label: 'RESUME QUEST' });

      expect(onStatusChange).toHaveBeenCalledWith({ status: 'in_progress' });
    });
  });

  describe('abandon button in title bar', () => {
    it('VALID: {onAbandon provided} => renders ABANDON QUEST button in title bar', () => {
      const proxy = ExecutionPanelWidgetProxy();
      const quest: Quest = QuestStub({ status: 'in_progress' });
      const onAbandon = jest.fn();

      mantineRenderAdapter({
        ui: <ExecutionPanelWidget quest={quest} onAbandon={onAbandon} />,
      });

      expect(proxy.hasAbandonButton()).toBe(true);
    });

    it('VALID: {no onAbandon} => does not render ABANDON QUEST button', () => {
      const proxy = ExecutionPanelWidgetProxy();
      const quest: Quest = QuestStub({ status: 'in_progress' });

      mantineRenderAdapter({
        ui: <ExecutionPanelWidget quest={quest} />,
      });

      expect(proxy.hasAbandonButton()).toBe(false);
    });

    it('VALID: {click ABANDON QUEST} => shows CONFIRM ABANDON and CANCEL buttons', async () => {
      const proxy = ExecutionPanelWidgetProxy();
      const quest: Quest = QuestStub({ status: 'in_progress' });
      const onAbandon = jest.fn();

      mantineRenderAdapter({
        ui: <ExecutionPanelWidget quest={quest} onAbandon={onAbandon} />,
      });

      await proxy.clickAbandon();

      const labels = proxy.getAbandonButtons().map((btn) => btn.textContent);

      expect(labels).toStrictEqual(['CONFIRM ABANDON', 'CANCEL']);
    });

    it('VALID: {click CONFIRM ABANDON} => calls onAbandon', async () => {
      const proxy = ExecutionPanelWidgetProxy();
      const quest: Quest = QuestStub({ status: 'in_progress' });
      const onAbandon = jest.fn();

      mantineRenderAdapter({
        ui: <ExecutionPanelWidget quest={quest} onAbandon={onAbandon} />,
      });

      await proxy.clickAbandon();
      await proxy.clickConfirmAbandon();

      expect(onAbandon).toHaveBeenCalledTimes(1);
    });

    it('VALID: {click CANCEL after ABANDON QUEST} => returns to ABANDON QUEST button', async () => {
      const proxy = ExecutionPanelWidgetProxy();
      const quest: Quest = QuestStub({ status: 'paused' });
      const onStatusChange = jest.fn();
      const onAbandon = jest.fn();

      mantineRenderAdapter({
        ui: (
          <ExecutionPanelWidget
            quest={quest}
            onStatusChange={onStatusChange}
            onAbandon={onAbandon}
          />
        ),
      });

      await proxy.clickAbandon();
      await proxy.clickCancelAbandon();

      const labels = proxy.getAbandonButtons().map((btn) => btn.textContent);

      expect(labels).toStrictEqual(['ABANDON QUEST']);
      expect(onAbandon.mock.calls).toStrictEqual([]);
    });

    it('VALID: {paused quest confirming abandon} => action bar still shows RESUME QUEST', async () => {
      const proxy = ExecutionPanelWidgetProxy();
      const quest: Quest = QuestStub({ status: 'paused' });
      const onStatusChange = jest.fn();
      const onAbandon = jest.fn();

      mantineRenderAdapter({
        ui: (
          <ExecutionPanelWidget
            quest={quest}
            onStatusChange={onStatusChange}
            onAbandon={onAbandon}
          />
        ),
      });

      await proxy.clickAbandon();

      const actionLabels = proxy.getActionButtons().map((btn) => btn.textContent);

      expect(actionLabels).toStrictEqual(['RESUME QUEST']);
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
    it('VALID: {quest with no steps and pathseeker sessionEntries} => synthetic planning row sources from pathseeker workItem session', () => {
      const proxy = ExecutionPanelWidgetProxy();
      const sessionId = SessionIdStub({ value: 'session-pathseeker-1' });
      const entry = AssistantTextChatEntryStub({ content: 'Analyzing quest requirements...' });
      const sessionEntries = new Map([[sessionId, [entry]]]);
      const quest: Quest = QuestStub({
        status: 'in_progress',
        steps: [],
        workItems: [
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000099',
            role: 'pathseeker',
            status: 'in_progress',
            sessionId,
          }),
        ],
      });

      mantineRenderAdapter({
        ui: <ExecutionPanelWidget quest={quest} sessionEntries={sessionEntries} />,
      });

      expect(proxy.hasPlanningText()).toBe(true);
      expect(proxy.hasStreamingBar()).toBe(true);

      const stepRows = proxy.getStepRows();

      expect(stepRows.length).toBeGreaterThanOrEqual(1);

      // The synthetic planning row's expanded body should surface the pathseeker
      // workItem's session entries (live or replayed — both arrive on the same key).
      const messages = proxy.getExecutionMessages();

      expect(messages.length).toBeGreaterThanOrEqual(1);
      expect(messages.some((m) => m.textContent?.includes('Analyzing quest requirements'))).toBe(
        true,
      );
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
            id: 'a0000000-0000-0000-0000-000000000099',
            role: 'pathseeker',
            status: 'complete',
          }),
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
      expect(stepRows.map((r) => r.getAttribute('data-testid'))).toStrictEqual([
        'execution-row-layer-widget',
        'execution-row-layer-widget',
        'execution-row-layer-widget',
      ]);

      // First row should be pathseeker (no #1 since it's the only item in its group)
      const firstRowText = stepRows[0]?.textContent;

      expect(firstRowText).toMatch(/^\u25B801\[PATHSEEKER\]Pathseeker(?! #)DONE$/u);
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
            focusFile: { path: 'src/broker.ts', action: 'modify' },
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
            focusFile: { path: 'src/auth.ts', action: 'create' },
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

      expect(screen.queryByTestId('execution-row-adhoc-tag')).toBe(null);
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

      expect(stepRows.map((r) => r.getAttribute('data-testid'))).toStrictEqual([
        'execution-row-layer-widget',
      ]);

      const firstRowText = stepRows[0]?.textContent;

      expect(firstRowText).toBe('\u25B801[CHAOSWHISPERER]ChaoswhispererDONE');
    });

    it('VALID: {complete quest with work items} => shows terminal banner instead of status bar', () => {
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

      expect(screen.queryByTestId('execution-status-bar-layer-widget')).toBe(null);
      expect(screen.getByTestId('execution-panel-terminal-banner').textContent).toBe(
        questStatusMetadataStatics.statuses.complete.displayHeader,
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
      expect(proxy.getStepRows().map((r) => r.getAttribute('data-testid'))).toStrictEqual([
        'execution-row-layer-widget',
      ]);
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
      expect(proxy.getStepRows()).toStrictEqual([]);
    });
  });

  describe('dynamic floor headers', () => {
    it('VALID: {complete quest with chaoswhisperer work item} => renders HOMEBASE floor header', () => {
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

      expect(floorHeaders.map((h) => h.getAttribute('data-testid'))).toStrictEqual([
        'floor-header-layer-widget',
      ]);
      expect(floorHeaders[0]?.textContent).toMatch(/^──HOMEBASE──+$/u);
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

      expect(floorHeaders.map((h) => h.getAttribute('data-testid'))).toStrictEqual([
        'floor-header-layer-widget',
        'floor-header-layer-widget',
      ]);
      expect(floorHeaders[0]?.textContent).toMatch(/^──HOMEBASE──+$/u);
      expect(floorHeaders[1]?.textContent).toMatch(/^──ENTRANCE: CARTOGRAPHY──+$/u);
    });

    it('VALID: {steps with ward and codeweaver roles} => renders FORGE and MINI BOSS floors', () => {
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
            dependsOn: [],
            createdAt: '2024-01-15T10:00:00.000Z',
          }),
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000002',
            role: 'ward',
            status: 'pending',
            relatedDataItems: ['steps/step-2'],
            dependsOn: ['a0000000-0000-0000-0000-000000000001'],
            createdAt: '2024-01-15T10:01:00.000Z',
          }),
        ],
      });

      mantineRenderAdapter({
        ui: <ExecutionPanelWidget quest={quest} />,
      });

      const floorHeaders = proxy.getFloorHeaders();

      expect(floorHeaders.map((h) => h.getAttribute('data-testid'))).toStrictEqual([
        'floor-header-layer-widget',
        'floor-header-layer-widget',
      ]);
      expect(floorHeaders[0]?.textContent).toMatch(/^──FLOOR \d+: FORGE──+$/u);
      expect(floorHeaders[1]?.textContent).toMatch(/^──FLOOR \d+: MINI BOSS──+$/u);
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

      expect(floorHeaders.map((h) => h.getAttribute('data-testid'))).toStrictEqual([
        'floor-header-layer-widget',
      ]);
      expect(floorHeaders[0]?.textContent).toMatch(/^──ENTRANCE: CARTOGRAPHY──+$/u);

      const stepRows = proxy.getStepRows();

      expect(stepRows.map((r) => r.getAttribute('data-testid'))).toStrictEqual([
        'execution-row-layer-widget',
        'execution-row-layer-widget',
      ]);
    });

    it('VALID: {multiple ward work items} => renders single MINI BOSS floor with both rows', () => {
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

      expect(floorHeaders.map((h) => h.getAttribute('data-testid'))).toStrictEqual([
        'floor-header-layer-widget',
      ]);
      expect(floorHeaders[0]?.textContent).toMatch(/^──FLOOR \d+: MINI BOSS──+$/u);

      const stepRows = proxy.getStepRows();

      expect(stepRows.map((r) => r.getAttribute('data-testid'))).toStrictEqual([
        'execution-row-layer-widget',
        'execution-row-layer-widget',
      ]);
    });

    it('VALID: {pathseeker and ward work items mixed} => renders ENTRANCE: CARTOGRAPHY then MINI BOSS floors', () => {
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

      expect(floorHeaders.map((h) => h.getAttribute('data-testid'))).toStrictEqual([
        'floor-header-layer-widget',
        'floor-header-layer-widget',
      ]);
      expect(floorHeaders[0]?.textContent).toMatch(/^──ENTRANCE: CARTOGRAPHY──+$/u);
      expect(floorHeaders[1]?.textContent).toMatch(/^──FLOOR \d+: MINI BOSS──+$/u);

      const stepRows = proxy.getStepRows();

      expect(stepRows.map((r) => r.getAttribute('data-testid'))).toStrictEqual([
        'execution-row-layer-widget',
        'execution-row-layer-widget',
        'execution-row-layer-widget',
        'execution-row-layer-widget',
      ]);
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

      expect(proxy.getFloorHeaders()).toStrictEqual([]);
    });
  });

  describe('floor ordering with mixed step and non-step work items', () => {
    const getFloorNames = () =>
      screen.queryAllByTestId('floor-header-layer-widget').map((h) =>
        (h.textContent ?? '')
          .replace(/──+/gu, '')
          .replace(/Concurrent.*$/u, '')
          .trim(),
      );

    it('VALID: {happy path chain with steps} => floors in topological order', () => {
      ExecutionPanelWidgetProxy();
      const quest: Quest = QuestStub({
        status: 'in_progress',
        steps: [DependencyStepStub({ id: 'step-1', name: 'Implement feature' })],
        workItems: [
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000001',
            role: 'chaoswhisperer',
            status: 'complete',
            dependsOn: [],
            createdAt: '2024-01-15T10:00:00.000Z',
          }),
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000002',
            role: 'pathseeker',
            status: 'complete',
            dependsOn: ['a0000000-0000-0000-0000-000000000001'],
            createdAt: '2024-01-15T10:01:00.000Z',
          }),
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000003',
            role: 'codeweaver',
            status: 'complete',
            relatedDataItems: ['steps/step-1'],
            dependsOn: ['a0000000-0000-0000-0000-000000000002'],
            createdAt: '2024-01-15T10:02:00.000Z',
          }),
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000004',
            role: 'ward',
            status: 'in_progress',
            dependsOn: ['a0000000-0000-0000-0000-000000000003'],
            createdAt: '2024-01-15T10:03:00.000Z',
          }),
        ],
      });

      mantineRenderAdapter({ ui: <ExecutionPanelWidget quest={quest} /> });

      expect(getFloorNames()).toStrictEqual([
        'HOMEBASE',
        'ENTRANCE: CARTOGRAPHY',
        'FLOOR 1: FORGE',
        'FLOOR 2: MINI BOSS',
      ]);
    });

    it('VALID: {ward fail → spiritmender → ward retry} => FORGE before MINI BOSS, INFIRMARY between bosses', () => {
      ExecutionPanelWidgetProxy();
      const quest: Quest = QuestStub({
        status: 'in_progress',
        steps: [DependencyStepStub({ id: 'step-1', name: 'Implement feature' })],
        workItems: [
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000010',
            role: 'pathseeker',
            status: 'complete',
            dependsOn: [],
            createdAt: '2024-01-15T10:00:00.000Z',
          }),
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000011',
            role: 'codeweaver',
            status: 'complete',
            relatedDataItems: ['steps/step-1'],
            dependsOn: ['a0000000-0000-0000-0000-000000000010'],
            createdAt: '2024-01-15T10:01:00.000Z',
          }),
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000012',
            role: 'ward',
            status: 'failed',
            dependsOn: ['a0000000-0000-0000-0000-000000000011'],
            createdAt: '2024-01-15T10:02:00.000Z',
          }),
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000013',
            role: 'spiritmender',
            status: 'complete',
            dependsOn: ['a0000000-0000-0000-0000-000000000012'],
            insertedBy: 'a0000000-0000-0000-0000-000000000012' as ReturnType<
              typeof QuestWorkItemIdStub
            >,
            createdAt: '2024-01-15T10:03:00.000Z',
          }),
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000014',
            role: 'ward',
            status: 'in_progress',
            dependsOn: ['a0000000-0000-0000-0000-000000000013'],
            insertedBy: 'a0000000-0000-0000-0000-000000000012' as ReturnType<
              typeof QuestWorkItemIdStub
            >,
            createdAt: '2024-01-15T10:04:00.000Z',
          }),
        ],
      });

      mantineRenderAdapter({ ui: <ExecutionPanelWidget quest={quest} /> });

      expect(getFloorNames()).toStrictEqual([
        'ENTRANCE: CARTOGRAPHY',
        'FLOOR 1: FORGE',
        'FLOOR 2: MINI BOSS',
        'FLOOR 3: INFIRMARY',
        'FLOOR 4: MINI BOSS',
      ]);
    });

    it('VALID: {ward exhausts retries → pathseeker replan} => CARTOGRAPHY reappears after MINI BOSS', () => {
      ExecutionPanelWidgetProxy();
      const quest: Quest = QuestStub({
        status: 'in_progress',
        steps: [DependencyStepStub({ id: 'step-1', name: 'Implement feature' })],
        workItems: [
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000030',
            role: 'pathseeker',
            status: 'complete',
            dependsOn: [],
            createdAt: '2024-01-15T10:00:00.000Z',
          }),
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000031',
            role: 'codeweaver',
            status: 'complete',
            relatedDataItems: ['steps/step-1'],
            dependsOn: ['a0000000-0000-0000-0000-000000000030'],
            createdAt: '2024-01-15T10:01:00.000Z',
          }),
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000032',
            role: 'ward',
            status: 'failed',
            dependsOn: ['a0000000-0000-0000-0000-000000000031'],
            createdAt: '2024-01-15T10:02:00.000Z',
            attempt: 2,
            maxAttempts: 3,
          }),
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000033',
            role: 'pathseeker',
            status: 'pending',
            dependsOn: ['a0000000-0000-0000-0000-000000000032'],
            insertedBy: 'a0000000-0000-0000-0000-000000000032' as ReturnType<
              typeof QuestWorkItemIdStub
            >,
            createdAt: '2024-01-15T10:03:00.000Z',
          }),
        ],
      });

      mantineRenderAdapter({ ui: <ExecutionPanelWidget quest={quest} /> });

      expect(getFloorNames()).toStrictEqual([
        'ENTRANCE: CARTOGRAPHY',
        'FLOOR 1: FORGE',
        'FLOOR 2: MINI BOSS',
        'ENTRANCE: CARTOGRAPHY',
      ]);
    });

    it('VALID: {siegemaster fail → pathseeker replan} => CARTOGRAPHY after ARENA, skipped excluded', () => {
      ExecutionPanelWidgetProxy();
      const quest: Quest = QuestStub({
        status: 'in_progress',
        steps: [DependencyStepStub({ id: 'step-1', name: 'Implement feature' })],
        workItems: [
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000040',
            role: 'codeweaver',
            status: 'complete',
            relatedDataItems: ['steps/step-1'],
            dependsOn: [],
            createdAt: '2024-01-15T10:00:00.000Z',
          }),
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000041',
            role: 'ward',
            status: 'complete',
            dependsOn: ['a0000000-0000-0000-0000-000000000040'],
            createdAt: '2024-01-15T10:01:00.000Z',
          }),
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000042',
            role: 'siegemaster',
            status: 'failed',
            dependsOn: ['a0000000-0000-0000-0000-000000000041'],
            createdAt: '2024-01-15T10:02:00.000Z',
          }),
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000043',
            role: 'lawbringer',
            status: 'skipped',
            dependsOn: ['a0000000-0000-0000-0000-000000000042'],
            createdAt: '2024-01-15T10:02:00.000Z',
          }),
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000044',
            role: 'ward',
            status: 'skipped',
            dependsOn: ['a0000000-0000-0000-0000-000000000043'],
            createdAt: '2024-01-15T10:02:00.000Z',
          }),
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000045',
            role: 'pathseeker',
            status: 'pending',
            dependsOn: ['a0000000-0000-0000-0000-000000000042'],
            insertedBy: 'a0000000-0000-0000-0000-000000000042' as ReturnType<
              typeof QuestWorkItemIdStub
            >,
            createdAt: '2024-01-15T10:03:00.000Z',
          }),
        ],
      });

      mantineRenderAdapter({ ui: <ExecutionPanelWidget quest={quest} /> });

      expect(getFloorNames()).toStrictEqual([
        'FLOOR 1: FORGE',
        'FLOOR 2: MINI BOSS',
        'FLOOR 3: ARENA',
        'ENTRANCE: CARTOGRAPHY',
      ]);
    });

    it('VALID: {lawbringer fail → spiritmender} => INFIRMARY after TRIBUNAL', () => {
      ExecutionPanelWidgetProxy();
      const quest: Quest = QuestStub({
        status: 'in_progress',
        steps: [DependencyStepStub({ id: 'step-1', name: 'Implement feature' })],
        workItems: [
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000050',
            role: 'codeweaver',
            status: 'complete',
            relatedDataItems: ['steps/step-1'],
            dependsOn: [],
            createdAt: '2024-01-15T10:00:00.000Z',
          }),
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000051',
            role: 'ward',
            status: 'complete',
            dependsOn: ['a0000000-0000-0000-0000-000000000050'],
            createdAt: '2024-01-15T10:01:00.000Z',
          }),
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000052',
            role: 'siegemaster',
            status: 'complete',
            dependsOn: ['a0000000-0000-0000-0000-000000000051'],
            createdAt: '2024-01-15T10:02:00.000Z',
          }),
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000053',
            role: 'lawbringer',
            status: 'failed',
            relatedDataItems: ['steps/step-1'],
            dependsOn: ['a0000000-0000-0000-0000-000000000052'],
            createdAt: '2024-01-15T10:03:00.000Z',
          }),
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000054',
            role: 'spiritmender',
            status: 'pending',
            dependsOn: ['a0000000-0000-0000-0000-000000000053'],
            insertedBy: 'a0000000-0000-0000-0000-000000000053' as ReturnType<
              typeof QuestWorkItemIdStub
            >,
            createdAt: '2024-01-15T10:04:00.000Z',
          }),
        ],
      });

      mantineRenderAdapter({ ui: <ExecutionPanelWidget quest={quest} /> });

      expect(getFloorNames()).toStrictEqual([
        'FLOOR 1: FORGE',
        'FLOOR 2: MINI BOSS',
        'FLOOR 3: ARENA',
        'FLOOR 4: TRIBUNAL',
        'FLOOR 5: INFIRMARY',
      ]);
    });

    it('VALID: {spiritmender fail → pathseeker replan} => CARTOGRAPHY after INFIRMARY', () => {
      ExecutionPanelWidgetProxy();
      const quest: Quest = QuestStub({
        status: 'in_progress',
        steps: [DependencyStepStub({ id: 'step-1', name: 'Implement feature' })],
        workItems: [
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000060',
            role: 'codeweaver',
            status: 'complete',
            relatedDataItems: ['steps/step-1'],
            dependsOn: [],
            createdAt: '2024-01-15T10:00:00.000Z',
          }),
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000061',
            role: 'ward',
            status: 'failed',
            dependsOn: ['a0000000-0000-0000-0000-000000000060'],
            createdAt: '2024-01-15T10:01:00.000Z',
          }),
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000062',
            role: 'spiritmender',
            status: 'failed',
            dependsOn: ['a0000000-0000-0000-0000-000000000061'],
            insertedBy: 'a0000000-0000-0000-0000-000000000061' as ReturnType<
              typeof QuestWorkItemIdStub
            >,
            createdAt: '2024-01-15T10:02:00.000Z',
          }),
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000063',
            role: 'pathseeker',
            status: 'pending',
            dependsOn: ['a0000000-0000-0000-0000-000000000062'],
            insertedBy: 'a0000000-0000-0000-0000-000000000062' as ReturnType<
              typeof QuestWorkItemIdStub
            >,
            createdAt: '2024-01-15T10:03:00.000Z',
          }),
        ],
      });

      mantineRenderAdapter({ ui: <ExecutionPanelWidget quest={quest} /> });

      expect(getFloorNames()).toStrictEqual([
        'FLOOR 1: FORGE',
        'FLOOR 2: MINI BOSS',
        'FLOOR 3: INFIRMARY',
        'ENTRANCE: CARTOGRAPHY',
      ]);
    });

    it('VALID: {pathseeker retry after ward exhaustion} => two CARTOGRAPHY entrances at different depths', () => {
      ExecutionPanelWidgetProxy();
      const quest: Quest = QuestStub({
        status: 'in_progress',
        steps: [DependencyStepStub({ id: 'step-1', name: 'Build module' })],
        workItems: [
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000070',
            role: 'pathseeker',
            status: 'complete',
            dependsOn: [],
            createdAt: '2024-01-15T10:00:00.000Z',
          }),
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000071',
            role: 'codeweaver',
            status: 'complete',
            relatedDataItems: ['steps/step-1'],
            dependsOn: ['a0000000-0000-0000-0000-000000000070'],
            createdAt: '2024-01-15T10:01:00.000Z',
          }),
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000072',
            role: 'ward',
            status: 'failed',
            dependsOn: ['a0000000-0000-0000-0000-000000000071'],
            createdAt: '2024-01-15T10:02:00.000Z',
            attempt: 2,
            maxAttempts: 3,
          }),
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000073',
            role: 'pathseeker',
            status: 'failed',
            dependsOn: ['a0000000-0000-0000-0000-000000000072'],
            insertedBy: 'a0000000-0000-0000-0000-000000000072' as ReturnType<
              typeof QuestWorkItemIdStub
            >,
            createdAt: '2024-01-15T10:03:00.000Z',
            attempt: 0,
            maxAttempts: 3,
          }),
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000074',
            role: 'pathseeker',
            status: 'in_progress',
            dependsOn: ['a0000000-0000-0000-0000-000000000073'],
            insertedBy: 'a0000000-0000-0000-0000-000000000073' as ReturnType<
              typeof QuestWorkItemIdStub
            >,
            createdAt: '2024-01-15T10:04:00.000Z',
            attempt: 1,
            maxAttempts: 3,
          }),
        ],
      });

      mantineRenderAdapter({ ui: <ExecutionPanelWidget quest={quest} /> });

      expect(getFloorNames()).toStrictEqual([
        'ENTRANCE: CARTOGRAPHY',
        'FLOOR 1: FORGE',
        'FLOOR 2: MINI BOSS',
        'ENTRANCE: CARTOGRAPHY',
        'ENTRANCE: CARTOGRAPHY',
      ]);
    });

    it('VALID: {full happy chain with lawbringer step ref} => TRIBUNAL between ARENA and FLOOR BOSS', () => {
      ExecutionPanelWidgetProxy();
      const quest: Quest = QuestStub({
        status: 'in_progress',
        steps: [DependencyStepStub({ id: 'step-1', name: 'Implement feature' })],
        workItems: [
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000020',
            role: 'codeweaver',
            status: 'complete',
            relatedDataItems: ['steps/step-1'],
            dependsOn: [],
            createdAt: '2024-01-15T10:00:00.000Z',
          }),
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000021',
            role: 'ward',
            status: 'complete',
            dependsOn: ['a0000000-0000-0000-0000-000000000020'],
            createdAt: '2024-01-15T10:01:00.000Z',
          }),
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000022',
            role: 'siegemaster',
            status: 'complete',
            dependsOn: ['a0000000-0000-0000-0000-000000000021'],
            createdAt: '2024-01-15T10:02:00.000Z',
          }),
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000023',
            role: 'lawbringer',
            status: 'complete',
            relatedDataItems: ['steps/step-1'],
            dependsOn: ['a0000000-0000-0000-0000-000000000022'],
            createdAt: '2024-01-15T10:03:00.000Z',
          }),
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000024',
            role: 'ward',
            status: 'pending',
            dependsOn: ['a0000000-0000-0000-0000-000000000023'],
            createdAt: '2024-01-15T10:04:00.000Z',
          }),
        ],
      });

      mantineRenderAdapter({ ui: <ExecutionPanelWidget quest={quest} /> });

      expect(getFloorNames()).toStrictEqual([
        'FLOOR 1: FORGE',
        'FLOOR 2: MINI BOSS',
        'FLOOR 3: ARENA',
        'FLOOR 4: TRIBUNAL',
        'FLOOR 5: FLOOR BOSS',
      ]);
    });
  });

  describe('session entries for work items', () => {
    it('VALID: {terminal quest with work item sessionId and matching sessionEntries} => auto-expands row showing entries', () => {
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

      const messages = proxy.getExecutionMessages();

      expect(messages.map((m) => m.getAttribute('data-testid'))).toStrictEqual(['CHAT_MESSAGE']);
      expect(messages[0]?.textContent).toBe('CHAOSWHISPERERExploring codebase...');
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

      expect(proxy.getExecutionMessages()).toStrictEqual([]);
    });
  });

  describe('step row session entries', () => {
    it('VALID: {step with work item sessionId and matching sessionEntries} => shows session logs on expand', async () => {
      const proxy = ExecutionPanelWidgetProxy();
      const sessionId = SessionIdStub({ value: 'c0000000-0000-0000-0000-000000000001' });
      const entry = AssistantTextChatEntryStub({ content: 'Writing auth-login-broker.ts' });
      const sessionEntries = new Map([[sessionId, [entry]]]);
      const quest: Quest = QuestStub({
        status: 'in_progress',
        steps: [
          DependencyStepStub({
            id: 'step-1',
            name: 'Create auth broker',
            focusFile: { path: 'src/auth.ts', action: 'create' },
          }),
        ],
        workItems: [
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000001',
            role: 'codeweaver',
            status: 'complete',
            relatedDataItems: ['steps/step-1'],
            sessionId,
          }),
        ],
      });

      mantineRenderAdapter({
        ui: <ExecutionPanelWidget quest={quest} sessionEntries={sessionEntries} />,
      });

      const stepRows = proxy.getStepRows();
      const codeWeaverRow = stepRows[0]!;
      const rowHeader = codeWeaverRow.querySelector('[data-testid="execution-row-header"]')!;

      await userEvent.click(rowHeader);

      const messages = proxy.getExecutionMessages();

      expect(messages.map((m) => m.getAttribute('data-testid'))).toStrictEqual(['CHAT_MESSAGE']);
      expect(messages[0]?.textContent).toBe('CODEWEAVERWriting auth-login-broker.ts');
    });

    it('VALID: {step with work item but no sessionId} => shows no entries on expand', async () => {
      const proxy = ExecutionPanelWidgetProxy();
      const quest: Quest = QuestStub({
        status: 'in_progress',
        steps: [
          DependencyStepStub({
            id: 'step-1',
            name: 'Create auth broker',
            focusFile: { path: 'src/auth.ts', action: 'create' },
          }),
        ],
        workItems: [
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000001',
            role: 'codeweaver',
            status: 'complete',
            relatedDataItems: ['steps/step-1'],
          }),
        ],
      });

      mantineRenderAdapter({
        ui: <ExecutionPanelWidget quest={quest} />,
      });

      const stepRows = proxy.getStepRows();
      const codeWeaverRow = stepRows[0]!;
      const rowHeader = codeWeaverRow.querySelector('[data-testid="execution-row-header"]')!;

      await userEvent.click(rowHeader);

      expect(proxy.getExecutionMessages()).toStrictEqual([]);
    });

    it('VALID: {two steps with different sessionIds} => each step shows its own session logs', async () => {
      const proxy = ExecutionPanelWidgetProxy();
      const sessionA = SessionIdStub({ value: 'a1111111-0000-0000-0000-000000000001' });
      const sessionB = SessionIdStub({ value: 'b2222222-0000-0000-0000-000000000002' });
      const entryA = AssistantTextChatEntryStub({ content: 'Building contracts' });
      const entryB = AssistantTextChatEntryStub({ content: 'Building adapters' });
      const sessionEntries = new Map([
        [sessionA, [entryA]],
        [sessionB, [entryB]],
      ]);
      const quest: Quest = QuestStub({
        status: 'in_progress',
        steps: [
          DependencyStepStub({ id: 'step-1', name: 'Create contract' }),
          DependencyStepStub({ id: 'step-2', name: 'Create adapter' }),
        ],
        workItems: [
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000001',
            role: 'codeweaver',
            status: 'complete',
            relatedDataItems: ['steps/step-1'],
            sessionId: sessionA,
          }),
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000002',
            role: 'codeweaver',
            status: 'complete',
            relatedDataItems: ['steps/step-2'],
            sessionId: sessionB,
          }),
        ],
      });

      mantineRenderAdapter({
        ui: <ExecutionPanelWidget quest={quest} sessionEntries={sessionEntries} />,
      });

      const stepRows = proxy.getStepRows();
      const contractRow = stepRows[0]!;
      const contractHeader = contractRow.querySelector('[data-testid="execution-row-header"]')!;

      await userEvent.click(contractHeader);

      const messagesAfterFirst = proxy.getExecutionMessages();

      expect(messagesAfterFirst.map((m) => m.getAttribute('data-testid'))).toStrictEqual([
        'CHAT_MESSAGE',
      ]);
      expect(messagesAfterFirst[0]?.textContent).toBe('CODEWEAVERBuilding contracts');
    });

    it('VALID: {step with pathseeker session present elsewhere} => step row stays empty unless its own sessionId is in sessionEntries', () => {
      const proxy = ExecutionPanelWidgetProxy();
      const otherSessionId = SessionIdStub({ value: 'session-elsewhere' });
      const otherEntry = AssistantTextChatEntryStub({ content: 'Wrong session logs' });
      const sessionEntries = new Map([[otherSessionId, [otherEntry]]]);
      const quest: Quest = QuestStub({
        status: 'in_progress',
        steps: [
          DependencyStepStub({
            id: 'step-1',
            name: 'Create module',
            focusFile: { path: 'src/module.ts', action: 'create' },
          }),
        ],
        workItems: [
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000001',
            role: 'codeweaver',
            status: 'pending',
            relatedDataItems: ['steps/step-1'],
          }),
        ],
      });

      mantineRenderAdapter({
        ui: <ExecutionPanelWidget quest={quest} sessionEntries={sessionEntries} />,
      });

      expect(proxy.getExecutionMessages()).toStrictEqual([]);
    });
  });

  describe('quest title bar', () => {
    it('VALID: {quest with title} => renders quest title', () => {
      ExecutionPanelWidgetProxy();
      const quest: Quest = QuestStub({ status: 'in_progress', title: 'Implement Auth Flow' });

      mantineRenderAdapter({
        ui: <ExecutionPanelWidget quest={quest} />,
      });

      expect(screen.getByTestId('QUEST_TITLE').textContent).toBe('Implement Auth Flow');
    });
  });

  describe('pathseeker work item state', () => {
    it('VALID: {pathseeker work item failed} => planned row shows FAILED status', () => {
      ExecutionPanelWidgetProxy();
      const quest: Quest = QuestStub({
        status: 'in_progress',
        steps: [DependencyStepStub({ id: 'step-1', name: 'Step A' })],
        workItems: [
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000001',
            role: 'pathseeker',
            status: 'failed',
            errorMessage: 'Could not plan steps',
          }),
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000002',
            role: 'codeweaver',
            status: 'pending',
            relatedDataItems: ['steps/step-1'],
          }),
        ],
      });

      mantineRenderAdapter({
        ui: <ExecutionPanelWidget quest={quest} />,
      });

      const stepRows = screen.queryAllByTestId('execution-row-layer-widget');
      const plannedRow = stepRows[0]!;

      const plannedRowText = plannedRow.textContent;

      expect(plannedRowText).toMatch(/^\u25B801\[PATHSEEKER\]Pathseeker(?! #)FAILED$/u);
    });

    it('VALID: {pathseeker work item with sessionId} => planned row shows session entries on expand', async () => {
      const proxy = ExecutionPanelWidgetProxy();
      const sessionId = SessionIdStub({ value: 'ps-session-0000-0000-000000000001' });
      const entry = AssistantTextChatEntryStub({ content: 'Mapping dependency graph...' });
      const sessionEntries = new Map([[sessionId, [entry]]]);
      const quest: Quest = QuestStub({
        status: 'in_progress',
        steps: [DependencyStepStub({ id: 'step-1', name: 'Step A' })],
        workItems: [
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000001',
            role: 'pathseeker',
            status: 'complete',
            sessionId,
          }),
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000002',
            role: 'codeweaver',
            status: 'pending',
            relatedDataItems: ['steps/step-1'],
          }),
        ],
      });

      mantineRenderAdapter({
        ui: <ExecutionPanelWidget quest={quest} sessionEntries={sessionEntries} />,
      });

      const stepRows = screen.queryAllByTestId('execution-row-layer-widget');
      const plannedRowHeader = stepRows[0]!.querySelector('[data-testid="execution-row-header"]')!;

      await userEvent.click(plannedRowHeader);

      const messages = proxy.getExecutionMessages();

      expect(messages.map((m) => m.getAttribute('data-testid'))).toStrictEqual(['CHAT_MESSAGE']);
      expect(messages[0]?.textContent).toBe('PATHSEEKERMapping dependency graph...');
    });
  });

  describe('concurrent count on floor header', () => {
    it('VALID: {in_progress work items for a role} => floor header shows concurrent count', () => {
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
            status: 'in_progress',
            relatedDataItems: ['steps/step-1'],
          }),
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000002',
            role: 'codeweaver',
            status: 'in_progress',
            relatedDataItems: ['steps/step-2'],
          }),
        ],
      });

      mantineRenderAdapter({
        ui: <ExecutionPanelWidget quest={quest} />,
      });

      const floorHeaders = proxy.getFloorHeaders();

      expect(floorHeaders.map((h) => h.getAttribute('data-testid'))).toStrictEqual([
        'floor-header-layer-widget',
      ]);
      expect(floorHeaders[0]?.textContent).toMatch(/^──FLOOR \d+: \w+──+Concurrent: 2\/2$/u);
    });
  });

  describe('step metadata in expanded content', () => {
    it('VALID: {step expanded} => does not render description element', async () => {
      ExecutionPanelWidgetProxy();
      const quest: Quest = QuestStub({
        status: 'in_progress',
        steps: [
          DependencyStepStub({
            id: 'step-1',
            name: 'Create auth broker',
          }),
        ],
        workItems: [
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000001',
            role: 'codeweaver',
            status: 'complete',
            relatedDataItems: ['steps/step-1'],
          }),
        ],
      });

      mantineRenderAdapter({
        ui: <ExecutionPanelWidget quest={quest} />,
      });

      const stepRows = screen.queryAllByTestId('execution-row-layer-widget');
      const stepRowHeader = stepRows[0]!.querySelector('[data-testid="execution-row-header"]')!;

      await userEvent.click(stepRowHeader);

      expect(screen.queryByTestId('execution-row-description')).toBe(null);
    });

    it('VALID: {step with observablesSatisfied} => shows observables when expanded', async () => {
      ExecutionPanelWidgetProxy();
      const quest: Quest = QuestStub({
        status: 'in_progress',
        steps: [
          DependencyStepStub({
            id: 'step-1',
            name: 'Create login endpoint',
            observablesSatisfied: ['obs-1', 'obs-2'],
          }),
        ],
        workItems: [
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000001',
            role: 'codeweaver',
            status: 'complete',
            relatedDataItems: ['steps/step-1'],
          }),
        ],
      });

      mantineRenderAdapter({
        ui: <ExecutionPanelWidget quest={quest} />,
      });

      const stepRows = screen.queryAllByTestId('execution-row-layer-widget');
      const stepRowHeader = stepRows[0]!.querySelector('[data-testid="execution-row-header"]')!;

      await userEvent.click(stepRowHeader);

      expect(screen.getByTestId('execution-row-observables').textContent).toBe(
        'Satisfies: obs-1, obs-2',
      );
    });

    it('VALID: {step with contracts} => shows input and output contracts when expanded', async () => {
      ExecutionPanelWidgetProxy();
      const quest: Quest = QuestStub({
        status: 'in_progress',
        steps: [
          DependencyStepStub({
            id: 'step-1',
            name: 'Create auth broker',
            inputContracts: ['LoginCredentials'],
            outputContracts: ['AuthTokenPair'],
          }),
        ],
        workItems: [
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000001',
            role: 'codeweaver',
            status: 'complete',
            relatedDataItems: ['steps/step-1'],
          }),
        ],
      });

      mantineRenderAdapter({
        ui: <ExecutionPanelWidget quest={quest} />,
      });

      const stepRows = screen.queryAllByTestId('execution-row-layer-widget');
      const stepRowHeader = stepRows[0]!.querySelector('[data-testid="execution-row-header"]')!;

      await userEvent.click(stepRowHeader);

      expect(screen.getByTestId('execution-row-input-contracts').textContent).toBe(
        'Inputs: LoginCredentials',
      );
      expect(screen.getByTestId('execution-row-output-contracts').textContent).toBe(
        'Outputs: AuthTokenPair',
      );
    });
  });

  describe('ward results', () => {
    it('VALID: {ward work item with wardResults} => shows ward exit code and mode in expanded content', async () => {
      ExecutionPanelWidgetProxy();
      const wardResult = WardResultStub({
        id: 'b0000000-0000-0000-0000-000000000001',
        exitCode: 1,
        wardMode: 'changed',
      });
      const quest: Quest = QuestStub({
        status: 'in_progress',
        steps: [DependencyStepStub({ id: 'step-1', name: 'Run ward' })],
        workItems: [
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000001',
            role: 'ward',
            status: 'failed',
            relatedDataItems: ['steps/step-1', 'wardResults/b0000000-0000-0000-0000-000000000001'],
          }),
        ],
        wardResults: [wardResult],
      });

      mantineRenderAdapter({
        ui: <ExecutionPanelWidget quest={quest} />,
      });

      const stepRows = screen.queryAllByTestId('execution-row-layer-widget');
      const wardRowHeader = stepRows[0]!.querySelector('[data-testid="execution-row-header"]')!;

      await userEvent.click(wardRowHeader);

      const wardResultEl = screen.getByTestId('execution-row-ward-result');

      expect(wardResultEl.textContent).toBe('Ward exit code: 1 (changed)');
    });
  });

  describe('retry badge', () => {
    it('VALID: {work item with attempt > 0} => shows retry badge in header', () => {
      ExecutionPanelWidgetProxy();
      const quest: Quest = QuestStub({
        status: 'in_progress',
        steps: [DependencyStepStub({ id: 'step-1', name: 'Create broker' })],
        workItems: [
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000001',
            role: 'codeweaver',
            status: 'in_progress',
            relatedDataItems: ['steps/step-1'],
            attempt: 1,
            maxAttempts: 3,
          }),
        ],
      });

      mantineRenderAdapter({
        ui: <ExecutionPanelWidget quest={quest} />,
      });

      expect(screen.getByTestId('execution-row-retry-badge').textContent).toBe('retry 1/3');
    });

    it('VALID: {work item with attempt 0} => does not show retry badge', () => {
      ExecutionPanelWidgetProxy();
      const quest: Quest = QuestStub({
        status: 'in_progress',
        steps: [DependencyStepStub({ id: 'step-1', name: 'Create broker' })],
        workItems: [
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000001',
            role: 'codeweaver',
            status: 'in_progress',
            relatedDataItems: ['steps/step-1'],
            attempt: 0,
            maxAttempts: 1,
          }),
        ],
      });

      mantineRenderAdapter({
        ui: <ExecutionPanelWidget quest={quest} />,
      });

      expect(screen.queryByTestId('execution-row-retry-badge')).toBe(null);
    });
  });

  describe('duration display', () => {
    it('VALID: {work item with startedAt and completedAt} => shows duration in header', () => {
      ExecutionPanelWidgetProxy();
      const quest: Quest = QuestStub({
        status: 'in_progress',
        steps: [DependencyStepStub({ id: 'step-1', name: 'Create broker' })],
        workItems: [
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000001',
            role: 'codeweaver',
            status: 'complete',
            relatedDataItems: ['steps/step-1'],
            startedAt: '2024-01-15T10:00:00.000Z',
            completedAt: '2024-01-15T10:02:34.000Z',
          }),
        ],
      });

      mantineRenderAdapter({
        ui: <ExecutionPanelWidget quest={quest} />,
      });

      expect(screen.getByTestId('execution-row-duration').textContent).toBe('2m 34s');
    });
  });

  describe('work items only dependsOn', () => {
    it('VALID: {work item with dependsOn} => shows dependency labels from referenced work items', () => {
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
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000002',
            role: 'pathseeker',
            status: 'pending',
            dependsOn: ['a0000000-0000-0000-0000-000000000001'],
          }),
        ],
      });

      mantineRenderAdapter({
        ui: <ExecutionPanelWidget quest={quest} />,
      });

      const subtitles = screen.queryAllByTestId('execution-row-subtitle');
      const depSubtitle = subtitles.find((el) => el.textContent?.includes('depends on'));

      expect(depSubtitle?.textContent).toBe('\u2514\u2500 depends on: chaoswhisperer');
    });

    it('VALID: {ward depends on step-linked work items} => shows step names in subtitle', () => {
      ExecutionPanelWidgetProxy();
      const quest: Quest = QuestStub({
        status: 'in_progress',
        steps: [
          DependencyStepStub({ id: 'step-1', name: 'Build login form' }),
          DependencyStepStub({ id: 'step-2', name: 'Add validation logic' }),
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
            status: 'complete',
            relatedDataItems: ['steps/step-2'],
          }),
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000003',
            role: 'spiritmender',
            status: 'pending',
            dependsOn: [
              'a0000000-0000-0000-0000-000000000001',
              'a0000000-0000-0000-0000-000000000002',
            ],
          }),
        ],
      });

      mantineRenderAdapter({
        ui: <ExecutionPanelWidget quest={quest} />,
      });

      const subtitles = screen.queryAllByTestId('execution-row-subtitle');
      const depSubtitle = subtitles.find((el) => el.textContent?.includes('depends on'));

      expect(depSubtitle?.textContent).toBe(
        '\u2514\u2500 depends on: Build login form, Add validation logic',
      );
    });

    it('EDGE: {work item with step ref but step not found} => falls back to role name in dependency label', () => {
      ExecutionPanelWidgetProxy();
      const quest: Quest = QuestStub({
        status: 'in_progress',
        steps: [],
        workItems: [
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000001',
            role: 'codeweaver',
            status: 'complete',
            relatedDataItems: ['steps/nonexistent-step'],
          }),
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000002',
            role: 'spiritmender',
            status: 'pending',
            dependsOn: ['a0000000-0000-0000-0000-000000000001'],
          }),
        ],
      });

      mantineRenderAdapter({
        ui: <ExecutionPanelWidget quest={quest} />,
      });

      const subtitles = screen.queryAllByTestId('execution-row-subtitle');
      const depSubtitle = subtitles.find((el) => el.textContent?.includes('depends on'));

      expect(depSubtitle?.textContent).toBe('\u2514\u2500 depends on: codeweaver');
    });
  });

  describe('work items only naming', () => {
    it('VALID: {single work item in group} => shows capitalized role without index number', () => {
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

      const stepRows = screen.queryAllByTestId('execution-row-layer-widget');

      expect(stepRows[0]?.textContent).toBe('\u25B801[CHAOSWHISPERER]ChaoswhispererDONE');
    });

    it('VALID: {multiple work items in same group} => shows #N index on each', () => {
      ExecutionPanelWidgetProxy();
      const quest: Quest = QuestStub({
        status: 'complete',
        steps: [],
        workItems: [
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000001',
            role: 'codeweaver',
            status: 'complete',
          }),
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000002',
            role: 'codeweaver',
            status: 'complete',
          }),
        ],
      });

      mantineRenderAdapter({
        ui: <ExecutionPanelWidget quest={quest} />,
      });

      const stepRows = screen.queryAllByTestId('execution-row-layer-widget');

      expect(stepRows[0]?.textContent).toBe('\u25B801[CODEWEAVER]Codeweaver #1DONE');
      expect(stepRows[1]?.textContent).toBe('\u25B802[CODEWEAVER]Codeweaver #2DONE');
    });
  });

  describe('non-step work items alongside steps', () => {
    it('VALID: {quest with steps AND chaoswhisperer work item without relatedDataItems} => renders chaoswhisperer in SANCTUM floor', () => {
      const proxy = ExecutionPanelWidgetProxy();
      const quest: Quest = QuestStub({
        status: 'in_progress',
        steps: [DependencyStepStub({ id: 'step-1', name: 'Render test content' })],
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
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000003',
            role: 'codeweaver',
            status: 'complete',
            relatedDataItems: ['steps/step-1'],
          }),
        ],
      });

      mantineRenderAdapter({
        ui: <ExecutionPanelWidget quest={quest} />,
      });

      const floorHeaders = proxy.getFloorHeaders();

      expect(floorHeaders.map((h) => h.getAttribute('data-testid'))).toStrictEqual([
        'floor-header-layer-widget',
        'floor-header-layer-widget',
        'floor-header-layer-widget',
      ]);
      expect(floorHeaders[0]?.textContent).toMatch(/^──HOMEBASE──+$/u);
      expect(floorHeaders[1]?.textContent).toMatch(/^──ENTRANCE: CARTOGRAPHY──+$/u);
      expect(floorHeaders[2]?.textContent).toMatch(/^──FLOOR \d+: FORGE──+$/u);

      const stepRows = proxy.getStepRows();

      // chaoswhisperer row + pathseeker row + codeweaver row = 3
      expect(stepRows.map((r) => r.getAttribute('data-testid'))).toStrictEqual([
        'execution-row-layer-widget',
        'execution-row-layer-widget',
        'execution-row-layer-widget',
      ]);
    });

    it('VALID: {quest with steps and multiple non-step roles} => renders all floors in topological order', () => {
      const proxy = ExecutionPanelWidgetProxy();
      const quest: Quest = QuestStub({
        status: 'in_progress',
        steps: [DependencyStepStub({ id: 'step-1', name: 'Build module' })],
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
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000003',
            role: 'codeweaver',
            status: 'complete',
            relatedDataItems: ['steps/step-1'],
          }),
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000004',
            role: 'spiritmender',
            status: 'complete',
          }),
        ],
      });

      mantineRenderAdapter({
        ui: <ExecutionPanelWidget quest={quest} />,
      });

      const floorHeaders = proxy.getFloorHeaders();

      // All at depth 0, sorted by role config index: chaoswhisperer, pathseeker, codeweaver, spiritmender
      expect(floorHeaders.map((h) => h.getAttribute('data-testid'))).toStrictEqual([
        'floor-header-layer-widget',
        'floor-header-layer-widget',
        'floor-header-layer-widget',
        'floor-header-layer-widget',
      ]);
      expect(floorHeaders[0]?.textContent).toMatch(/^──HOMEBASE──+$/u);
      expect(floorHeaders[1]?.textContent).toMatch(/^──ENTRANCE: CARTOGRAPHY──+$/u);
      expect(floorHeaders[2]?.textContent).toMatch(/^──FLOOR \d+: FORGE──+$/u);
      expect(floorHeaders[3]?.textContent).toMatch(/^──FLOOR \d+: INFIRMARY──+$/u);
    });

    it('VALID: {quest with steps and non-step work item with sessionId} => shows session entries for non-step work item on expand', async () => {
      const proxy = ExecutionPanelWidgetProxy();
      const sessionId = SessionIdStub({ value: 'cw-session-0000-0000-000000000001' });
      const entry = AssistantTextChatEntryStub({ content: 'Defining quest spec...' });
      const sessionEntries = new Map([[sessionId, [entry]]]);
      const quest: Quest = QuestStub({
        status: 'in_progress',
        steps: [DependencyStepStub({ id: 'step-1', name: 'Build module' })],
        workItems: [
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000001',
            role: 'chaoswhisperer',
            status: 'complete',
            sessionId,
          }),
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000002',
            role: 'codeweaver',
            status: 'complete',
            relatedDataItems: ['steps/step-1'],
          }),
        ],
      });

      mantineRenderAdapter({
        ui: <ExecutionPanelWidget quest={quest} sessionEntries={sessionEntries} />,
      });

      const stepRows = proxy.getStepRows();
      const cwRow = stepRows[0]!;
      const cwHeader = cwRow.querySelector('[data-testid="execution-row-header"]')!;

      await userEvent.click(cwHeader);

      const messages = proxy.getExecutionMessages();

      expect(messages.map((m) => m.getAttribute('data-testid'))).toStrictEqual(['CHAT_MESSAGE']);
      expect(messages[0]?.textContent).toBe('CHAOSWHISPERERDefining quest spec...');
    });

    it('VALID: {planning quest with chaoswhisperer work item} => renders chaoswhisperer floor during planning', () => {
      const proxy = ExecutionPanelWidgetProxy();
      const quest: Quest = QuestStub({
        status: 'in_progress',
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
            status: 'in_progress',
          }),
        ],
      });

      mantineRenderAdapter({
        ui: <ExecutionPanelWidget quest={quest} />,
      });

      const floorHeaders = proxy.getFloorHeaders();

      expect(floorHeaders.map((h) => h.getAttribute('data-testid'))).toStrictEqual([
        'floor-header-layer-widget',
      ]);
      expect(floorHeaders[0]?.textContent).toMatch(/^──HOMEBASE──+$/u);

      expect(proxy.hasPlanningText()).toBe(true);

      const stepRows = proxy.getStepRows();

      expect(stepRows.some((row) => row.textContent?.includes('CHAOSWHISPERER'))).toBe(true);
    });
  });

  describe('pause/resume button visibility matrix', () => {
    describe('PAUSE button visible (seek_* and in_progress)', () => {
      it.each([
        { status: 'seek_scope' },
        { status: 'seek_synth' },
        { status: 'seek_walk' },
        { status: 'in_progress' },
      ] as const)(
        'VALID: {status: $status} => PAUSE button visible, RESUME button not visible',
        ({ status }) => {
          const proxy = ExecutionPanelWidgetProxy();
          const quest: Quest = QuestStub({ status });
          const onStatusChange = jest.fn();
          const onPause = jest.fn();

          mantineRenderAdapter({
            ui: (
              <ExecutionPanelWidget
                quest={quest}
                onStatusChange={onStatusChange}
                onPause={onPause}
              />
            ),
          });

          expect(proxy.hasPauseButton()).toBe(true);
          expect(proxy.hasResumeButton()).toBe(false);
        },
      );
    });

    describe('RESUME button visible (paused and blocked)', () => {
      it.each([{ status: 'paused' }, { status: 'blocked' }] as const)(
        'VALID: {status: $status} => RESUME button visible, PAUSE button not visible',
        ({ status }) => {
          const proxy = ExecutionPanelWidgetProxy();
          const quest: Quest = QuestStub({ status });
          const onStatusChange = jest.fn();
          const onPause = jest.fn();

          mantineRenderAdapter({
            ui: (
              <ExecutionPanelWidget
                quest={quest}
                onStatusChange={onStatusChange}
                onPause={onPause}
              />
            ),
          });

          expect(proxy.hasResumeButton()).toBe(true);
          expect(proxy.hasPauseButton()).toBe(false);
        },
      );
    });

    describe('no pause/resume buttons (pre-execution, terminal)', () => {
      it.each([
        { status: 'pending' },
        { status: 'created' },
        { status: 'explore_flows' },
        { status: 'review_flows' },
        { status: 'flows_approved' },
        { status: 'explore_observables' },
        { status: 'review_observables' },
        { status: 'approved' },
        { status: 'explore_design' },
        { status: 'review_design' },
        { status: 'design_approved' },
        { status: 'complete' },
        { status: 'abandoned' },
      ] as const)(
        'EMPTY: {status: $status} => neither PAUSE nor RESUME button visible',
        ({ status }) => {
          const proxy = ExecutionPanelWidgetProxy();
          const quest: Quest = QuestStub({ status });
          const onStatusChange = jest.fn();
          const onPause = jest.fn();

          mantineRenderAdapter({
            ui: (
              <ExecutionPanelWidget
                quest={quest}
                onStatusChange={onStatusChange}
                onPause={onPause}
              />
            ),
          });

          expect(proxy.hasPauseButton()).toBe(false);
          expect(proxy.hasResumeButton()).toBe(false);
        },
      );
    });

    describe('click behavior', () => {
      it('VALID: {click PAUSE button on seek_walk} => calls onPause once', async () => {
        const proxy = ExecutionPanelWidgetProxy();
        const quest: Quest = QuestStub({ status: 'seek_walk' });
        const onStatusChange = jest.fn();
        const onPause = jest.fn();

        mantineRenderAdapter({
          ui: (
            <ExecutionPanelWidget quest={quest} onStatusChange={onStatusChange} onPause={onPause} />
          ),
        });

        await proxy.clickPauseButton();

        expect(onPause).toHaveBeenCalledTimes(1);
        expect(onPause).toHaveBeenCalledWith();
        expect(onStatusChange.mock.calls).toStrictEqual([]);
      });

      it('VALID: {click RESUME button on paused} => calls onStatusChange with in_progress', async () => {
        const proxy = ExecutionPanelWidgetProxy();
        const quest: Quest = QuestStub({ status: 'paused' });
        const onStatusChange = jest.fn();
        const onPause = jest.fn();

        mantineRenderAdapter({
          ui: (
            <ExecutionPanelWidget quest={quest} onStatusChange={onStatusChange} onPause={onPause} />
          ),
        });

        await proxy.clickResumeButton();

        expect(onStatusChange).toHaveBeenCalledTimes(1);
        expect(onStatusChange).toHaveBeenCalledWith({ status: 'in_progress' });
        expect(onPause.mock.calls).toStrictEqual([]);
      });
    });
  });

  describe('terminal banner', () => {
    type StatusKey = keyof typeof questStatusMetadataStatics.statuses;
    const PANEL_STATUSES = (
      Object.keys(questStatusMetadataStatics.statuses) as readonly StatusKey[]
    ).filter((s) => questStatusMetadataStatics.statuses[s].shouldRenderExecutionPanel);
    const TERMINAL_PANEL_STATUSES = PANEL_STATUSES.filter(
      (s) => questStatusMetadataStatics.statuses[s].isTerminal,
    );
    const NON_TERMINAL_PANEL_STATUSES = PANEL_STATUSES.filter(
      (s) => !questStatusMetadataStatics.statuses[s].isTerminal,
    );

    it.each(TERMINAL_PANEL_STATUSES)(
      'VALID: {status: %s} => terminal banner visible with displayHeader text',
      (status) => {
        ExecutionPanelWidgetProxy();
        const quest: Quest = QuestStub({ status });

        mantineRenderAdapter({
          ui: <ExecutionPanelWidget quest={quest} />,
        });

        const banner = screen.getByTestId('execution-panel-terminal-banner');
        const { displayHeader } = questStatusMetadataStatics.statuses[status];

        expect(banner.textContent).toBe(displayHeader);
      },
    );

    it.each(TERMINAL_PANEL_STATUSES)(
      'VALID: {status: %s} => status bar progress count suppressed when terminal',
      (status) => {
        ExecutionPanelWidgetProxy();
        const quest: Quest = QuestStub({ status });

        mantineRenderAdapter({
          ui: <ExecutionPanelWidget quest={quest} />,
        });

        expect(screen.queryByTestId('execution-status-bar-layer-widget')).toBe(null);
      },
    );

    it.each(NON_TERMINAL_PANEL_STATUSES)(
      'VALID: {status: %s} => terminal banner hidden when quest is non-terminal',
      (status) => {
        ExecutionPanelWidgetProxy();
        const quest: Quest = QuestStub({ status });

        mantineRenderAdapter({
          ui: <ExecutionPanelWidget quest={quest} />,
        });

        expect(screen.queryByTestId('execution-panel-terminal-banner')).toBe(null);
      },
    );

    it('VALID: {status: complete} => terminal banner uses success color (green)', () => {
      ExecutionPanelWidgetProxy();
      const quest: Quest = QuestStub({ status: 'complete' });

      mantineRenderAdapter({
        ui: <ExecutionPanelWidget quest={quest} />,
      });

      const banner = screen.getByTestId('execution-panel-terminal-banner');

      // emberDepthsThemeStatics.colors.success = '#4ade80' → rgb(74, 222, 128) in JSDOM
      expect(banner.style.color).toBe('rgb(74, 222, 128)');
    });

    it('VALID: {status: abandoned} => terminal banner uses danger color (red)', () => {
      ExecutionPanelWidgetProxy();
      const quest: Quest = QuestStub({ status: 'abandoned' });

      mantineRenderAdapter({
        ui: <ExecutionPanelWidget quest={quest} />,
      });

      const banner = screen.getByTestId('execution-panel-terminal-banner');

      // emberDepthsThemeStatics.colors.danger = '#ef4444' → rgb(239, 68, 68) in JSDOM
      expect(banner.style.color).toBe('rgb(239, 68, 68)');
    });
  });
});
