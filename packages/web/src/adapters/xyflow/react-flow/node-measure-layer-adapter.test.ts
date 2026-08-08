import React from 'react';

import { render } from '@testing-library/react';

import { nodeMeasureLayerAdapter } from './node-measure-layer-adapter';
import { nodeMeasureLayerAdapterProxy } from './node-measure-layer-adapter.proxy';

describe('nodeMeasureLayerAdapter', () => {
  describe('forcing a re-measure', () => {
    it('VALID: {graph reports it is not initialized} => asks React Flow to re-measure every node id', () => {
      const proxy = nodeMeasureLayerAdapterProxy();
      proxy.setupUnmeasuredGraph();

      render(
        React.createElement(nodeMeasureLayerAdapter, {
          nodeIds: 'press-begin\nobs:press-begin:one',
        }),
      );

      expect(proxy.getForcedMeasureIds()).toStrictEqual([['press-begin', 'obs:press-begin:one']]);
    });

    it('VALID: {graph reports it is initialized} => asks for nothing, so a measured canvas is left alone', () => {
      const proxy = nodeMeasureLayerAdapterProxy();
      proxy.setupMeasuredGraph();

      render(React.createElement(nodeMeasureLayerAdapter, { nodeIds: 'press-begin' }));

      expect(proxy.getForcedMeasureIds()).toStrictEqual([]);
    });

    it('EMPTY: {no node ids} => asks for nothing rather than re-measuring an empty id', () => {
      const proxy = nodeMeasureLayerAdapterProxy();
      proxy.setupUnmeasuredGraph();

      render(React.createElement(nodeMeasureLayerAdapter, { nodeIds: '' }));

      expect(proxy.getForcedMeasureIds()).toStrictEqual([]);
    });

    it('VALID: {re-rendered with the same ids while still unmeasured} => asks once, not once per render', () => {
      const proxy = nodeMeasureLayerAdapterProxy();
      proxy.setupUnmeasuredGraph();

      const { rerender } = render(
        React.createElement(nodeMeasureLayerAdapter, { nodeIds: 'press-begin' }),
      );
      rerender(React.createElement(nodeMeasureLayerAdapter, { nodeIds: 'press-begin' }));
      rerender(React.createElement(nodeMeasureLayerAdapter, { nodeIds: 'press-begin' }));

      expect(proxy.getForcedMeasureIds()).toStrictEqual([['press-begin']]);
    });

    it('VALID: {node ids change while still unmeasured} => asks again for the new set', () => {
      const proxy = nodeMeasureLayerAdapterProxy();
      proxy.setupUnmeasuredGraph();

      const { rerender } = render(
        React.createElement(nodeMeasureLayerAdapter, { nodeIds: 'press-begin' }),
      );
      rerender(
        React.createElement(nodeMeasureLayerAdapter, { nodeIds: 'press-begin\ncheck-startable' }),
      );

      expect(proxy.getForcedMeasureIds()).toStrictEqual([
        ['press-begin'],
        ['press-begin', 'check-startable'],
      ]);
    });

    it('VALID: {rendered} => renders no element of its own', () => {
      const proxy = nodeMeasureLayerAdapterProxy();
      proxy.setupMeasuredGraph();

      const { container } = render(
        React.createElement(nodeMeasureLayerAdapter, { nodeIds: 'press-begin' }),
      );

      expect(container.innerHTML).toBe('');
    });
  });
});
