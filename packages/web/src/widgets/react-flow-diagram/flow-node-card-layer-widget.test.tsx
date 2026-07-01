import { screen } from '@testing-library/react';

import { FlowNodeIdStub } from '@dungeonmaster/shared/contracts';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { ContractCountStub } from '../../contracts/contract-count/contract-count.stub';
import { ReactFlowNodeDataStub } from '../../contracts/react-flow-node-data/react-flow-node-data.stub';
import { flowNodeStyleStatics } from '../../statics/flow-node-style/flow-node-style-statics';
import { FlowNodeCardLayerWidget } from './flow-node-card-layer-widget';
import { FlowNodeCardLayerWidgetProxy } from './flow-node-card-layer-widget.proxy';

describe('FlowNodeCardLayerWidget', () => {
  describe('node card rendering', () => {
    it('VALID: {state node} => renders FLOW_NODE with FLOW_NODE_TYPE_ICON and FLOW_NODE_LABEL', () => {
      FlowNodeCardLayerWidgetProxy();
      const data = ReactFlowNodeDataStub({
        nodeId: FlowNodeIdStub({ value: 'login-page' }),
        label: 'Login Page',
        nodeType: 'state',
        contractCount: ContractCountStub({ value: 0 }),
      });

      mantineRenderAdapter({
        ui: <FlowNodeCardLayerWidget id={data.nodeId} data={data} selected={false} type="state" />,
      });

      expect(screen.getByTestId('FLOW_NODE')).toBeInTheDocument();
      expect(screen.getByTestId('FLOW_NODE_TYPE_ICON')).toBeInTheDocument();
      expect(screen.getByTestId('FLOW_NODE_LABEL').textContent).toBe('Login Page');
    });
  });

  describe('accent color by type', () => {
    it('VALID: {decision node} => accent color is #f5a623', () => {
      FlowNodeCardLayerWidgetProxy();
      const data = ReactFlowNodeDataStub({
        nodeId: FlowNodeIdStub({ value: 'branch-node' }),
        label: 'Branch',
        nodeType: 'decision',
        contractCount: ContractCountStub({ value: 0 }),
      });

      mantineRenderAdapter({
        ui: (
          <FlowNodeCardLayerWidget id={data.nodeId} data={data} selected={false} type="decision" />
        ),
      });

      const card = screen.getByTestId('FLOW_NODE');

      expect(card.getAttribute('data-accent-color')).toBe(flowNodeStyleStatics.accent.decision);
    });

    it('VALID: {action node} => accent color is #4aa3df', () => {
      FlowNodeCardLayerWidgetProxy();
      const data = ReactFlowNodeDataStub({
        nodeId: FlowNodeIdStub({ value: 'fetch-node' }),
        label: 'Fetch Data',
        nodeType: 'action',
        contractCount: ContractCountStub({ value: 0 }),
      });

      mantineRenderAdapter({
        ui: <FlowNodeCardLayerWidget id={data.nodeId} data={data} selected={false} type="action" />,
      });

      const card = screen.getByTestId('FLOW_NODE');

      expect(card.getAttribute('data-accent-color')).toBe(flowNodeStyleStatics.accent.action);
    });

    it('VALID: {state node} => accent color is #8b9bb4', () => {
      FlowNodeCardLayerWidgetProxy();
      const data = ReactFlowNodeDataStub({
        nodeId: FlowNodeIdStub({ value: 'state-node' }),
        label: 'State Node',
        nodeType: 'state',
        contractCount: ContractCountStub({ value: 0 }),
      });

      mantineRenderAdapter({
        ui: <FlowNodeCardLayerWidget id={data.nodeId} data={data} selected={false} type="state" />,
      });

      const card = screen.getByTestId('FLOW_NODE');

      expect(card.getAttribute('data-accent-color')).toBe(flowNodeStyleStatics.accent.state);
    });

    it('VALID: {terminal node} => accent color is #5bbf8a', () => {
      FlowNodeCardLayerWidgetProxy();
      const data = ReactFlowNodeDataStub({
        nodeId: FlowNodeIdStub({ value: 'end-node' }),
        label: 'End',
        nodeType: 'terminal',
        contractCount: ContractCountStub({ value: 0 }),
      });

      mantineRenderAdapter({
        ui: (
          <FlowNodeCardLayerWidget id={data.nodeId} data={data} selected={false} type="terminal" />
        ),
      });

      const card = screen.getByTestId('FLOW_NODE');

      expect(card.getAttribute('data-accent-color')).toBe(flowNodeStyleStatics.accent.terminal);
    });
  });

  describe('contract badge', () => {
    it('VALID: {contractCount > 0} => shows FLOW_NODE_BADGE with count', () => {
      FlowNodeCardLayerWidgetProxy();
      const data = ReactFlowNodeDataStub({
        nodeId: FlowNodeIdStub({ value: 'login-page' }),
        label: 'Login Page',
        nodeType: 'state',
        contractCount: ContractCountStub({ value: 3 }),
      });

      mantineRenderAdapter({
        ui: <FlowNodeCardLayerWidget id={data.nodeId} data={data} selected={false} type="state" />,
      });

      expect(screen.getByTestId('FLOW_NODE_BADGE').textContent).toBe('3');
    });

    it('EMPTY: {contractCount === 0} => no FLOW_NODE_BADGE', () => {
      FlowNodeCardLayerWidgetProxy();
      const data = ReactFlowNodeDataStub({
        nodeId: FlowNodeIdStub({ value: 'login-page' }),
        label: 'Login Page',
        nodeType: 'state',
        contractCount: ContractCountStub({ value: 0 }),
      });

      mantineRenderAdapter({
        ui: <FlowNodeCardLayerWidget id={data.nodeId} data={data} selected={false} type="state" />,
      });

      expect(screen.queryByTestId('FLOW_NODE_BADGE')).toBe(null);
    });
  });

  describe('selection state', () => {
    it('VALID: {selected: true} => data-selected="true" on FLOW_NODE', () => {
      FlowNodeCardLayerWidgetProxy();
      const data = ReactFlowNodeDataStub({
        nodeId: FlowNodeIdStub({ value: 'login-page' }),
        label: 'Login Page',
        nodeType: 'state',
        contractCount: ContractCountStub({ value: 0 }),
      });

      mantineRenderAdapter({
        ui: <FlowNodeCardLayerWidget id={data.nodeId} data={data} selected={true} type="state" />,
      });

      expect(screen.getByTestId('FLOW_NODE').getAttribute('data-selected')).toBe('true');
    });

    it('VALID: {selected: false} => no data-selected attribute', () => {
      FlowNodeCardLayerWidgetProxy();
      const data = ReactFlowNodeDataStub({
        nodeId: FlowNodeIdStub({ value: 'login-page' }),
        label: 'Login Page',
        nodeType: 'state',
        contractCount: ContractCountStub({ value: 0 }),
      });

      mantineRenderAdapter({
        ui: <FlowNodeCardLayerWidget id={data.nodeId} data={data} selected={false} type="state" />,
      });

      expect(screen.getByTestId('FLOW_NODE').getAttribute('data-selected')).toBe(null);
    });
  });
});
