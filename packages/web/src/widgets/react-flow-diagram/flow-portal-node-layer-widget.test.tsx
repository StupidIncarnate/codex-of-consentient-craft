import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { FlowPortalNodeDataStub } from '../../contracts/flow-portal-node-data/flow-portal-node-data.stub';
import { FlowPortalNodeLayerWidget } from './flow-portal-node-layer-widget';
import { FlowPortalNodeLayerWidgetProxy } from './flow-portal-node-layer-widget.proxy';

describe('FlowPortalNodeLayerWidget', () => {
  describe('portal card rendering', () => {
    it('VALID: {cross-flow portal} => renders FLOW_PORTAL_NODE showing the cross-flow target label', () => {
      const proxy = FlowPortalNodeLayerWidgetProxy();
      const data = FlowPortalNodeDataStub({
        reference: 'compile-flow:compile-entry',
        label: '↗ compile-flow → compile-entry',
      });

      mantineRenderAdapter({ ui: <FlowPortalNodeLayerWidget data={data} /> });

      expect(proxy.getNode()).toBeInTheDocument();
      expect(proxy.getLabel()?.textContent).toBe('↗ compile-flow → compile-entry');
    });
  });

  describe('comment button', () => {
    it('EMPTY: {cross-flow portal} => renders zero COMMENT_BUTTON elements', () => {
      const proxy = FlowPortalNodeLayerWidgetProxy();
      const data = FlowPortalNodeDataStub({
        reference: 'compile-flow:compile-entry',
        label: '↗ compile-flow → compile-entry',
      });

      mantineRenderAdapter({ ui: <FlowPortalNodeLayerWidget data={data} /> });

      // A portal is a rendering stand-in for a node that lives in another flow, so a comment left
      // here would strand feedback on an artifact instead of the real node.
      expect(proxy.countCommentButtons()).toBe(0);
    });
  });
});
