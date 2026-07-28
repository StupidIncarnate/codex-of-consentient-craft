import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { FlowObservableNodeDataStub } from '../../contracts/flow-observable-node-data/flow-observable-node-data.stub';
import { FlowObservableNodeLayerWidget } from './flow-observable-node-layer-widget';
import { FlowObservableNodeLayerWidgetProxy } from './flow-observable-node-layer-widget.proxy';

describe('FlowObservableNodeLayerWidget', () => {
  describe('assertion card rendering', () => {
    it('VALID: {ui-state observable} => renders FLOW_OBSERVABLE_NODE with type tag and full description', () => {
      const proxy = FlowObservableNodeLayerWidgetProxy();
      const data = FlowObservableNodeDataStub({
        outcomeType: 'ui-state',
        description: 'redirects to dashboard',
      });

      mantineRenderAdapter({ ui: <FlowObservableNodeLayerWidget data={data} /> });

      expect(proxy.getNode()).toBeInTheDocument();
      expect(proxy.getType()?.textContent).toBe('ui-state');
      expect(proxy.getDescription()?.textContent).toBe('redirects to dashboard');
    });

    it('VALID: {api-call observable} => type tag shows api-call', () => {
      const proxy = FlowObservableNodeLayerWidgetProxy();
      const data = FlowObservableNodeDataStub({
        outcomeType: 'api-call',
        description: 'POSTs credentials to /auth/login',
      });

      mantineRenderAdapter({ ui: <FlowObservableNodeLayerWidget data={data} /> });

      expect(proxy.getType()?.textContent).toBe('api-call');
      expect(proxy.getDescription()?.textContent).toBe('POSTs credentials to /auth/login');
    });
  });

  describe('comment button', () => {
    it('VALID: {data carries questId, flowId and nodeId} => renders one COMMENT_BUTTON', () => {
      const proxy = FlowObservableNodeLayerWidgetProxy();
      proxy.setupEmptyQueue();
      const data = FlowObservableNodeDataStub({
        questId: 'quest-a',
        flowId: 'login-flow',
        nodeId: 'login-page',
      });

      mantineRenderAdapter({ ui: <FlowObservableNodeLayerWidget data={data} /> });

      expect(proxy.countCommentButtons()).toBe(1);
    });

    it('EMPTY: {data omits the anchor fields} => renders zero COMMENT_BUTTON elements', () => {
      const proxy = FlowObservableNodeLayerWidgetProxy();
      proxy.setupEmptyQueue();
      const data = FlowObservableNodeDataStub({});

      mantineRenderAdapter({ ui: <FlowObservableNodeLayerWidget data={data} /> });

      expect(proxy.countCommentButtons()).toBe(0);
    });

    it('EMPTY: {data carries questId and flowId but no nodeId} => renders zero COMMENT_BUTTON elements', () => {
      const proxy = FlowObservableNodeLayerWidgetProxy();
      proxy.setupEmptyQueue();
      const data = FlowObservableNodeDataStub({ questId: 'quest-a', flowId: 'login-flow' });

      mantineRenderAdapter({ ui: <FlowObservableNodeLayerWidget data={data} /> });

      expect(proxy.countCommentButtons()).toBe(0);
    });
  });
});
