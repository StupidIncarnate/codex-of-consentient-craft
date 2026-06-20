import React from 'react';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { xyflowReactFlowAdapter } from './xyflow-react-flow-adapter';
import { xyflowReactFlowAdapterProxy } from './xyflow-react-flow-adapter.proxy';
import { ReactFlowNodeDataStub } from '../../../contracts/react-flow-node-data/react-flow-node-data.stub';

describe('xyflowReactFlowAdapter', () => {
  describe('canvas rendering', () => {
    it('VALID: {nodes: [3 nodes], edges: []} => REACT_FLOW_CANVAS present with exactly 3 FLOW_NODE elements', () => {
      xyflowReactFlowAdapterProxy();

      render(
        React.createElement(xyflowReactFlowAdapter, {
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
      );

      expect(screen.getByTestId('REACT_FLOW_CANVAS')).toBe(
        document.querySelector('[data-testid="REACT_FLOW_CANVAS"]'),
      );
      expect(
        screen.getAllByTestId('FLOW_NODE').map((el) => el.getAttribute('data-node-id')),
      ).toStrictEqual(['node-one', 'node-two', 'node-three']);
    });
  });

  describe('click callback', () => {
    it('VALID: {click FLOW_NODE} => onNodeClick called with the clicked node', async () => {
      xyflowReactFlowAdapterProxy();

      const onNodeClick = jest.fn();
      const clickedData = ReactFlowNodeDataStub({
        nodeId: 'click-target',
        label: 'Click Me',
        observableCount: 2,
      });

      render(
        React.createElement(xyflowReactFlowAdapter, {
          nodes: [{ id: 'click-target', position: { x: 0, y: 0 }, data: clickedData }],
          edges: [],
          onNodeClick,
        }),
      );

      await userEvent.click(screen.getByTestId('FLOW_NODE'));

      expect(onNodeClick).toHaveBeenCalledTimes(1);
      expect(onNodeClick).toHaveBeenCalledWith({
        id: 'click-target',
        position: { x: 0, y: 0 },
        data: clickedData,
      });
    });
  });
});
