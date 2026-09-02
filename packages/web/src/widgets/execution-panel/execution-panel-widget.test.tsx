import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import {
  AssistantTextChatEntryStub,
  OperationItemStub,
  QuestStub,
  QuestWorkItemIdStub,
  RiftcarverResultStub,
  SessionIdStub,
  TaskToolUseChatEntryStub,
  WardResultStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';

import { questStatusMetadataStatics } from '@dungeonmaster/shared/statics';
import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { ExecutionPanelWidget } from './execution-panel-widget';
import { ExecutionPanelWidgetProxy } from './execution-panel-widget.proxy';

type Quest = ReturnType<typeof QuestStub>;

const OP_ID_1 = 'a1b2c3d4-58cc-4372-a567-0e02b2c3d401';
const OP_ID_2 = 'a1b2c3d4-58cc-4372-a567-0e02b2c3d402';
const OP_ID_3 = 'a1b2c3d4-58cc-4372-a567-0e02b2c3d403';

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

    it('VALID: {in_progress quest} => tab bar holds exactly EXECUTION then QUEST SPEC', () => {
      const proxy = ExecutionPanelWidgetProxy();
      const quest: Quest = QuestStub({ status: 'in_progress' });

      mantineRenderAdapter({
        ui: <ExecutionPanelWidget quest={quest} />,
      });

      expect(proxy.getTabLabels()).toStrictEqual(['EXECUTION', 'QUEST SPEC']);
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

  describe('status bar operations progress', () => {
    it('EMPTY: {non-terminal quest with no operations} => renders AWAITING PLAN status', () => {
      const proxy = ExecutionPanelWidgetProxy();
      const quest: Quest = QuestStub({ status: 'in_progress', operations: [] });

      mantineRenderAdapter({
        ui: <ExecutionPanelWidget quest={quest} />,
      });

      expect(proxy.hasStatusBar()).toBe(true);
      expect(screen.getByTestId('execution-status-bar-layer-widget').textContent).toBe(
        'EXECUTIONAWAITING PLAN',
      );
    });

    it('VALID: {3 operations, 1 complete} => status bar shows 1/3 OPERATIONS', () => {
      ExecutionPanelWidgetProxy();
      const quest: Quest = QuestStub({
        status: 'in_progress',
        operations: [
          OperationItemStub({ id: OP_ID_1, text: 'build the broker', status: 'complete' }),
          OperationItemStub({ id: OP_ID_2, text: 'wire the flow', status: 'in_progress' }),
          OperationItemStub({ id: OP_ID_3, text: 'polish widgets', status: 'pending' }),
        ],
      });

      mantineRenderAdapter({
        ui: <ExecutionPanelWidget quest={quest} />,
      });

      expect(screen.getByTestId('execution-status-bar-layer-widget').textContent).toBe(
        'EXECUTION1/3 OPERATIONS',
      );
    });

    it('VALID: {2 operations, 0 complete} => status bar shows 0/2 OPERATIONS', () => {
      ExecutionPanelWidgetProxy();
      const quest: Quest = QuestStub({
        status: 'in_progress',
        operations: [
          OperationItemStub({ id: OP_ID_1, text: 'build the broker', status: 'pending' }),
          OperationItemStub({ id: OP_ID_2, text: 'wire the flow', status: 'pending' }),
        ],
      });

      mantineRenderAdapter({
        ui: <ExecutionPanelWidget quest={quest} />,
      });

      expect(screen.getByTestId('execution-status-bar-layer-widget').textContent).toBe(
        'EXECUTION0/2 OPERATIONS',
      );
    });
  });

  describe('operations ledger', () => {
    it('EMPTY: {no operations} => does not render the operations ledger', () => {
      const proxy = ExecutionPanelWidgetProxy();
      const quest: Quest = QuestStub({ status: 'in_progress', operations: [] });

      mantineRenderAdapter({
        ui: <ExecutionPanelWidget quest={quest} />,
      });

      expect(proxy.hasOperationsLedger()).toBe(false);
    });

    it('VALID: {operations with mixed statuses} => renders ledger rows in ledger order with status markers', () => {
      const proxy = ExecutionPanelWidgetProxy();
      const quest: Quest = QuestStub({
        status: 'in_progress',
        operations: [
          OperationItemStub({ id: OP_ID_1, text: 'build the broker', status: 'complete' }),
          OperationItemStub({ id: OP_ID_2, text: 'wire the flow', status: 'in_progress' }),
          OperationItemStub({
            id: OP_ID_3,
            role: 'ward',
            text: 'verify: ward',
            status: 'pending',
            wardMode: 'changed',
          }),
        ],
      });

      mantineRenderAdapter({
        ui: <ExecutionPanelWidget quest={quest} />,
      });

      expect(proxy.hasOperationsLedger()).toBe(true);
      expect(proxy.getOperationsLedgerRows().map((r) => r.textContent)).toStrictEqual([
        '[x][CODEWEAVER]build the broker',
        '[>][CODEWEAVER]wire the flow',
        '[ ][WARD]verify: ward(changed)',
      ]);
    });

    it('VALID: {operations and work items} => ledger renders above the work-item rows', () => {
      const proxy = ExecutionPanelWidgetProxy();
      const quest: Quest = QuestStub({
        status: 'in_progress',
        operations: [
          OperationItemStub({ id: OP_ID_1, text: 'build the broker', status: 'in_progress' }),
        ],
        workItems: [
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000001',
            role: 'codeweaver',
            status: 'in_progress',
            relatedDataItems: [`operations/${OP_ID_1}`],
          }),
        ],
      });

      mantineRenderAdapter({
        ui: <ExecutionPanelWidget quest={quest} />,
      });

      expect(proxy.hasOperationsLedger()).toBe(true);

      const floorContent = screen.getByTestId('execution-panel-floor-content');
      const orderedTestIds = Array.from(
        floorContent.querySelectorAll(
          '[data-testid="OPERATIONS_LEDGER"], [data-testid="execution-row-layer-widget"]',
        ),
      ).map((el) => el.getAttribute('data-testid'));

      expect(orderedTestIds).toStrictEqual(['OPERATIONS_LEDGER', 'execution-row-layer-widget']);
    });
  });

  describe('flat work-item rows', () => {
    it('VALID: {work items linked to operations} => renders rows in quest.workItems order named by operation text', () => {
      const proxy = ExecutionPanelWidgetProxy();
      const quest: Quest = QuestStub({
        status: 'in_progress',
        operations: [
          OperationItemStub({ id: OP_ID_1, text: 'build the broker', status: 'complete' }),
          OperationItemStub({ id: OP_ID_2, text: 'wire the flow', status: 'pending' }),
        ],
        workItems: [
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000001',
            role: 'chaoswhisperer',
            status: 'complete',
          }),
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000002',
            role: 'codeweaver',
            status: 'complete',
            relatedDataItems: [`operations/${OP_ID_1}`],
          }),
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000003',
            role: 'codeweaver',
            status: 'pending',
            relatedDataItems: [`operations/${OP_ID_2}`],
          }),
        ],
      });

      mantineRenderAdapter({
        ui: <ExecutionPanelWidget quest={quest} />,
      });

      const stepRows = proxy.getStepRows();

      expect(stepRows.map((r) => r.textContent)).toStrictEqual([
        '▸01[CHAOSWHISPERER]ChaoswhispererDONE',
        '▸02[CODEWEAVER]build the brokerDONE',
        '···03[CODEWEAVER]wire the flowPENDING',
      ]);
    });

    it('EDGE: {work item with operations ref that does not resolve} => falls back to capitalized role name', () => {
      const proxy = ExecutionPanelWidgetProxy();
      const quest: Quest = QuestStub({
        status: 'in_progress',
        operations: [
          OperationItemStub({ id: OP_ID_1, text: 'build the broker', status: 'pending' }),
        ],
        workItems: [
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000001',
            role: 'codeweaver',
            status: 'complete',
            relatedDataItems: [`operations/${OP_ID_2}`],
          }),
        ],
      });

      mantineRenderAdapter({
        ui: <ExecutionPanelWidget quest={quest} />,
      });

      expect(proxy.getStepRows().map((r) => r.textContent)).toStrictEqual([
        '▸01[CODEWEAVER]CodeweaverDONE',
      ]);
    });

    it('VALID: {non-terminal quest with skipped work item} => skipped row is hidden', () => {
      const proxy = ExecutionPanelWidgetProxy();
      const quest: Quest = QuestStub({
        status: 'in_progress',
        operations: [
          OperationItemStub({ id: OP_ID_1, text: 'build the broker', status: 'pending' }),
        ],
        workItems: [
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000001',
            role: 'codeweaver',
            status: 'skipped',
            relatedDataItems: [`operations/${OP_ID_1}`],
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

      expect(proxy.getStepRows().map((r) => r.textContent)).toStrictEqual(['▸01[WARD]WardDONE']);
    });

    it('VALID: {expanded complete row} => never renders a Files line (files are always empty)', async () => {
      const proxy = ExecutionPanelWidgetProxy();
      const quest: Quest = QuestStub({
        status: 'in_progress',
        operations: [
          OperationItemStub({ id: OP_ID_1, text: 'build the broker', status: 'complete' }),
        ],
        workItems: [
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000001',
            role: 'codeweaver',
            status: 'complete',
            relatedDataItems: [`operations/${OP_ID_1}`],
          }),
        ],
      });

      mantineRenderAdapter({
        ui: <ExecutionPanelWidget quest={quest} />,
      });

      const rowHeader = proxy
        .getStepRows()[0]!
        .querySelector('[data-testid="execution-row-header"]')!;

      await userEvent.click(rowHeader);

      expect(screen.getByTestId('execution-row-expanded')).toBeInTheDocument();
      expect(screen.queryByTestId('execution-row-files')).toBe(null);
    });

    it('EMPTY: {no work items} => renders no rows', () => {
      const proxy = ExecutionPanelWidgetProxy();
      const quest: Quest = QuestStub({ status: 'in_progress', workItems: [] });

      mantineRenderAdapter({
        ui: <ExecutionPanelWidget quest={quest} />,
      });

      expect(proxy.getStepRows()).toStrictEqual([]);
    });
  });

  describe('dependsOn labels', () => {
    it('VALID: {work item with dependsOn} => subtitle shows the dependency role labels', () => {
      ExecutionPanelWidgetProxy();
      const quest: Quest = QuestStub({
        status: 'in_progress',
        workItems: [
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000001',
            role: 'chaoswhisperer',
            status: 'complete',
          }),
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000002',
            role: 'codeweaver',
            status: 'pending',
            dependsOn: ['a0000000-0000-0000-0000-000000000001'],
          }),
        ],
      });

      mantineRenderAdapter({
        ui: <ExecutionPanelWidget quest={quest} />,
      });

      const subtitles = screen.queryAllByTestId('execution-row-subtitle');

      expect(subtitles.map((s) => s.textContent)).toStrictEqual(['└─ depends on: chaoswhisperer']);
    });
  });

  describe('ward results', () => {
    it('VALID: {ward work item with wardResults ref} => shows ward exit code and mode in expanded content', async () => {
      ExecutionPanelWidgetProxy();
      const wardResult = WardResultStub({
        id: 'b0000000-0000-0000-0000-000000000001',
        exitCode: 1,
        wardMode: 'changed',
      });
      const quest: Quest = QuestStub({
        status: 'in_progress',
        operations: [
          OperationItemStub({
            id: OP_ID_1,
            role: 'ward',
            text: 'verify: ward',
            status: 'complete',
            wardMode: 'changed',
          }),
        ],
        workItems: [
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000001',
            role: 'ward',
            status: 'failed',
            relatedDataItems: [
              `operations/${OP_ID_1}`,
              'wardResults/b0000000-0000-0000-0000-000000000001',
            ],
          }),
        ],
        wardResults: [wardResult],
      });

      mantineRenderAdapter({
        ui: <ExecutionPanelWidget quest={quest} />,
      });

      const wardRowHeader = screen
        .getAllByTestId('execution-row-layer-widget')[0]!
        .querySelector('[data-testid="execution-row-header"]')!;

      await userEvent.click(wardRowHeader);

      expect(screen.getByTestId('execution-row-ward-result').textContent).toBe(
        'Ward exit code: 1 (changed)',
      );
    });
  });

  describe('riftcarver results', () => {
    it('VALID: {riftcarver work item with riftcarverResults ref} => resolves the ref through a real questContract.parse and shows riftcarver exit code and outcome in expanded content', async () => {
      ExecutionPanelWidgetProxy();
      const riftcarverResult = RiftcarverResultStub({
        id: 'c0000000-0000-0000-0000-000000000001',
        exitCode: 1,
        outcome: 'repairable',
      });
      const quest: Quest = QuestStub({
        status: 'in_progress',
        operations: [
          OperationItemStub({
            id: OP_ID_1,
            role: 'riftcarver',
            text: 'Riftcarver: carve the quest branch, worktree and preflight build',
            status: 'complete',
          }),
        ],
        workItems: [
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000001',
            role: 'riftcarver',
            status: 'failed',
            relatedDataItems: [
              `operations/${OP_ID_1}`,
              'riftcarverResults/c0000000-0000-0000-0000-000000000001',
            ],
          }),
        ],
        riftcarverResults: [riftcarverResult],
      });

      mantineRenderAdapter({
        ui: <ExecutionPanelWidget quest={quest} />,
      });

      const riftcarverRowHeader = screen
        .getAllByTestId('execution-row-layer-widget')[0]!
        .querySelector('[data-testid="execution-row-header"]')!;

      await userEvent.click(riftcarverRowHeader);

      expect(screen.getByTestId('execution-row-riftcarver-result').textContent).toBe(
        'Riftcarver exit code: 1 (repairable)',
      );
    });

    it('EMPTY: {riftcarver work item whose ref does not resolve to any riftcarverResults entry} => renders no riftcarver result element', async () => {
      ExecutionPanelWidgetProxy();
      const quest: Quest = QuestStub({
        status: 'in_progress',
        operations: [
          OperationItemStub({
            id: OP_ID_1,
            role: 'riftcarver',
            text: 'Riftcarver: carve the quest branch, worktree and preflight build',
            status: 'complete',
          }),
        ],
        workItems: [
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000001',
            role: 'riftcarver',
            status: 'in_progress',
            relatedDataItems: [
              `operations/${OP_ID_1}`,
              'riftcarverResults/d0000000-0000-0000-0000-000000000099',
            ],
          }),
        ],
        riftcarverResults: [],
      });

      mantineRenderAdapter({
        ui: <ExecutionPanelWidget quest={quest} />,
      });

      const riftcarverRowHeader = screen
        .getAllByTestId('execution-row-layer-widget')[0]!
        .querySelector('[data-testid="execution-row-header"]')!;

      await userEvent.click(riftcarverRowHeader);

      expect(screen.queryByTestId('execution-row-riftcarver-result')).toBe(null);
    });
  });

  describe('abandon-early skipped items', () => {
    it('VALID: {abandoned quest, no operations, skipped chaoswhisperer with session entries} => skipped row renders and auto-expands its transcript', () => {
      const proxy = ExecutionPanelWidgetProxy();
      const sessionId = SessionIdStub({ value: '91c4944d-55e3-4231-bd48-140245f11867' });
      const entry = AssistantTextChatEntryStub({ content: 'Capturing the spec...' });
      const sessionEntries = new Map([[sessionId, [entry]]]);
      const quest: Quest = QuestStub({
        status: 'abandoned',
        operations: [],
        workItems: [
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000001',
            role: 'chaoswhisperer',
            status: 'skipped',
            sessionId,
          }),
        ],
      });

      mantineRenderAdapter({
        ui: <ExecutionPanelWidget quest={quest} sessionEntries={sessionEntries} />,
      });

      expect(proxy.getStepRows().map((r) => r.getAttribute('data-testid'))).toStrictEqual([
        'execution-row-layer-widget',
      ]);

      const messages = proxy.getExecutionMessages();

      expect(messages.map((m) => m.textContent)).toStrictEqual([
        'CHAOSWHISPERERCapturing the spec...',
      ]);
    });

    it('VALID: {abandoned quest WITH operations, skipped work item} => skipped row stays hidden', () => {
      const proxy = ExecutionPanelWidgetProxy();
      const quest: Quest = QuestStub({
        status: 'abandoned',
        operations: [
          OperationItemStub({ id: OP_ID_1, text: 'build the broker', status: 'pending' }),
        ],
        workItems: [
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000001',
            role: 'codeweaver',
            status: 'complete',
            relatedDataItems: [`operations/${OP_ID_1}`],
          }),
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000002',
            role: 'ward',
            status: 'skipped',
          }),
        ],
      });

      mantineRenderAdapter({
        ui: <ExecutionPanelWidget quest={quest} />,
      });

      expect(proxy.getStepRows().map((r) => r.textContent)).toStrictEqual([
        '▸01[CODEWEAVER]build the brokerDONE',
      ]);
    });
  });

  describe('ad-hoc detection', () => {
    it('VALID: {work item has insertedBy} => renders row with AD-HOC indicator', () => {
      ExecutionPanelWidgetProxy();
      const insertedById = QuestWorkItemIdStub({
        value: 'b0000000-0000-0000-0000-000000000001',
      });
      const quest: Quest = QuestStub({
        status: 'in_progress',
        workItems: [
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000001',
            role: 'spiritmender',
            status: 'in_progress',
            insertedBy: insertedById,
          }),
        ],
      });

      mantineRenderAdapter({
        ui: <ExecutionPanelWidget quest={quest} />,
      });

      expect(screen.getByTestId('execution-row-adhoc-tag').textContent).toBe('AD-HOC');
    });

    it('VALID: {work item has no insertedBy} => does not render AD-HOC indicator', () => {
      ExecutionPanelWidgetProxy();
      const quest: Quest = QuestStub({
        status: 'in_progress',
        workItems: [
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000001',
            role: 'codeweaver',
            status: 'in_progress',
          }),
        ],
      });

      mantineRenderAdapter({
        ui: <ExecutionPanelWidget quest={quest} />,
      });

      expect(screen.queryByTestId('execution-row-adhoc-tag')).toBe(null);
    });
  });

  describe('session entries for work items', () => {
    it('VALID: {terminal quest, no operations, work item sessionId with matching sessionEntries} => auto-expands row showing entries', () => {
      const proxy = ExecutionPanelWidgetProxy();
      const sessionId = SessionIdStub({ value: '91c4944d-55e3-4231-bd48-140245f11867' });
      const entry = AssistantTextChatEntryStub({ content: 'Exploring codebase...' });
      const sessionEntries = new Map([[sessionId, [entry]]]);
      const quest: Quest = QuestStub({
        status: 'complete',
        operations: [],
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
        operations: [],
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

    it('VALID: {in_progress work item with sessionId and entries} => row auto-expands with streaming entries', () => {
      const proxy = ExecutionPanelWidgetProxy();
      const sessionId = SessionIdStub({ value: 'c0000000-0000-0000-0000-000000000001' });
      const entry = AssistantTextChatEntryStub({ content: 'Writing auth-login-broker.ts' });
      const sessionEntries = new Map([[sessionId, [entry]]]);
      const quest: Quest = QuestStub({
        status: 'in_progress',
        operations: [
          OperationItemStub({ id: OP_ID_1, text: 'build the broker', status: 'in_progress' }),
        ],
        workItems: [
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000001',
            role: 'codeweaver',
            status: 'in_progress',
            relatedDataItems: [`operations/${OP_ID_1}`],
            sessionId,
          }),
        ],
      });

      mantineRenderAdapter({
        ui: <ExecutionPanelWidget quest={quest} sessionEntries={sessionEntries} />,
      });

      const messages = proxy.getExecutionMessages();

      expect(messages.map((m) => m.getAttribute('data-testid'))).toStrictEqual(['CHAT_MESSAGE']);
      expect(messages[0]?.textContent).toBe('CODEWEAVERWriting auth-login-broker.ts');
      expect(proxy.hasStreamingBar()).toBe(true);
    });
  });

  describe('nested sub-agent entries', () => {
    it('VALID: {parent row whose transcript spawns a nested sub-agent whose own entries live only in the session pool} => nested chain shows its real entry count and renders its entries', () => {
      const proxy = ExecutionPanelWidgetProxy();
      const sessionId = SessionIdStub({ value: '5e5510a4-0000-0000-0000-000000000abc' });
      const parentWorkItemId = QuestWorkItemIdStub({
        value: 'b0000000-0000-0000-0000-0000000000aa',
      });

      // The parent transcript: a Task tool_use line that spawned the nested sub-agent.
      // This is the only entry routed to the parent's own work-item bucket.
      const nestedTaskToolUse = TaskToolUseChatEntryStub({ agentId: 'minion-1' });

      // The nested sub-agent's OWN transcript entries. They arrive bucketed under the
      // session pool (sessionEntries), NOT the parent's work-item bucket.
      const nestedEntry1 = AssistantTextChatEntryStub({
        source: 'subagent',
        agentId: 'minion-1',
        content: 'nested line one',
      });
      const nestedEntry2 = AssistantTextChatEntryStub({
        source: 'subagent',
        agentId: 'minion-1',
        content: 'nested line two',
      });
      const nestedEntry3 = AssistantTextChatEntryStub({
        source: 'subagent',
        agentId: 'minion-1',
        content: 'nested line three',
      });

      const workItemEntries = new Map([[parentWorkItemId, [nestedTaskToolUse]]]);
      const sessionEntries = new Map([
        [sessionId, [nestedTaskToolUse, nestedEntry1, nestedEntry2, nestedEntry3]],
      ]);

      const quest: Quest = QuestStub({
        status: 'complete',
        operations: [],
        workItems: [
          WorkItemStub({
            id: parentWorkItemId,
            role: 'codeweaver',
            status: 'complete',
            sessionId,
          }),
        ],
      });

      mantineRenderAdapter({
        ui: (
          <ExecutionPanelWidget
            quest={quest}
            sessionEntries={sessionEntries}
            workItemEntries={workItemEntries}
          />
        ),
      });

      const chainHeader = screen.getByTestId('SUBAGENT_CHAIN_HEADER');

      expect(chainHeader.textContent).toBe('▾ SUB-AGENT"Run tests" (3 entries)');

      const messages = proxy.getExecutionMessages();

      expect(messages.map((m) => m.textContent)).toStrictEqual(['SUB-AGENTnested line three']);
    });
  });

  describe('retry badge and duration', () => {
    it('VALID: {work item with attempt > 0} => shows retry badge in header', () => {
      ExecutionPanelWidgetProxy();
      const quest: Quest = QuestStub({
        status: 'in_progress',
        workItems: [
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000001',
            role: 'codeweaver',
            status: 'in_progress',
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

    it('VALID: {work item with startedAt and completedAt} => shows duration in header', () => {
      ExecutionPanelWidgetProxy();
      const quest: Quest = QuestStub({
        status: 'in_progress',
        workItems: [
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000001',
            role: 'codeweaver',
            status: 'complete',
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
      expect(onPause).toHaveBeenCalledWith();
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

      expect(onStatusChange).toHaveBeenCalledTimes(1);
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
      expect(onAbandon).toHaveBeenCalledWith();
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

  describe('pause/resume button visibility matrix', () => {
    type PauseResumeStatusKey = keyof typeof questStatusMetadataStatics.statuses;
    const ALL_QUEST_STATUSES = Object.keys(
      questStatusMetadataStatics.statuses,
    ) as PauseResumeStatusKey[];

    const PAUSE_VISIBLE_STATUSES = ALL_QUEST_STATUSES.filter(
      (s) => questStatusMetadataStatics.statuses[s].isAnyAgentRunning,
    ).map((status) => ({ status }));

    const RESUME_VISIBLE_STATUSES = ALL_QUEST_STATUSES.filter(
      (s) => questStatusMetadataStatics.statuses[s].isResumable,
    ).map((status) => ({ status }));

    const NEITHER_BUTTON_STATUSES = ALL_QUEST_STATUSES.filter(
      (s) =>
        !questStatusMetadataStatics.statuses[s].isAnyAgentRunning &&
        !questStatusMetadataStatics.statuses[s].isResumable,
    ).map((status) => ({ status }));

    describe('PAUSE button visible (agent-running statuses)', () => {
      it.each(PAUSE_VISIBLE_STATUSES)(
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
      it.each(RESUME_VISIBLE_STATUSES)(
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
      it.each(NEITHER_BUTTON_STATUSES)(
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
      it('VALID: {click PAUSE button on in_progress} => calls onPause once', async () => {
        const proxy = ExecutionPanelWidgetProxy();
        const quest: Quest = QuestStub({ status: 'in_progress' });
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

  describe('status banner', () => {
    type StatusKey = keyof typeof questStatusMetadataStatics.statuses;
    const PANEL_STATUSES = (
      Object.keys(questStatusMetadataStatics.statuses) as readonly StatusKey[]
    ).filter((s) => questStatusMetadataStatics.statuses[s].shouldRenderExecutionPanel);
    const BANNER_STATUSES = PANEL_STATUSES.filter(
      (s) => questStatusMetadataStatics.statuses[s].shouldRenderStatusBanner,
    );
    const NON_BANNER_STATUSES = PANEL_STATUSES.filter(
      (s) => !questStatusMetadataStatics.statuses[s].shouldRenderStatusBanner,
    );

    it.each(BANNER_STATUSES)(
      'VALID: {status: %s} => status banner visible with displayHeader text',
      (status) => {
        ExecutionPanelWidgetProxy();
        const quest: Quest = QuestStub({ status });

        mantineRenderAdapter({
          ui: <ExecutionPanelWidget quest={quest} />,
        });

        const banner = screen.getByTestId('execution-panel-status-banner');
        const { displayHeader } = questStatusMetadataStatics.statuses[status];

        expect(banner.textContent).toBe(displayHeader);
      },
    );

    it.each(BANNER_STATUSES)(
      'VALID: {status: %s} => status bar progress count suppressed when status banner renders',
      (status) => {
        ExecutionPanelWidgetProxy();
        const quest: Quest = QuestStub({ status });

        mantineRenderAdapter({
          ui: <ExecutionPanelWidget quest={quest} />,
        });

        expect(screen.queryByTestId('execution-status-bar-layer-widget')).toBe(null);
      },
    );

    it.each(NON_BANNER_STATUSES)('VALID: {status: %s} => status banner hidden', (status) => {
      ExecutionPanelWidgetProxy();
      const quest: Quest = QuestStub({ status });

      mantineRenderAdapter({
        ui: <ExecutionPanelWidget quest={quest} />,
      });

      expect(screen.queryByTestId('execution-panel-status-banner')).toBe(null);
    });

    it('VALID: {status: complete} => status banner uses success color (green)', () => {
      ExecutionPanelWidgetProxy();
      const quest: Quest = QuestStub({ status: 'complete' });

      mantineRenderAdapter({
        ui: <ExecutionPanelWidget quest={quest} />,
      });

      const banner = screen.getByTestId('execution-panel-status-banner');

      // emberDepthsThemeStatics.colors.success = '#4ade80' → rgb(74, 222, 128) in JSDOM
      expect(banner.style.color).toBe('rgb(74, 222, 128)');
    });

    it('VALID: {status: merged} => status banner uses success color (green)', () => {
      ExecutionPanelWidgetProxy();
      const quest: Quest = QuestStub({ status: 'merged' });

      mantineRenderAdapter({
        ui: <ExecutionPanelWidget quest={quest} />,
      });

      const banner = screen.getByTestId('execution-panel-status-banner');

      // emberDepthsThemeStatics.colors.success = '#4ade80' → rgb(74, 222, 128) in JSDOM
      expect(banner.style.color).toBe('rgb(74, 222, 128)');
    });

    it('VALID: {status: abandoned} => status banner uses danger color (red)', () => {
      ExecutionPanelWidgetProxy();
      const quest: Quest = QuestStub({ status: 'abandoned' });

      mantineRenderAdapter({
        ui: <ExecutionPanelWidget quest={quest} />,
      });

      const banner = screen.getByTestId('execution-panel-status-banner');

      // emberDepthsThemeStatics.colors.danger = '#ef4444' → rgb(239, 68, 68) in JSDOM
      expect(banner.style.color).toBe('rgb(239, 68, 68)');
    });
  });

  describe('/dumpster-launch banner', () => {
    it('VALID: {status: in_progress} => renders /dumpster-launch banner above the status bar', () => {
      const proxy = ExecutionPanelWidgetProxy();
      const quest: Quest = QuestStub({ status: 'in_progress' });

      mantineRenderAdapter({
        ui: <ExecutionPanelWidget quest={quest} />,
      });

      expect(proxy.hasDumpsterLaunchBanner()).toBe(true);
      expect(proxy.getDumpsterLaunchBannerCommand()).toBe('/dumpster-launch');
    });

    it('VALID: {status: approved} => renders /dumpster-launch banner (pre-execution but non-terminal)', () => {
      const proxy = ExecutionPanelWidgetProxy();
      const quest: Quest = QuestStub({ status: 'approved' });

      mantineRenderAdapter({
        ui: <ExecutionPanelWidget quest={quest} />,
      });

      expect(proxy.hasDumpsterLaunchBanner()).toBe(true);
      expect(proxy.getDumpsterLaunchBannerCommand()).toBe('/dumpster-launch');
    });

    it('VALID: {status: complete} => does NOT render /dumpster-launch banner (terminal)', () => {
      const proxy = ExecutionPanelWidgetProxy();
      const quest: Quest = QuestStub({ status: 'complete' });

      mantineRenderAdapter({
        ui: <ExecutionPanelWidget quest={quest} />,
      });

      expect(proxy.hasDumpsterLaunchBanner()).toBe(false);
    });

    it('VALID: {status: abandoned} => does NOT render /dumpster-launch banner (terminal)', () => {
      const proxy = ExecutionPanelWidgetProxy();
      const quest: Quest = QuestStub({ status: 'abandoned' });

      mantineRenderAdapter({
        ui: <ExecutionPanelWidget quest={quest} />,
      });

      expect(proxy.hasDumpsterLaunchBanner()).toBe(false);
    });

    it('VALID: {status: in_progress, QUEST SPEC tab} => does NOT render /dumpster-launch banner (banner lives under execution tab only)', async () => {
      const proxy = ExecutionPanelWidgetProxy();
      const quest: Quest = QuestStub({ status: 'in_progress' });

      mantineRenderAdapter({
        ui: <ExecutionPanelWidget quest={quest} />,
      });

      await proxy.clickTab({ tabId: 'spec' });

      expect(proxy.hasDumpsterLaunchBanner()).toBe(false);
    });
  });

  describe('FOLLOW-UP tab', () => {
    it('VALID: {press FOLLOW-UP} => tab bar holds FOLLOW-UP then EXECUTION then QUEST SPEC, with FOLLOW-UP active', async () => {
      const proxy = ExecutionPanelWidgetProxy();
      const quest: Quest = QuestStub({ status: 'blocked' });
      const onSendFollowupMessage = jest.fn(async (): Promise<void> => Promise.resolve());

      mantineRenderAdapter({
        ui: <ExecutionPanelWidget quest={quest} onSendFollowupMessage={onSendFollowupMessage} />,
      });

      await proxy.clickFollowupButton();

      expect(proxy.getTabLabels()).toStrictEqual(['FOLLOW-UP', 'EXECUTION', 'QUEST SPEC']);
      expect(proxy.hasFollowupChat()).toBe(true);
    });

    it('VALID: {followupEntries with an assistant text entry} => renders it under the TAVERNKEEPER label', async () => {
      const proxy = ExecutionPanelWidgetProxy();
      const quest: Quest = QuestStub({ status: 'blocked' });
      const onSendFollowupMessage = jest.fn(async (): Promise<void> => Promise.resolve());
      const entries = [
        AssistantTextChatEntryStub({
          uuid: '00000000-0000-4000-8000-0000000007b1',
          content: 'The failing test is in the checkout flow.',
        }),
      ];

      mantineRenderAdapter({
        ui: (
          <ExecutionPanelWidget
            quest={quest}
            onSendFollowupMessage={onSendFollowupMessage}
            followupEntries={entries}
          />
        ),
      });

      await proxy.clickFollowupButton();

      expect(proxy.getExecutionMessages().map((message) => message.textContent)).toStrictEqual([
        'TAVERNKEEPERThe failing test is in the checkout flow.',
      ]);
    });

    it('VALID: {press FOLLOW-UP then click EXECUTION} => FOLLOW-UP tab stays listed first while EXECUTION is active', async () => {
      const proxy = ExecutionPanelWidgetProxy();
      const quest: Quest = QuestStub({ status: 'blocked' });
      const onSendFollowupMessage = jest.fn(async (): Promise<void> => Promise.resolve());

      mantineRenderAdapter({
        ui: <ExecutionPanelWidget quest={quest} onSendFollowupMessage={onSendFollowupMessage} />,
      });

      await proxy.clickFollowupButton();
      await proxy.clickTab({ tabId: 'execution' });

      expect(proxy.getTabLabels()).toStrictEqual(['FOLLOW-UP', 'EXECUTION', 'QUEST SPEC']);
      expect(proxy.hasStatusBar()).toBe(true);
      expect(proxy.hasFollowupChat()).toBe(false);
    });

    it('VALID: {press FOLLOW-UP, switch to EXECUTION, press FOLLOW-UP again} => exactly one FOLLOW-UP tab exists and it is active', async () => {
      const proxy = ExecutionPanelWidgetProxy();
      const quest: Quest = QuestStub({ status: 'blocked' });
      const onSendFollowupMessage = jest.fn(async (): Promise<void> => Promise.resolve());

      mantineRenderAdapter({
        ui: <ExecutionPanelWidget quest={quest} onSendFollowupMessage={onSendFollowupMessage} />,
      });

      await proxy.clickFollowupButton();
      await proxy.clickTab({ tabId: 'execution' });
      await proxy.clickFollowupButton();

      expect(proxy.getTabLabels()).toStrictEqual(['FOLLOW-UP', 'EXECUTION', 'QUEST SPEC']);
      expect(proxy.hasFollowupChat()).toBe(true);
    });

    it('VALID: {FOLLOW-UP tab active} => mounts the same ChatPanelWidget the spec-phase chat uses, with its input and send button', async () => {
      const proxy = ExecutionPanelWidgetProxy();
      const quest: Quest = QuestStub({ status: 'blocked' });
      const onSendFollowupMessage = jest.fn(async (): Promise<void> => Promise.resolve());

      mantineRenderAdapter({
        ui: <ExecutionPanelWidget quest={quest} onSendFollowupMessage={onSendFollowupMessage} />,
      });

      await proxy.clickFollowupButton();

      expect(screen.getByTestId('CHAT_PANEL')).toBeInTheDocument();
      expect(screen.getByTestId('CHAT_INPUT')).toBeInTheDocument();
      expect(screen.getByTestId('SEND_BUTTON')).toBeInTheDocument();
    });

    it('VALID: {type message and click SEND on FOLLOW-UP tab} => calls onSendFollowupMessage with the typed text', async () => {
      const proxy = ExecutionPanelWidgetProxy();
      const quest: Quest = QuestStub({ status: 'blocked' });
      const onSendFollowupMessage = jest.fn(async (): Promise<void> => Promise.resolve());

      mantineRenderAdapter({
        ui: <ExecutionPanelWidget quest={quest} onSendFollowupMessage={onSendFollowupMessage} />,
      });

      await proxy.clickFollowupButton();
      await proxy.typeFollowupMessage({ text: 'Show me the diagram' });
      await proxy.clickFollowupSend();

      expect(onSendFollowupMessage).toHaveBeenCalledTimes(1);
      expect(onSendFollowupMessage).toHaveBeenCalledWith({ message: 'Show me the diagram' });
    });

    it('EDGE: {onSendFollowupMessage removed while FOLLOW-UP tab is active} => clamps back to EXECUTION without throwing', () => {
      const proxy = ExecutionPanelWidgetProxy();
      const quest: Quest = QuestStub({ status: 'blocked' });
      const onSendFollowupMessage = jest.fn(async (): Promise<void> => Promise.resolve());

      const { rerender } = mantineRenderAdapter({
        ui: <ExecutionPanelWidget quest={quest} onSendFollowupMessage={onSendFollowupMessage} />,
      });

      rerender(<ExecutionPanelWidget quest={quest} />);

      expect(proxy.getTabLabels()).toStrictEqual(['EXECUTION', 'QUEST SPEC']);
    });

    it('VALID: {quest moves blocked => merging with the FOLLOW-UP tab open} => the tab stays listed first and keeps its transcript', async () => {
      const proxy = ExecutionPanelWidgetProxy();
      const blockedQuest: Quest = QuestStub({ status: 'blocked' });
      const mergingQuest: Quest = QuestStub({ status: 'merging' });
      const onSendFollowupMessage = jest.fn(async (): Promise<void> => Promise.resolve());
      const entries = [
        AssistantTextChatEntryStub({
          uuid: '00000000-0000-4000-8000-0000000007a1',
          content: 'The quest branched off master.',
        }),
      ];

      const { rerender } = mantineRenderAdapter({
        ui: (
          <ExecutionPanelWidget
            quest={blockedQuest}
            onSendFollowupMessage={onSendFollowupMessage}
            followupEntries={entries}
          />
        ),
      });

      await proxy.clickFollowupButton();

      rerender(
        <ExecutionPanelWidget
          quest={mergingQuest}
          onSendFollowupMessage={onSendFollowupMessage}
          followupEntries={entries}
        />,
      );

      expect({
        tabs: proxy.getTabLabels(),
        followupChatMounted: proxy.hasFollowupChat(),
        postQuestBar: proxy.hasPostQuestBar(),
      }).toStrictEqual({
        tabs: ['FOLLOW-UP', 'EXECUTION', 'QUEST SPEC'],
        followupChatMounted: true,
        postQuestBar: false,
      });
    });
  });

  describe('post-quest action bar (FOLLOW-UP / merge)', () => {
    type PostQuestStatusKey = keyof typeof questStatusMetadataStatics.statuses;
    const ALL_STATUSES = Object.keys(
      questStatusMetadataStatics.statuses,
    ) as readonly PostQuestStatusKey[];

    const FOLLOWUP_VISIBLE_STATUSES = ALL_STATUSES.filter(
      (s) => questStatusMetadataStatics.statuses[s].isFollowupChatable,
    );
    const FOLLOWUP_HIDDEN_STATUSES = ALL_STATUSES.filter(
      (s) => !questStatusMetadataStatics.statuses[s].isFollowupChatable,
    );
    const MERGE_VISIBLE_STATUSES = ALL_STATUSES.filter(
      (s) => questStatusMetadataStatics.statuses[s].isMergeable,
    );
    const MERGE_HIDDEN_STATUSES = ALL_STATUSES.filter(
      (s) => !questStatusMetadataStatics.statuses[s].isMergeable,
    );

    describe('FOLLOW-UP segment visibility', () => {
      it.each(FOLLOWUP_VISIBLE_STATUSES)(
        'VALID: {status: %s} => FOLLOW-UP segment visible',
        (status) => {
          const proxy = ExecutionPanelWidgetProxy();
          const quest: Quest = QuestStub({ status });
          const onSendFollowupMessage = jest.fn(async (): Promise<void> => Promise.resolve());

          mantineRenderAdapter({
            ui: (
              <ExecutionPanelWidget quest={quest} onSendFollowupMessage={onSendFollowupMessage} />
            ),
          });

          expect(proxy.hasFollowupButton()).toBe(true);
        },
      );

      it.each(FOLLOWUP_HIDDEN_STATUSES)(
        'EMPTY: {status: %s} => FOLLOW-UP segment absent',
        (status) => {
          const proxy = ExecutionPanelWidgetProxy();
          const quest: Quest = QuestStub({ status });
          const onSendFollowupMessage = jest.fn(async (): Promise<void> => Promise.resolve());

          mantineRenderAdapter({
            ui: (
              <ExecutionPanelWidget quest={quest} onSendFollowupMessage={onSendFollowupMessage} />
            ),
          });

          expect(proxy.hasFollowupButton()).toBe(false);
        },
      );
    });

    describe('Teleport with Booty (Merge) segment visibility', () => {
      it.each(MERGE_VISIBLE_STATUSES)('VALID: {status: %s} => merge segment visible', (status) => {
        const proxy = ExecutionPanelWidgetProxy();
        const quest: Quest = QuestStub({ status });
        const onMerge = jest.fn();

        mantineRenderAdapter({
          ui: <ExecutionPanelWidget quest={quest} onMerge={onMerge} />,
        });

        expect(proxy.hasMergeButton()).toBe(true);
      });

      it.each(MERGE_HIDDEN_STATUSES)('EMPTY: {status: %s} => merge segment absent', (status) => {
        const proxy = ExecutionPanelWidgetProxy();
        const quest: Quest = QuestStub({ status });
        const onMerge = jest.fn();

        mantineRenderAdapter({
          ui: <ExecutionPanelWidget quest={quest} onMerge={onMerge} />,
        });

        expect(proxy.hasMergeButton()).toBe(false);
      });
    });

    it('VALID: {status: blocked, both handlers provided} => bar shows both segments with exact labels', () => {
      const proxy = ExecutionPanelWidgetProxy();
      const quest: Quest = QuestStub({ status: 'blocked' });
      const onSendFollowupMessage = jest.fn(async (): Promise<void> => Promise.resolve());
      const onMerge = jest.fn();

      mantineRenderAdapter({
        ui: (
          <ExecutionPanelWidget
            quest={quest}
            onSendFollowupMessage={onSendFollowupMessage}
            onMerge={onMerge}
          />
        ),
      });

      expect(proxy.hasPostQuestBar()).toBe(true);
      expect(proxy.hasFollowupButton()).toBe(true);
      expect(proxy.hasMergeButton()).toBe(true);
    });

    it('EMPTY: {status: in_progress, both handlers provided} => post-quest bar absent', () => {
      const proxy = ExecutionPanelWidgetProxy();
      const quest: Quest = QuestStub({ status: 'in_progress' });
      const onSendFollowupMessage = jest.fn(async (): Promise<void> => Promise.resolve());
      const onMerge = jest.fn();

      mantineRenderAdapter({
        ui: (
          <ExecutionPanelWidget
            quest={quest}
            onSendFollowupMessage={onSendFollowupMessage}
            onMerge={onMerge}
          />
        ),
      });

      expect(proxy.hasPostQuestBar()).toBe(false);
    });

    it('EMPTY: {status: merging, both handlers provided} => post-quest bar absent', () => {
      const proxy = ExecutionPanelWidgetProxy();
      const quest: Quest = QuestStub({ status: 'merging' });
      const onSendFollowupMessage = jest.fn(async (): Promise<void> => Promise.resolve());
      const onMerge = jest.fn();

      mantineRenderAdapter({
        ui: (
          <ExecutionPanelWidget
            quest={quest}
            onSendFollowupMessage={onSendFollowupMessage}
            onMerge={onMerge}
          />
        ),
      });

      expect(proxy.hasPostQuestBar()).toBe(false);
    });

    it('VALID: {status: merged, both handlers provided} => FOLLOW-UP present and enabled, merge segment absent so an already-merged quest cannot be merged again', () => {
      const proxy = ExecutionPanelWidgetProxy();
      const quest: Quest = QuestStub({ status: 'merged' });
      const onSendFollowupMessage = jest.fn(async (): Promise<void> => Promise.resolve());
      const onMerge = jest.fn();

      mantineRenderAdapter({
        ui: (
          <ExecutionPanelWidget
            quest={quest}
            onSendFollowupMessage={onSendFollowupMessage}
            onMerge={onMerge}
          />
        ),
      });

      expect(proxy.hasFollowupButton()).toBe(true);
      expect(proxy.hasMergeButton()).toBe(false);
    });

    it('EMPTY: {no handlers provided on a blocked quest} => post-quest bar absent', () => {
      const proxy = ExecutionPanelWidgetProxy();
      const quest: Quest = QuestStub({ status: 'blocked' });

      mantineRenderAdapter({
        ui: <ExecutionPanelWidget quest={quest} />,
      });

      expect(proxy.hasPostQuestBar()).toBe(false);
    });

    it('VALID: {click Teleport with Booty (Merge)} => calls onMerge', async () => {
      const proxy = ExecutionPanelWidgetProxy();
      const quest: Quest = QuestStub({ status: 'complete' });
      const onMerge = jest.fn();

      mantineRenderAdapter({
        ui: <ExecutionPanelWidget quest={quest} onMerge={onMerge} />,
      });

      await proxy.clickMergeButton();

      expect(onMerge).toHaveBeenCalledTimes(1);
      expect(onMerge).toHaveBeenCalledWith();
    });
  });

  describe('scroll container floor', () => {
    it('VALID: {quest} => floor content carries a pixel minHeight so it cannot be squeezed to nothing', () => {
      ExecutionPanelWidgetProxy();
      const quest: Quest = QuestStub({ status: 'in_progress' });

      mantineRenderAdapter({
        ui: <ExecutionPanelWidget quest={quest} />,
      });

      const floor = screen.getByTestId('execution-panel-floor-content');

      expect(floor.style.minHeight).toBe('160px');
    });
  });

  describe('warpgate row', () => {
    it('VALID: {merging quest with a warpgate work item} => role badge reads [WARPGATE]', () => {
      const proxy = ExecutionPanelWidgetProxy();
      const quest: Quest = QuestStub({
        status: 'merging',
        workItems: [
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000001',
            role: 'warpgate',
            status: 'in_progress',
          }),
        ],
      });

      mantineRenderAdapter({
        ui: <ExecutionPanelWidget quest={quest} />,
      });

      expect(proxy.getRoleBadges()).toStrictEqual(['[WARPGATE]']);
    });

    it('VALID: {status: merging} => PAUSE QUEST button rendered, RESUME QUEST button absent', () => {
      const proxy = ExecutionPanelWidgetProxy();
      const quest: Quest = QuestStub({ status: 'merging' });
      const onPause = jest.fn();
      const onStatusChange = jest.fn();

      mantineRenderAdapter({
        ui: (
          <ExecutionPanelWidget quest={quest} onPause={onPause} onStatusChange={onStatusChange} />
        ),
      });

      expect(proxy.hasPauseButton()).toBe(true);
      expect(proxy.hasResumeButton()).toBe(false);
    });
  });
});
