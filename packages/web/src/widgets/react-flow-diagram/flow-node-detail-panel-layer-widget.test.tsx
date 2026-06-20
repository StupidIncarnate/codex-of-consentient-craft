import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import {
  FlowNodeIdStub,
  FlowNodeStub,
  FlowObservableStub,
  QuestContractEntryStub,
} from '@dungeonmaster/shared/contracts';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { FlowNodeDetailPanelLayerWidget } from './flow-node-detail-panel-layer-widget';
import { FlowNodeDetailPanelLayerWidgetProxy } from './flow-node-detail-panel-layer-widget.proxy';

describe('FlowNodeDetailPanelLayerWidget', () => {
  describe('panel structure', () => {
    it('VALID: {node with label} => renders FLOW_NODE_DETAIL_PANEL with heading', () => {
      const proxy = FlowNodeDetailPanelLayerWidgetProxy();
      const node = FlowNodeStub({
        id: FlowNodeIdStub({ value: 'login-page' }),
        label: 'Login Page',
        observables: [],
      });
      const onClose = jest.fn();

      mantineRenderAdapter({
        ui: <FlowNodeDetailPanelLayerWidget node={node} contracts={[]} onClose={onClose} />,
      });

      expect(proxy.getPanel()).toBeInTheDocument();
      expect(proxy.getHeading()?.textContent).toBe('Login Page');
    });

    it('EMPTY: {no observables, no contracts} => shows empty message', () => {
      const proxy = FlowNodeDetailPanelLayerWidgetProxy();
      const node = FlowNodeStub({ id: FlowNodeIdStub({ value: 'login-page' }), observables: [] });
      const onClose = jest.fn();

      mantineRenderAdapter({
        ui: <FlowNodeDetailPanelLayerWidget node={node} contracts={[]} onClose={onClose} />,
      });

      expect(proxy.getEmpty()?.textContent).toBe('No observables or contracts for this node');
    });
  });

  describe('observables', () => {
    it('VALID: {node with observables} => shows observable type and description', () => {
      const proxy = FlowNodeDetailPanelLayerWidgetProxy();
      const observable = FlowObservableStub({
        type: 'ui-state',
        description: 'redirects to dashboard',
      });
      const node = FlowNodeStub({
        id: FlowNodeIdStub({ value: 'login-page' }),
        observables: [observable],
      });
      const onClose = jest.fn();

      mantineRenderAdapter({
        ui: <FlowNodeDetailPanelLayerWidget node={node} contracts={[]} onClose={onClose} />,
      });

      expect(proxy.getEmpty()).toBe(null);

      const rows = proxy.getObservableRows();

      expect(rows?.length).toBe(1);

      const typeTag = screen.getByTestId('FLOW_DETAIL_PANEL_OBSERVABLE_TYPE');

      expect(typeTag.textContent).toBe('ui-state');

      const desc = screen.getByTestId('FLOW_DETAIL_PANEL_OBSERVABLE_DESCRIPTION');

      expect(desc.textContent).toBe('redirects to dashboard');
    });
  });

  describe('contracts', () => {
    it('VALID: {matching contract} => shows contract name and properties', () => {
      const proxy = FlowNodeDetailPanelLayerWidgetProxy();
      const nodeId = FlowNodeIdStub({ value: 'login-page' });
      const node = FlowNodeStub({ id: nodeId, observables: [] });
      const contract = QuestContractEntryStub({
        nodeId,
        name: 'LoginCredentials',
        properties: [
          { name: 'email', type: 'EmailAddress', description: 'User email' },
          { name: 'password', type: 'Password', description: 'User password' },
        ],
      });
      const onClose = jest.fn();

      mantineRenderAdapter({
        ui: <FlowNodeDetailPanelLayerWidget node={node} contracts={[contract]} onClose={onClose} />,
      });

      expect(proxy.getEmpty()).toBe(null);

      const entries = proxy.getContractEntries();

      expect(entries?.length).toBe(1);
      expect(screen.getByTestId('FLOW_DETAIL_PANEL_CONTRACT_NAME').textContent).toBe(
        'LoginCredentials',
      );

      const props = screen.getAllByTestId('FLOW_DETAIL_PANEL_CONTRACT_PROPERTY');

      expect(props[0]?.textContent).toBe('email: EmailAddress');
      expect(props[1]?.textContent).toBe('password: Password');
    });

    it('VALID: {non-matching contract} => does not show contract', () => {
      const proxy = FlowNodeDetailPanelLayerWidgetProxy();
      const nodeId = FlowNodeIdStub({ value: 'login-page' });
      const otherNodeId = FlowNodeIdStub({ value: 'dashboard-page' });
      const node = FlowNodeStub({ id: nodeId, observables: [] });
      const contract = QuestContractEntryStub({
        nodeId: otherNodeId,
        name: 'DashboardData',
      });
      const onClose = jest.fn();

      mantineRenderAdapter({
        ui: <FlowNodeDetailPanelLayerWidget node={node} contracts={[contract]} onClose={onClose} />,
      });

      expect(proxy.getEmpty()?.textContent).toBe('No observables or contracts for this node');
    });
  });

  describe('close button', () => {
    it('VALID: {close button clicked} => calls onClose', async () => {
      const user = userEvent.setup();
      FlowNodeDetailPanelLayerWidgetProxy();
      const node = FlowNodeStub({ id: FlowNodeIdStub({ value: 'login-page' }), observables: [] });
      const onClose = jest.fn();

      mantineRenderAdapter({
        ui: <FlowNodeDetailPanelLayerWidget node={node} contracts={[]} onClose={onClose} />,
      });

      await user.click(screen.getByTestId('FLOW_DETAIL_PANEL_CLOSE'));

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });
});
