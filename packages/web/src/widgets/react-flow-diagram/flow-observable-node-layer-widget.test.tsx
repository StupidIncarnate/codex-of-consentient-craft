import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { CommentCountStub } from '../../contracts/comment-count/comment-count.stub';
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
  });

  describe('comment count badge', () => {
    it('VALID: {commentCount: 1} => a FLOW_OBSERVABLE_NODE carrying one comment renders a COMMENT_COUNT_BADGE reading 1 (#check-observable-badge)', () => {
      const proxy = FlowObservableNodeLayerWidgetProxy();
      const data = FlowObservableNodeDataStub({ commentCount: CommentCountStub({ value: 1 }) });

      mantineRenderAdapter({ ui: <FlowObservableNodeLayerWidget data={data} /> });

      expect(proxy.getCommentBadge()?.textContent).toBe('1');
    });

    it('EMPTY: {commentCount: 0} => a box with zero persisted comments renders no COMMENT_COUNT_BADGE (#check-no-badge-zero-comments)', () => {
      const proxy = FlowObservableNodeLayerWidgetProxy();
      const data = FlowObservableNodeDataStub({ commentCount: CommentCountStub({ value: 0 }) });

      mantineRenderAdapter({ ui: <FlowObservableNodeLayerWidget data={data} /> });

      expect(proxy.getCommentBadge()).toBe(null);
    });

    it('VALID: {commentCount: 2, no questId or flowId} => a quest with status approved renders COMMENT_COUNT_BADGE on a commented box while rendering zero COMMENT_BUTTON elements on that same box (#check-badge-without-button-when-approved)', () => {
      const proxy = FlowObservableNodeLayerWidgetProxy();
      proxy.setupEmptyQueue();
      const data = FlowObservableNodeDataStub({ commentCount: CommentCountStub({ value: 2 }) });

      mantineRenderAdapter({ ui: <FlowObservableNodeLayerWidget data={data} /> });

      expect(proxy.getCommentBadge()?.textContent).toBe('2');
      expect(proxy.countCommentButtons()).toBe(0);
    });

    it('VALID: {commentCount: 2, questId flowId and nodeId present} => a quest with status review_flows and a resumable session renders both COMMENT_COUNT_BADGE and COMMENT_BUTTON on the same commented box (#check-badge-and-button-coexist)', () => {
      const proxy = FlowObservableNodeLayerWidgetProxy();
      proxy.setupEmptyQueue();
      const data = FlowObservableNodeDataStub({
        questId: 'quest-a',
        flowId: 'login-flow',
        nodeId: 'login-page',
        commentCount: CommentCountStub({ value: 2 }),
      });

      mantineRenderAdapter({ ui: <FlowObservableNodeLayerWidget data={data} /> });

      expect(proxy.getCommentBadge()?.textContent).toBe('2');
      expect(proxy.countCommentButtons()).toBe(1);
    });
  });
});
