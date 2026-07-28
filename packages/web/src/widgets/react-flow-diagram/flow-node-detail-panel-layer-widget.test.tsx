import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import {
  FlowNodeIdStub,
  FlowNodeStub,
  FlowObservableStub,
  QuestCommentStub,
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
        ui: (
          <FlowNodeDetailPanelLayerWidget
            node={node}
            contracts={[]}
            comments={[]}
            onClose={onClose}
          />
        ),
      });

      expect(proxy.getPanel()).toBeInTheDocument();
      expect(proxy.getHeading()?.textContent).toBe('Login Page');
    });

    it('EMPTY: {no contracts, no comments} => shows empty message', () => {
      const proxy = FlowNodeDetailPanelLayerWidgetProxy();
      const node = FlowNodeStub({ id: FlowNodeIdStub({ value: 'login-page' }), observables: [] });
      const onClose = jest.fn();

      mantineRenderAdapter({
        ui: (
          <FlowNodeDetailPanelLayerWidget
            node={node}
            contracts={[]}
            comments={[]}
            onClose={onClose}
          />
        ),
      });

      expect(proxy.getEmpty()?.textContent).toBe('No contracts or comments for this box');
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
        ui: (
          <FlowNodeDetailPanelLayerWidget
            node={node}
            contracts={[contract]}
            comments={[]}
            onClose={onClose}
          />
        ),
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
        ui: (
          <FlowNodeDetailPanelLayerWidget
            node={node}
            contracts={[contract]}
            comments={[]}
            onClose={onClose}
          />
        ),
      });

      expect(proxy.getEmpty()?.textContent).toBe('No contracts or comments for this box');
    });

    it('VALID: {observable present} => renders no FLOW_DETAIL_PANEL_CONTRACTS even when node has matching contracts', () => {
      FlowNodeDetailPanelLayerWidgetProxy();
      const nodeId = FlowNodeIdStub({ value: 'login-page' });
      const node = FlowNodeStub({ id: nodeId, observables: [] });
      const contract = QuestContractEntryStub({ nodeId, name: 'LoginCredentials' });
      const observable = FlowObservableStub({
        id: 'redirects',
        type: 'ui-state',
        description: 'redirects to dashboard',
      });
      const onClose = jest.fn();

      mantineRenderAdapter({
        ui: (
          <FlowNodeDetailPanelLayerWidget
            node={node}
            contracts={[contract]}
            comments={[]}
            observable={observable}
            onClose={onClose}
          />
        ),
      });

      expect(screen.queryByTestId('FLOW_DETAIL_PANEL_CONTRACTS')).toBe(null);
    });
  });

  describe('#check-observable-card-shows-its-own-comments', () => {
    it('VALID: {observable set with comments} => FLOW_NODE_DETAIL_PANEL heads with the assertion description and lists those comments', () => {
      const proxy = FlowNodeDetailPanelLayerWidgetProxy();
      const node = FlowNodeStub({ id: FlowNodeIdStub({ value: 'login-page' }), observables: [] });
      const observable = FlowObservableStub({
        id: 'redirects',
        type: 'ui-state',
        description: 'redirects to dashboard',
      });
      const comment = QuestCommentStub({
        id: 'c0e3e17a-58cc-4372-a567-0e02b2c3d479',
        nodeId: FlowNodeIdStub({ value: 'login-page' }),
        observableId: 'redirects',
        text: 'This assertion looks wrong',
        createdAt: '2024-01-15T10:00:00.000Z',
      });
      const onClose = jest.fn();

      mantineRenderAdapter({
        ui: (
          <FlowNodeDetailPanelLayerWidget
            node={node}
            contracts={[]}
            comments={[comment]}
            observable={observable}
            onClose={onClose}
          />
        ),
      });

      expect(proxy.getHeading()?.textContent).toBe('redirects to dashboard');
      expect(proxy.getCommentTexts()).toStrictEqual(['This assertion looks wrong']);
    });
  });

  describe('#check-newest-first-order', () => {
    it('VALID: {comments array already newest-first} => FLOW_DETAIL_PANEL_COMMENTS rows render in that same descending createdAt order', () => {
      const proxy = FlowNodeDetailPanelLayerWidgetProxy();
      const node = FlowNodeStub({ id: FlowNodeIdStub({ value: 'login-page' }), observables: [] });
      const newest = QuestCommentStub({
        id: 'c0e3e17a-58cc-4372-a567-0e02b2c3d479',
        text: 'newest comment',
        createdAt: '2024-01-17T10:00:00.000Z',
      });
      const middle = QuestCommentStub({
        id: 'd1f4f28b-69dd-4483-a678-1f13c3d4e5a0',
        text: 'middle comment',
        createdAt: '2024-01-16T10:00:00.000Z',
      });
      const oldest = QuestCommentStub({
        id: 'e2050339-7aee-4594-8789-2024d4e5f6b1',
        text: 'oldest comment',
        createdAt: '2024-01-15T10:00:00.000Z',
      });
      const onClose = jest.fn();

      mantineRenderAdapter({
        ui: (
          <FlowNodeDetailPanelLayerWidget
            node={node}
            contracts={[]}
            comments={[newest, middle, oldest]}
            onClose={onClose}
          />
        ),
      });

      expect(proxy.getCommentTexts()).toStrictEqual([
        'newest comment',
        'middle comment',
        'oldest comment',
      ]);
    });
  });

  describe('#check-comment-row-content', () => {
    it('VALID: {single comment} => each FLOW_DETAIL_PANEL_COMMENTS row shows the comment text and its createdAt timestamp', () => {
      const proxy = FlowNodeDetailPanelLayerWidgetProxy();
      const node = FlowNodeStub({ id: FlowNodeIdStub({ value: 'login-page' }), observables: [] });
      const comment = QuestCommentStub({
        id: 'c0e3e17a-58cc-4372-a567-0e02b2c3d479',
        text: 'This assertion looks wrong',
        createdAt: '2024-01-15T10:00:00.000Z',
      });
      const onClose = jest.fn();

      mantineRenderAdapter({
        ui: (
          <FlowNodeDetailPanelLayerWidget
            node={node}
            contracts={[]}
            comments={[comment]}
            onClose={onClose}
          />
        ),
      });

      expect(proxy.getCommentTexts()).toStrictEqual(['This assertion looks wrong']);
      expect(proxy.getCommentTimes()).toStrictEqual(['2024-01-15T10:00:00.000Z']);
    });

    it('EDGE: {comment text contains a newline} => preserves the newline in FLOW_DETAIL_PANEL_COMMENT_TEXT', () => {
      const proxy = FlowNodeDetailPanelLayerWidgetProxy();
      const node = FlowNodeStub({ id: FlowNodeIdStub({ value: 'login-page' }), observables: [] });
      const comment = QuestCommentStub({
        id: 'c0e3e17a-58cc-4372-a567-0e02b2c3d479',
        text: 'first line\nsecond line',
        createdAt: '2024-01-15T10:00:00.000Z',
      });
      const onClose = jest.fn();

      mantineRenderAdapter({
        ui: (
          <FlowNodeDetailPanelLayerWidget
            node={node}
            contracts={[]}
            comments={[comment]}
            onClose={onClose}
          />
        ),
      });

      expect(proxy.getCommentTexts()).toStrictEqual(['first line\nsecond line']);
      expect(screen.getByTestId('FLOW_DETAIL_PANEL_COMMENT_TEXT').style.whiteSpace).toBe(
        'pre-wrap',
      );
    });
  });

  describe('#check-no-comments-section', () => {
    it('EMPTY: {zero comments, one matching contract} => FLOW_DETAIL_PANEL_COMMENTS is absent while FLOW_DETAIL_PANEL_CONTRACTS rows still render', () => {
      const proxy = FlowNodeDetailPanelLayerWidgetProxy();
      const nodeId = FlowNodeIdStub({ value: 'login-page' });
      const node = FlowNodeStub({ id: nodeId, observables: [] });
      const contract = QuestContractEntryStub({ nodeId, name: 'LoginCredentials' });
      const onClose = jest.fn();

      mantineRenderAdapter({
        ui: (
          <FlowNodeDetailPanelLayerWidget
            node={node}
            contracts={[contract]}
            comments={[]}
            onClose={onClose}
          />
        ),
      });

      expect(proxy.getCommentsSection()).toBe(null);
      expect(proxy.getContractEntries()?.length).toBe(1);
    });
  });

  describe('#check-empty-panel-when-neither', () => {
    it('EMPTY: {zero comments, zero contracts} => renders FLOW_DETAIL_PANEL_EMPTY, not an empty comments section', () => {
      const proxy = FlowNodeDetailPanelLayerWidgetProxy();
      const node = FlowNodeStub({ id: FlowNodeIdStub({ value: 'login-page' }), observables: [] });
      const onClose = jest.fn();

      mantineRenderAdapter({
        ui: (
          <FlowNodeDetailPanelLayerWidget
            node={node}
            contracts={[]}
            comments={[]}
            onClose={onClose}
          />
        ),
      });

      expect(proxy.getEmpty()).toBeInTheDocument();
      expect(proxy.getCommentsSection()).toBe(null);
    });
  });

  describe('EDGE: zero contracts, one comment does not show empty state', () => {
    it('EDGE: {zero contracts, one comment} => no FLOW_DETAIL_PANEL_EMPTY, comments section renders', () => {
      const proxy = FlowNodeDetailPanelLayerWidgetProxy();
      const node = FlowNodeStub({ id: FlowNodeIdStub({ value: 'login-page' }), observables: [] });
      const comment = QuestCommentStub({ id: 'c0e3e17a-58cc-4372-a567-0e02b2c3d479' });
      const onClose = jest.fn();

      mantineRenderAdapter({
        ui: (
          <FlowNodeDetailPanelLayerWidget
            node={node}
            contracts={[]}
            comments={[comment]}
            onClose={onClose}
          />
        ),
      });

      expect(proxy.getEmpty()).toBe(null);
      expect(proxy.getCommentsSection()).toBeInTheDocument();
    });
  });

  describe('EDGE: one contract, one comment shows both sections', () => {
    it('EDGE: {one contract, one comment} => no FLOW_DETAIL_PANEL_EMPTY, both sections render', () => {
      const proxy = FlowNodeDetailPanelLayerWidgetProxy();
      const nodeId = FlowNodeIdStub({ value: 'login-page' });
      const node = FlowNodeStub({ id: nodeId, observables: [] });
      const contract = QuestContractEntryStub({ nodeId, name: 'LoginCredentials' });
      const comment = QuestCommentStub({ id: 'c0e3e17a-58cc-4372-a567-0e02b2c3d479' });
      const onClose = jest.fn();

      mantineRenderAdapter({
        ui: (
          <FlowNodeDetailPanelLayerWidget
            node={node}
            contracts={[contract]}
            comments={[comment]}
            onClose={onClose}
          />
        ),
      });

      expect(proxy.getEmpty()).toBe(null);
      expect(proxy.getContractEntries()?.length).toBe(1);
      expect(proxy.getCommentsSection()).toBeInTheDocument();
    });
  });

  describe('#check-comments-visible-when-complete and #check-comments-visible-when-readonly', () => {
    it('VALID: {panel rendered with comments, no status or readOnly prop in the component} => comment rows render regardless', () => {
      const proxy = FlowNodeDetailPanelLayerWidgetProxy();
      const node = FlowNodeStub({ id: FlowNodeIdStub({ value: 'login-page' }), observables: [] });
      const comment = QuestCommentStub({
        id: 'c0e3e17a-58cc-4372-a567-0e02b2c3d479',
        text: 'visible regardless of quest status',
      });
      const onClose = jest.fn();

      mantineRenderAdapter({
        ui: (
          <FlowNodeDetailPanelLayerWidget
            node={node}
            contracts={[]}
            comments={[comment]}
            onClose={onClose}
          />
        ),
      });

      expect(proxy.getCommentTexts()).toStrictEqual(['visible regardless of quest status']);
    });
  });

  describe('close button', () => {
    it('VALID: {close button clicked} => calls onClose', async () => {
      const user = userEvent.setup();
      FlowNodeDetailPanelLayerWidgetProxy();
      const node = FlowNodeStub({ id: FlowNodeIdStub({ value: 'login-page' }), observables: [] });
      const onClose = jest.fn();

      mantineRenderAdapter({
        ui: (
          <FlowNodeDetailPanelLayerWidget
            node={node}
            contracts={[]}
            comments={[]}
            onClose={onClose}
          />
        ),
      });

      await user.click(screen.getByTestId('FLOW_DETAIL_PANEL_CLOSE'));

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });
});
