import { document } from '#gateway/browser/document';
import React from '#gateway/npm/react';

import { render, screen } from '#gateway/npm/testing-library__react';
import userEvent from '#gateway/npm/testing-library__user-event';

import { ReactFlowWidget } from './react-flow-widget';
import { ReactFlowWidgetProxy } from './react-flow-widget.proxy';
import { ReactFlowNodeDataStub } from '../../contracts/react-flow-node-data/react-flow-node-data.stub';

describe('ReactFlowWidget', () => {
  describe('canvas rendering', () => {
    it('VALID: {nodes: [3 nodes], edges: []} => REACT_FLOW_CANVAS present with exactly 3 FLOW_NODE elements', () => {
      ReactFlowWidgetProxy();

      render({
        ui: React.createElement(ReactFlowWidget, {
          nodes: [
            {
              id: 'node-one',
              position: { x: 0, y: 0 },
              data: ReactFlowNodeDataStub({ nodeId: 'node-one', label: 'Node One' }),
            },
            {
              id: 'node-two',
              position: { x: 0, y: 0 },
              data: ReactFlowNodeDataStub({ nodeId: 'node-two', label: 'Node Two' }),
            },
            {
              id: 'node-three',
              position: { x: 0, y: 0 },
              data: ReactFlowNodeDataStub({ nodeId: 'node-three', label: 'Node Three' }),
            },
          ],
          edges: [],
        }),
      });

      expect(screen.getByTestId('REACT_FLOW_CANVAS')).toBe(
        document.querySelector('[data-testid="REACT_FLOW_CANVAS"]'),
      );
      expect(
        screen.getAllByTestId('FLOW_NODE').map((el) => el.getAttribute('data-node-id')),
      ).toStrictEqual(['node-one', 'node-two', 'node-three']);
    });
  });

  describe('nodeTypes prop', () => {
    it('VALID: {nodeTypes provided} => ReactFlow receives nodeTypes (custom node renders via nodeTypes map)', () => {
      ReactFlowWidgetProxy();

      const FlowNode = ({ id }: { id: string }) =>
        React.createElement('div', { 'data-testid': 'FLOW_NODE', 'data-node-id': id });

      render({
        ui: React.createElement(ReactFlowWidget, {
          nodes: [
            {
              id: 'node-one',
              type: 'flowNode',
              position: { x: 0, y: 0 },
              data: ReactFlowNodeDataStub({ nodeId: 'node-one', label: 'Node One' }),
            },
          ],
          edges: [],
          nodeTypes: { flowNode: FlowNode },
        }),
      });

      expect(screen.getByTestId('FLOW_NODE')).toBe(
        document.querySelector('[data-testid="FLOW_NODE"]'),
      );
    });
  });

  describe('click callback', () => {
    it('VALID: {click FLOW_NODE, onNodeClick provided} => onNodeClick called with the clicked node', async () => {
      ReactFlowWidgetProxy();

      const onNodeClick = jest.fn();
      const clickedData = ReactFlowNodeDataStub({
        nodeId: 'click-target',
        label: 'Click Me',
        contractCount: 2,
      });

      render({
        ui: React.createElement(ReactFlowWidget, {
          nodes: [{ id: 'click-target', position: { x: 0, y: 0 }, data: clickedData }],
          edges: [],
          onNodeClick,
        }),
      });

      await userEvent.click(screen.getByTestId('FLOW_NODE'));

      expect(onNodeClick).toHaveBeenCalledTimes(1);
      expect(onNodeClick).toHaveBeenCalledWith({
        id: 'click-target',
        position: { x: 0, y: 0 },
        data: clickedData,
      });
    });

    it('EDGE: {click FLOW_NODE, onNodeClick undefined} => does not throw', async () => {
      ReactFlowWidgetProxy();

      render({
        ui: React.createElement(ReactFlowWidget, {
          nodes: [
            {
              id: 'node-one',
              position: { x: 0, y: 0 },
              data: ReactFlowNodeDataStub({ nodeId: 'node-one', label: 'Node One' }),
            },
          ],
          edges: [],
        }),
      });

      await expect(userEvent.click(screen.getByTestId('FLOW_NODE'))).resolves.toBe(undefined);
    });
  });

  describe('pane click callback', () => {
    it('VALID: {click pane, onPaneClick provided} => onPaneClick called once', async () => {
      ReactFlowWidgetProxy();

      const onPaneClick = jest.fn();

      render({
        ui: React.createElement(ReactFlowWidget, {
          nodes: [],
          edges: [],
          onPaneClick,
        }),
      });

      await userEvent.click(screen.getByTestId('REACT_FLOW_PANE'));

      expect(onPaneClick).toHaveBeenCalledTimes(1);
      expect(onPaneClick).toHaveBeenCalledWith();
    });

    it('EDGE: {click pane, onPaneClick undefined} => does not throw', async () => {
      ReactFlowWidgetProxy();

      render({
        ui: React.createElement(ReactFlowWidget, {
          nodes: [],
          edges: [],
        }),
      });

      await expect(userEvent.click(screen.getByTestId('REACT_FLOW_PANE'))).resolves.toBe(undefined);
    });
  });
});
