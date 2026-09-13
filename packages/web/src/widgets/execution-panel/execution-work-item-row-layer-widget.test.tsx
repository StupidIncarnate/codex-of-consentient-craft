import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import {
  AssistantTextChatEntryStub,
  OperationItemStub,
  QuestIdStub,
  QuestWorkItemIdStub,
  RiftcarverResultStub,
  SessionIdStub,
  WardResultStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { RowOrderStub } from '../../contracts/row-order/row-order.stub';
import { userEventStatics } from '../../statics/user-event/user-event-statics';
import { ExecutionWorkItemRowLayerWidget } from './execution-work-item-row-layer-widget';
import { ExecutionWorkItemRowLayerWidgetProxy } from './execution-work-item-row-layer-widget.proxy';

type WorkItem = ReturnType<typeof WorkItemStub>;

const WORK_ITEM_ID = 'a0000000-0000-0000-0000-000000000001';
const OTHER_WORK_ITEM_ID = 'a0000000-0000-0000-0000-000000000002';
const OPERATION_ID = 'b0000000-0000-0000-0000-000000000001';
const WARD_RESULT_ID = 'c0000000-0000-0000-0000-000000000001';
const RIFTCARVER_RESULT_ID = 'd0000000-0000-0000-0000-000000000001';

const defaultParams = ({ workItem }: { workItem: WorkItem }) => ({
  order: RowOrderStub({ value: 1 }),
  workItem,
  questId: QuestIdStub(),
  includeSkipped: false,
  workItemEntries: new Map(),
  sessionEntries: new Map(),
  workItemIdToLabel: new Map(),
  wardResultsById: new Map(),
  riftcarverResultsById: new Map(),
  operationsById: new Map(),
});

describe('ExecutionWorkItemRowLayerWidget', () => {
  describe('name derivation', () => {
    it('VALID: {relatedDataItems ref resolves via operationsById} => row name is the operation text', () => {
      ExecutionWorkItemRowLayerWidgetProxy();
      const workItem = WorkItemStub({
        id: WORK_ITEM_ID,
        role: 'codeweaver',
        status: 'complete',
        relatedDataItems: [`operations/${OPERATION_ID}`],
      });
      const operation = OperationItemStub({ id: OPERATION_ID, text: 'build the broker' });

      mantineRenderAdapter({
        ui: (
          <ExecutionWorkItemRowLayerWidget
            {...defaultParams({ workItem })}
            operationsById={new Map([[operation.id, operation]])}
          />
        ),
      });

      expect(screen.getByTestId('execution-row-layer-widget').textContent).toBe(
        '▸01[CODEWEAVER]build the brokerDONE',
      );
    });

    it('EDGE: {relatedDataItems ref does not resolve to any operationsById entry} => falls back to capitalized role', () => {
      ExecutionWorkItemRowLayerWidgetProxy();
      const workItem = WorkItemStub({
        id: WORK_ITEM_ID,
        role: 'codeweaver',
        status: 'complete',
        relatedDataItems: [`operations/${OPERATION_ID}`],
      });

      mantineRenderAdapter({
        ui: <ExecutionWorkItemRowLayerWidget {...defaultParams({ workItem })} />,
      });

      expect(screen.getByTestId('execution-row-layer-widget').textContent).toBe(
        '▸01[CODEWEAVER]CodeweaverDONE',
      );
    });
  });

  describe('dependsOn labels', () => {
    it('VALID: {dependsOn id present in workItemIdToLabel} => subtitle shows the resolved role label', () => {
      ExecutionWorkItemRowLayerWidgetProxy();
      const workItem = WorkItemStub({
        id: OTHER_WORK_ITEM_ID,
        role: 'codeweaver',
        status: 'pending',
        dependsOn: [WORK_ITEM_ID],
      });

      mantineRenderAdapter({
        ui: (
          <ExecutionWorkItemRowLayerWidget
            {...defaultParams({ workItem })}
            workItemIdToLabel={
              new Map([[QuestWorkItemIdStub({ value: WORK_ITEM_ID }), 'chaoswhisperer']])
            }
          />
        ),
      });

      expect(screen.getByTestId('execution-row-subtitle').textContent).toBe(
        '└─ depends on: chaoswhisperer',
      );
    });

    it('EDGE: {dependsOn id absent from workItemIdToLabel} => subtitle falls back to the raw id', () => {
      ExecutionWorkItemRowLayerWidgetProxy();
      const workItem = WorkItemStub({
        id: OTHER_WORK_ITEM_ID,
        role: 'codeweaver',
        status: 'pending',
        dependsOn: [WORK_ITEM_ID],
      });

      mantineRenderAdapter({
        ui: <ExecutionWorkItemRowLayerWidget {...defaultParams({ workItem })} />,
      });

      expect(screen.getByTestId('execution-row-subtitle').textContent).toBe(
        `└─ depends on: ${WORK_ITEM_ID}`,
      );
    });
  });

  describe('ward results', () => {
    it('VALID: {relatedDataItems carries a wardResults ref matching wardResultsById} => expanded row shows the ward exit code', async () => {
      ExecutionWorkItemRowLayerWidgetProxy();
      const workItem = WorkItemStub({
        id: WORK_ITEM_ID,
        role: 'ward',
        status: 'failed',
        relatedDataItems: [`wardResults/${WARD_RESULT_ID}`],
      });
      const wardResult = WardResultStub({ id: WARD_RESULT_ID, exitCode: 1 as never });

      mantineRenderAdapter({
        ui: (
          <ExecutionWorkItemRowLayerWidget
            {...defaultParams({ workItem })}
            wardResultsById={new Map([[wardResult.id, wardResult]])}
          />
        ),
      });

      await userEvent.click(screen.getByTestId('execution-row-header'), userEventStatics.options);

      expect(screen.getByTestId('execution-row-ward-result').textContent).toBe('Ward exit code: 1');
    });

    it('EMPTY: {wardResults ref does not resolve in wardResultsById} => renders no ward result element', async () => {
      ExecutionWorkItemRowLayerWidgetProxy();
      const workItem = WorkItemStub({
        id: WORK_ITEM_ID,
        role: 'ward',
        status: 'failed',
        relatedDataItems: [`wardResults/${WARD_RESULT_ID}`],
      });

      mantineRenderAdapter({
        ui: <ExecutionWorkItemRowLayerWidget {...defaultParams({ workItem })} />,
      });

      await userEvent.click(screen.getByTestId('execution-row-header'), userEventStatics.options);

      expect(screen.queryByTestId('execution-row-ward-result')).toBe(null);
    });
  });

  describe('riftcarver results', () => {
    it('VALID: {relatedDataItems carries a riftcarverResults ref matching riftcarverResultsById} => expanded row shows the riftcarver exit code', async () => {
      ExecutionWorkItemRowLayerWidgetProxy();
      const workItem = WorkItemStub({
        id: WORK_ITEM_ID,
        role: 'riftcarver',
        status: 'failed',
        relatedDataItems: [`riftcarverResults/${RIFTCARVER_RESULT_ID}`],
      });
      const riftcarverResult = RiftcarverResultStub({
        id: RIFTCARVER_RESULT_ID,
        exitCode: 1 as never,
        outcome: 'repairable',
      });

      mantineRenderAdapter({
        ui: (
          <ExecutionWorkItemRowLayerWidget
            {...defaultParams({ workItem })}
            riftcarverResultsById={new Map([[riftcarverResult.id, riftcarverResult]])}
          />
        ),
      });

      await userEvent.click(screen.getByTestId('execution-row-header'), userEventStatics.options);

      expect(screen.getByTestId('execution-row-riftcarver-result').textContent).toBe(
        'Riftcarver exit code: 1 (repairable)',
      );
    });

    it('EDGE: {riftcarverResults ref slice does not parse as a valid id} => renders no riftcarver result element', async () => {
      ExecutionWorkItemRowLayerWidgetProxy();
      const workItem = WorkItemStub({
        id: WORK_ITEM_ID,
        role: 'riftcarver',
        status: 'failed',
        relatedDataItems: ['riftcarverResults/not-a-uuid'],
      });

      mantineRenderAdapter({
        ui: <ExecutionWorkItemRowLayerWidget {...defaultParams({ workItem })} />,
      });

      await userEvent.click(screen.getByTestId('execution-row-header'), userEventStatics.options);

      expect(screen.queryByTestId('execution-row-riftcarver-result')).toBe(null);
    });
  });

  describe('ad-hoc detection', () => {
    it('VALID: {workItem.insertedBy set} => renders AD-HOC tag', () => {
      ExecutionWorkItemRowLayerWidgetProxy();
      const workItem = WorkItemStub({
        id: WORK_ITEM_ID,
        role: 'spiritmender',
        status: 'in_progress',
        insertedBy: QuestWorkItemIdStub({ value: OTHER_WORK_ITEM_ID }),
      });

      mantineRenderAdapter({
        ui: <ExecutionWorkItemRowLayerWidget {...defaultParams({ workItem })} />,
      });

      expect(screen.getByTestId('execution-row-adhoc-tag').textContent).toBe('AD-HOC');
    });

    it('EMPTY: {workItem.insertedBy absent} => renders no AD-HOC tag', () => {
      ExecutionWorkItemRowLayerWidgetProxy();
      const workItem = WorkItemStub({
        id: WORK_ITEM_ID,
        role: 'codeweaver',
        status: 'in_progress',
      });

      mantineRenderAdapter({
        ui: <ExecutionWorkItemRowLayerWidget {...defaultParams({ workItem })} />,
      });

      expect(screen.queryByTestId('execution-row-adhoc-tag')).toBe(null);
    });
  });

  describe('includeSkipped auto-expand', () => {
    it('VALID: {includeSkipped: true, skipped status with entries} => row is expanded on first render', () => {
      ExecutionWorkItemRowLayerWidgetProxy();
      const workItemId = QuestWorkItemIdStub({ value: WORK_ITEM_ID });
      const workItem = WorkItemStub({
        id: workItemId,
        role: 'chaoswhisperer',
        status: 'skipped',
      });
      const entry = AssistantTextChatEntryStub({ content: 'Capturing the spec...' });

      mantineRenderAdapter({
        ui: (
          <ExecutionWorkItemRowLayerWidget
            {...defaultParams({ workItem })}
            includeSkipped={true}
            workItemEntries={new Map([[workItemId, [entry]]])}
          />
        ),
      });

      expect(screen.getByTestId('execution-row-expanded')).toBeInTheDocument();
    });

    it('EMPTY: {includeSkipped: false, pending status, no entries} => row stays collapsed', () => {
      ExecutionWorkItemRowLayerWidgetProxy();
      const workItem = WorkItemStub({
        id: WORK_ITEM_ID,
        role: 'codeweaver',
        status: 'pending',
      });

      mantineRenderAdapter({
        ui: <ExecutionWorkItemRowLayerWidget {...defaultParams({ workItem })} />,
      });

      expect(screen.queryByTestId('execution-row-expanded')).toBe(null);
    });
  });

  describe('entries derivation', () => {
    it('VALID: {workItemEntries carries an entry for this work item id} => renders it', () => {
      ExecutionWorkItemRowLayerWidgetProxy();
      const workItemId = QuestWorkItemIdStub({ value: WORK_ITEM_ID });
      const workItem = WorkItemStub({
        id: workItemId,
        role: 'codeweaver',
        status: 'in_progress',
      });
      const entry = AssistantTextChatEntryStub({ content: 'Writing auth-login-broker.ts' });

      mantineRenderAdapter({
        ui: (
          <ExecutionWorkItemRowLayerWidget
            {...defaultParams({ workItem })}
            workItemEntries={new Map([[workItemId, [entry]]])}
          />
        ),
      });

      expect(screen.getByTestId('CHAT_MESSAGE').textContent).toBe(
        'CODEWEAVERWriting auth-login-broker.ts',
      );
    });

    it('VALID: {no workItemEntries bucket, sessionId matches sessionEntries} => falls back to the session pool', () => {
      ExecutionWorkItemRowLayerWidgetProxy();
      const sessionId = SessionIdStub({ value: '91c4944d-55e3-4231-bd48-140245f11867' });
      // in_progress + hasEntries is what auto-expands the row so the entry is on screen without a
      // click — this test is about entries DERIVATION, not the expand/collapse behaviour that
      // execution-row-layer-widget.test.tsx already covers.
      const workItem = WorkItemStub({
        id: WORK_ITEM_ID,
        role: 'chaoswhisperer',
        status: 'in_progress',
        sessionId,
      });
      const entry = AssistantTextChatEntryStub({ content: 'Exploring codebase...' });

      mantineRenderAdapter({
        ui: (
          <ExecutionWorkItemRowLayerWidget
            {...defaultParams({ workItem })}
            sessionEntries={new Map([[sessionId, [entry]]])}
          />
        ),
      });

      expect(screen.getByTestId('CHAT_MESSAGE').textContent).toBe(
        'CHAOSWHISPERERExploring codebase...',
      );
    });
  });
});
