import { screen } from '@testing-library/react';

import { FlowStub, OperationItemStub } from '@dungeonmaster/shared/contracts';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { OperationRowLayerWidget } from './operation-row-layer-widget';
import { OperationRowLayerWidgetProxy } from './operation-row-layer-widget.proxy';

describe('OperationRowLayerWidget', () => {
  describe('status markers', () => {
    it('VALID: {status: complete} => renders "[x]" marker', () => {
      OperationRowLayerWidgetProxy();
      const operation = OperationItemStub({ status: 'complete' });

      mantineRenderAdapter({
        ui: <OperationRowLayerWidget operation={operation} flows={[]} />,
      });

      expect(screen.getByTestId('OPERATIONS_LEDGER_ROW_MARKER').textContent).toBe('[x]');
    });

    it('VALID: {status: in_progress} => renders "[>]" marker', () => {
      OperationRowLayerWidgetProxy();
      const operation = OperationItemStub({ status: 'in_progress' });

      mantineRenderAdapter({
        ui: <OperationRowLayerWidget operation={operation} flows={[]} />,
      });

      expect(screen.getByTestId('OPERATIONS_LEDGER_ROW_MARKER').textContent).toBe('[>]');
    });

    it('VALID: {status: pending} => renders "[ ]" marker', () => {
      OperationRowLayerWidgetProxy();
      const operation = OperationItemStub({ status: 'pending' });

      mantineRenderAdapter({
        ui: <OperationRowLayerWidget operation={operation} flows={[]} />,
      });

      expect(screen.getByTestId('OPERATIONS_LEDGER_ROW_MARKER').textContent).toBe('[ ]');
    });
  });

  describe('role badge', () => {
    it('VALID: {role: codeweaver} => renders uppercase role badge', () => {
      OperationRowLayerWidgetProxy();
      const operation = OperationItemStub({ role: 'codeweaver', text: 'build the broker' });

      mantineRenderAdapter({
        ui: <OperationRowLayerWidget operation={operation} flows={[]} />,
      });

      expect(screen.getByTestId('OPERATIONS_LEDGER_ROW_ROLE').textContent).toBe('[CODEWEAVER]');
    });
  });

  describe('flow labels', () => {
    it('VALID: {one flowId} => names that flow on the row', () => {
      OperationRowLayerWidgetProxy();
      const operation = OperationItemStub({
        role: 'flowrider',
        text: 'Flowrider: author the flow-perspective test suite — flow: send-comment',
        flowIds: ['send-comment'],
      });
      const flows = [FlowStub({ id: 'send-comment', name: 'Send queued comment batch' })];

      mantineRenderAdapter({
        ui: <OperationRowLayerWidget operation={operation} flows={flows} />,
      });

      expect(screen.getByTestId('OPERATIONS_LEDGER_ROW_FLOWS').textContent).toBe(
        '[Send queued comment batch]',
      );
    });

    it('VALID: {two flowIds} => names both flows comma-separated in item order', () => {
      OperationRowLayerWidgetProxy();
      const operation = OperationItemStub({
        role: 'codeweaver',
        text: 'web: the queue bar and send',
        flowIds: ['view-comments', 'send-comment'],
      });
      const flows = [
        FlowStub({ id: 'send-comment', name: 'Send queued comment batch' }),
        FlowStub({ id: 'view-comments', name: 'View persisted comments' }),
      ];

      mantineRenderAdapter({
        ui: <OperationRowLayerWidget operation={operation} flows={flows} />,
      });

      expect(screen.getByTestId('OPERATIONS_LEDGER_ROW_FLOWS').textContent).toBe(
        '[View persisted comments, Send queued comment batch]',
      );
    });

    it('EDGE: {flowId no longer on the quest} => shows the raw id so the drift is visible', () => {
      OperationRowLayerWidgetProxy();
      const operation = OperationItemStub({
        role: 'siegemaster',
        text: 'Siegemaster: manual-QA the flow — flow: deleted-flow',
        flowIds: ['deleted-flow'],
      });
      const flows = [FlowStub({ id: 'send-comment', name: 'Send queued comment batch' })];

      mantineRenderAdapter({
        ui: <OperationRowLayerWidget operation={operation} flows={flows} />,
      });

      expect(screen.getByTestId('OPERATIONS_LEDGER_ROW_FLOWS').textContent).toBe('[deleted-flow]');
    });

    it('EMPTY: {no flowIds} => does not render the flows element', () => {
      OperationRowLayerWidgetProxy();
      const operation = OperationItemStub({
        role: 'warpgate',
        text: 'Warpgate: merge the quest branch home',
      });
      const flows = [FlowStub({ id: 'send-comment', name: 'Send queued comment batch' })];

      mantineRenderAdapter({
        ui: <OperationRowLayerWidget operation={operation} flows={flows} />,
      });

      expect(screen.queryByTestId('OPERATIONS_LEDGER_ROW_FLOWS')).toBe(null);
    });
  });

  describe('row content', () => {
    it('VALID: {complete ward item} => full row text combines marker, role, and text', () => {
      OperationRowLayerWidgetProxy();
      const operation = OperationItemStub({
        role: 'ward',
        text: 'verify: ward',
        status: 'complete',
      });

      mantineRenderAdapter({
        ui: <OperationRowLayerWidget operation={operation} flows={[]} />,
      });

      expect(screen.getByTestId('OPERATIONS_LEDGER_ROW').textContent).toBe('[x][WARD]verify: ward');
    });

    it('VALID: {per-flow flowrider item} => full row text puts the flow name BEFORE the description', () => {
      OperationRowLayerWidgetProxy();
      const operation = OperationItemStub({
        role: 'flowrider',
        text: 'Flowrider: author the flow-perspective test suite — flow: send-comment',
        status: 'in_progress',
        flowIds: ['send-comment'],
      });
      const flows = [FlowStub({ id: 'send-comment', name: 'Send queued comment batch' })];

      mantineRenderAdapter({
        ui: <OperationRowLayerWidget operation={operation} flows={flows} />,
      });

      expect(screen.getByTestId('OPERATIONS_LEDGER_ROW').textContent).toBe(
        '[>][FLOWRIDER][Send queued comment batch]Flowrider: author the flow-perspective test suite — flow: send-comment',
      );
    });
  });
});
