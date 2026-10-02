import React from '#gateway/npm/react';

import { render } from '#gateway/npm/testing-library__react';

import { NodeMeasureLayerWidget } from './node-measure-layer-widget';
import { NodeMeasureLayerWidgetProxy } from './node-measure-layer-widget.proxy';

describe('NodeMeasureLayerWidget', () => {
  describe('forcing a re-measure', () => {
    it('VALID: {graph reports it is not initialized} => asks React Flow to re-measure every node id', () => {
      const proxy = NodeMeasureLayerWidgetProxy();
      proxy.setupUnmeasuredGraph();

      render({
        ui: React.createElement(NodeMeasureLayerWidget, {
          nodeIds: 'press-begin\nobs:press-begin:one',
        }),
      });

      expect(proxy.getForcedMeasureIds()).toStrictEqual([['press-begin', 'obs:press-begin:one']]);
    });

    it('VALID: {graph reports it is initialized} => asks for nothing, so a measured canvas is left alone', () => {
      const proxy = NodeMeasureLayerWidgetProxy();
      proxy.setupMeasuredGraph();

      render({
        ui: React.createElement(NodeMeasureLayerWidget, { nodeIds: 'press-begin' }),
      });

      expect(proxy.getForcedMeasureIds()).toStrictEqual([]);
    });

    it('EMPTY: {no node ids} => asks for nothing rather than re-measuring an empty id', () => {
      const proxy = NodeMeasureLayerWidgetProxy();
      proxy.setupUnmeasuredGraph();

      render({ ui: React.createElement(NodeMeasureLayerWidget, { nodeIds: '' }) });

      expect(proxy.getForcedMeasureIds()).toStrictEqual([]);
    });

    it('VALID: {re-rendered with the same ids while still unmeasured} => asks once, not once per render', () => {
      const proxy = NodeMeasureLayerWidgetProxy();
      proxy.setupUnmeasuredGraph();

      const { rerender } = render({
        ui: React.createElement(NodeMeasureLayerWidget, { nodeIds: 'press-begin' }),
      });
      rerender(React.createElement(NodeMeasureLayerWidget, { nodeIds: 'press-begin' }));
      rerender(React.createElement(NodeMeasureLayerWidget, { nodeIds: 'press-begin' }));

      expect(proxy.getForcedMeasureIds()).toStrictEqual([['press-begin']]);
    });

    it('VALID: {node ids change while still unmeasured} => asks again for the new set', () => {
      const proxy = NodeMeasureLayerWidgetProxy();
      proxy.setupUnmeasuredGraph();

      const { rerender } = render({
        ui: React.createElement(NodeMeasureLayerWidget, { nodeIds: 'press-begin' }),
      });
      rerender(
        React.createElement(NodeMeasureLayerWidget, { nodeIds: 'press-begin\ncheck-startable' }),
      );

      expect(proxy.getForcedMeasureIds()).toStrictEqual([
        ['press-begin'],
        ['press-begin', 'check-startable'],
      ]);
    });

    it('VALID: {rendered} => renders no element of its own', () => {
      const proxy = NodeMeasureLayerWidgetProxy();
      proxy.setupMeasuredGraph();

      const { container } = render({
        ui: React.createElement(NodeMeasureLayerWidget, { nodeIds: 'press-begin' }),
      });

      // The only children are the two <style> tags MantineProvider itself renders.
      expect(
        Array.from(container.children).map(
          (child) => `${child.tagName}:${String(child.getAttribute('data-mantine-styles'))}`,
        ),
      ).toStrictEqual(['STYLE:true', 'STYLE:classes']);
    });
  });
});
