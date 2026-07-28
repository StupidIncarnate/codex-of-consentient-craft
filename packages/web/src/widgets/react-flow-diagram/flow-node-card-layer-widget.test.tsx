import { screen } from '@testing-library/react';

import { FlowNodeIdStub } from '@dungeonmaster/shared/contracts';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { CommentCountStub } from '../../contracts/comment-count/comment-count.stub';
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

  describe('comment button', () => {
    it('VALID: {data carries questId and flowId} => renders one COMMENT_BUTTON', () => {
      const proxy = FlowNodeCardLayerWidgetProxy();
      proxy.setupEmptyQueue();
      const data = ReactFlowNodeDataStub({
        nodeId: FlowNodeIdStub({ value: 'login-page' }),
        label: 'Login Page',
        nodeType: 'state',
        contractCount: ContractCountStub({ value: 0 }),
        questId: 'quest-a',
        flowId: 'login-flow',
      });

      mantineRenderAdapter({
        ui: <FlowNodeCardLayerWidget id={data.nodeId} data={data} selected={false} type="state" />,
      });

      expect(proxy.countCommentButtons()).toBe(1);
    });

    it('EMPTY: {data omits questId and flowId} => renders zero COMMENT_BUTTON elements', () => {
      const proxy = FlowNodeCardLayerWidgetProxy();
      proxy.setupEmptyQueue();
      const data = ReactFlowNodeDataStub({
        nodeId: FlowNodeIdStub({ value: 'login-page' }),
        label: 'Login Page',
        nodeType: 'state',
        contractCount: ContractCountStub({ value: 0 }),
      });

      mantineRenderAdapter({
        ui: <FlowNodeCardLayerWidget id={data.nodeId} data={data} selected={false} type="state" />,
      });

      expect(proxy.countCommentButtons()).toBe(0);
    });

    it('EMPTY: {data carries questId but no flowId} => renders zero COMMENT_BUTTON elements', () => {
      const proxy = FlowNodeCardLayerWidgetProxy();
      proxy.setupEmptyQueue();
      const data = ReactFlowNodeDataStub({
        nodeId: FlowNodeIdStub({ value: 'login-page' }),
        label: 'Login Page',
        nodeType: 'state',
        contractCount: ContractCountStub({ value: 0 }),
        questId: 'quest-a',
      });

      mantineRenderAdapter({
        ui: <FlowNodeCardLayerWidget id={data.nodeId} data={data} selected={false} type="state" />,
      });

      expect(proxy.countCommentButtons()).toBe(0);
    });
  });

  describe('comment count badge', () => {
    it('VALID: {commentCount: 2} => COMMENT_COUNT_BADGE reads 2 on a box carrying two persisted comments (#check-badge-count-text)', () => {
      const proxy = FlowNodeCardLayerWidgetProxy();
      const data = ReactFlowNodeDataStub({
        nodeId: FlowNodeIdStub({ value: 'login-page' }),
        label: 'Login Page',
        nodeType: 'state',
        contractCount: ContractCountStub({ value: 0 }),
        commentCount: CommentCountStub({ value: 2 }),
      });

      mantineRenderAdapter({
        ui: <FlowNodeCardLayerWidget id={data.nodeId} data={data} selected={false} type="state" />,
      });

      expect(proxy.getCommentBadge()?.textContent).toBe('2');
    });

    it('VALID: {commentCount: 2, contractCount: 3} => COMMENT_COUNT_BADGE and the contracts FLOW_NODE_BADGE both render on the same FLOW_NODE card (#check-badge-beside-contract-badge)', () => {
      const proxy = FlowNodeCardLayerWidgetProxy();
      const data = ReactFlowNodeDataStub({
        nodeId: FlowNodeIdStub({ value: 'login-page' }),
        label: 'Login Page',
        nodeType: 'state',
        contractCount: ContractCountStub({ value: 3 }),
        commentCount: CommentCountStub({ value: 2 }),
      });

      mantineRenderAdapter({
        ui: <FlowNodeCardLayerWidget id={data.nodeId} data={data} selected={false} type="state" />,
      });

      expect(proxy.getBadge()?.textContent).toBe('3');
      expect(proxy.getCommentBadge()?.textContent).toBe('2');
    });

    it('EMPTY: {commentCount: 0} => a box with zero persisted comments renders no COMMENT_COUNT_BADGE (#check-no-badge-zero-comments)', () => {
      const proxy = FlowNodeCardLayerWidgetProxy();
      const data = ReactFlowNodeDataStub({
        nodeId: FlowNodeIdStub({ value: 'login-page' }),
        label: 'Login Page',
        nodeType: 'state',
        contractCount: ContractCountStub({ value: 0 }),
        commentCount: CommentCountStub({ value: 0 }),
      });

      mantineRenderAdapter({
        ui: <FlowNodeCardLayerWidget id={data.nodeId} data={data} selected={false} type="state" />,
      });

      expect(proxy.getCommentBadge()).toBe(null);
    });

    it('VALID: {commentCount: 2, no questId or flowId} => a quest with status approved renders COMMENT_COUNT_BADGE on a commented box while rendering zero COMMENT_BUTTON elements on that same box (#check-badge-without-button-when-approved)', () => {
      const proxy = FlowNodeCardLayerWidgetProxy();
      proxy.setupEmptyQueue();
      const data = ReactFlowNodeDataStub({
        nodeId: FlowNodeIdStub({ value: 'login-page' }),
        label: 'Login Page',
        nodeType: 'state',
        contractCount: ContractCountStub({ value: 0 }),
        commentCount: CommentCountStub({ value: 2 }),
      });

      mantineRenderAdapter({
        ui: <FlowNodeCardLayerWidget id={data.nodeId} data={data} selected={false} type="state" />,
      });

      expect(proxy.getCommentBadge()?.textContent).toBe('2');
      expect(proxy.countCommentButtons()).toBe(0);
    });

    it('VALID: {commentCount: 2, questId and flowId present} => a quest with status review_flows and a resumable session renders both COMMENT_COUNT_BADGE and COMMENT_BUTTON on the same commented box (#check-badge-and-button-coexist)', () => {
      const proxy = FlowNodeCardLayerWidgetProxy();
      proxy.setupEmptyQueue();
      const data = ReactFlowNodeDataStub({
        nodeId: FlowNodeIdStub({ value: 'login-page' }),
        label: 'Login Page',
        nodeType: 'state',
        contractCount: ContractCountStub({ value: 0 }),
        commentCount: CommentCountStub({ value: 2 }),
        questId: 'quest-a',
        flowId: 'login-flow',
      });

      mantineRenderAdapter({
        ui: <FlowNodeCardLayerWidget id={data.nodeId} data={data} selected={false} type="state" />,
      });

      expect(proxy.getCommentBadge()?.textContent).toBe('2');
      expect(proxy.countCommentButtons()).toBe(1);
    });
  });
});
