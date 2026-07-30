import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import {
  FlowEdgeStub,
  FlowNodeIdStub,
  FlowNodeStub,
  FlowObservableStub,
  FlowStub,
  QuestCommentStub,
  QuestContractEntryStub,
  QuestIdStub,
} from '@dungeonmaster/shared/contracts';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { flowNodeStyleStatics } from '../../statics/flow-node-style/flow-node-style-statics';
import { ReactFlowDiagramWidget } from './react-flow-diagram-widget';
import { ReactFlowDiagramWidgetProxy } from './react-flow-diagram-widget.proxy';

describe('ReactFlowDiagramWidget', () => {
  describe('empty flow', () => {
    it('EMPTY: {flow with no nodes} => renders nothing (no FLOW_DIAGRAM)', () => {
      ReactFlowDiagramWidgetProxy();
      const flow = FlowStub({ nodes: [], edges: [] });

      mantineRenderAdapter({ ui: <ReactFlowDiagramWidget flow={flow} /> });

      expect(screen.queryByTestId('FLOW_DIAGRAM')).toBe(null);
      expect(screen.queryByTestId('REACT_FLOW_CANVAS')).toBe(null);
    });
  });

  describe('non-empty flow', () => {
    it('EMPTY: {positions not yet resolved} => renders nothing while layout is pending', () => {
      ReactFlowDiagramWidgetProxy();
      const node = FlowNodeStub({
        id: FlowNodeIdStub({ value: 'login-page' }),
        type: 'state',
        observables: [],
      });
      const flow = FlowStub({ nodes: [node], edges: [] });

      // No setupPositions call — the elk mock never resolves, so positions stay null.
      mantineRenderAdapter({ ui: <ReactFlowDiagramWidget flow={flow} /> });

      expect(screen.queryByTestId('FLOW_DIAGRAM')).toBe(null);
      expect(screen.queryByTestId('REACT_FLOW_CANVAS')).toBe(null);
      expect(screen.queryByTestId('FLOW_DIAGRAM_ERROR')).toBe(null);
    });

    it('VALID: {node missing from position map} => falls back to {x:0,y:0} and still renders', async () => {
      const proxy = ReactFlowDiagramWidgetProxy();
      const node = FlowNodeStub({
        id: FlowNodeIdStub({ value: 'login-page' }),
        type: 'state',
        observables: [],
      });
      const flow = FlowStub({ nodes: [node], edges: [] });

      // Return an empty children list — node id is absent from the position map.
      proxy.setupPositions({ children: [] });

      mantineRenderAdapter({ ui: <ReactFlowDiagramWidget flow={flow} /> });

      await waitFor(() => {
        expect(screen.queryByTestId('FLOW_DIAGRAM')).toBeInTheDocument();
      });

      expect(screen.getByTestId('FLOW_NODE')).toBeInTheDocument();
    });

    it('VALID: {flow with one node} => renders FLOW_DIAGRAM containing REACT_FLOW_CANVAS and FLOW_NODE', async () => {
      const proxy = ReactFlowDiagramWidgetProxy();
      const nodeId = FlowNodeIdStub({ value: 'login-page' });
      const node = FlowNodeStub({ id: nodeId, type: 'state', observables: [] });
      const flow = FlowStub({ nodes: [node], edges: [] });

      proxy.setupPositions({ children: [{ id: 'login-page', x: 0, y: 0 }] });

      mantineRenderAdapter({ ui: <ReactFlowDiagramWidget flow={flow} /> });

      await waitFor(() => {
        expect(screen.queryByTestId('FLOW_DIAGRAM')).toBeInTheDocument();
      });

      expect(screen.getByTestId('REACT_FLOW_CANVAS')).toBeInTheDocument();
      expect(screen.getByTestId('FLOW_NODE')).toBeInTheDocument();
    });

    it('VALID: {flow with 2 nodes} => REACT_FLOW_PANE contains 2 FLOW_NODE elements', async () => {
      const proxy = ReactFlowDiagramWidgetProxy();
      const node1 = FlowNodeStub({
        id: FlowNodeIdStub({ value: 'login-page' }),
        label: 'Login Page',
        type: 'state',
        observables: [],
      });
      const node2 = FlowNodeStub({
        id: FlowNodeIdStub({ value: 'dashboard' }),
        label: 'Dashboard',
        type: 'action',
        observables: [],
      });
      const flow = FlowStub({ nodes: [node1, node2], edges: [] });

      proxy.setupPositions({
        children: [
          { id: 'login-page', x: 0, y: 0 },
          { id: 'dashboard', x: 200, y: 0 },
        ],
      });

      mantineRenderAdapter({ ui: <ReactFlowDiagramWidget flow={flow} /> });

      await waitFor(() => {
        expect(screen.queryByTestId('FLOW_DIAGRAM')).toBeInTheDocument();
      });

      const labels = screen.getAllByTestId('FLOW_NODE_LABEL').map((el) => el.textContent);

      expect(labels).toStrictEqual(['Login Page', 'Dashboard']);
    });
  });

  describe('cross-flow edges', () => {
    it('VALID: {edge targets a node in another flow} => renders a FLOW_PORTAL_NODE for the off-flow target instead of erroring', async () => {
      const proxy = ReactFlowDiagramWidgetProxy();
      const node = FlowNodeStub({
        id: FlowNodeIdStub({ value: 'run-compile' }),
        label: 'Run Compile flow',
        type: 'action',
        observables: [],
      });
      const crossEdge = FlowEdgeStub({
        id: 'run-compile-invokes',
        from: 'run-compile',
        to: 'compile-flow:compile-entry',
        label: 'invokes',
      });
      const flow = FlowStub({ nodes: [node], edges: [crossEdge] });

      proxy.setupPositions({
        children: [
          { id: 'run-compile', x: 0, y: 0 },
          { id: 'compile-flow:compile-entry', x: 0, y: 200 },
        ],
      });

      mantineRenderAdapter({ ui: <ReactFlowDiagramWidget flow={flow} /> });

      await waitFor(() => {
        expect(screen.queryByTestId('FLOW_DIAGRAM')).toBeInTheDocument();
      });

      expect(screen.queryByTestId('FLOW_DIAGRAM_ERROR')).toBe(null);
      expect(screen.getByTestId('FLOW_PORTAL_NODE_LABEL').textContent).toBe(
        '↗ compile-flow → compile-entry',
      );
    });
  });

  describe('error handling', () => {
    it('ERROR: {elk layout rejects} => shows FLOW_DIAGRAM_ERROR with exact text, no canvas', async () => {
      const proxy = ReactFlowDiagramWidgetProxy();
      const nodeId = FlowNodeIdStub({ value: 'login-page' });
      const node = FlowNodeStub({ id: nodeId, type: 'state', observables: [] });
      const flow = FlowStub({ nodes: [node], edges: [] });

      proxy.setupLayoutError({ error: new Error('ELK layout failed') });

      mantineRenderAdapter({ ui: <ReactFlowDiagramWidget flow={flow} /> });

      await waitFor(() => {
        expect(screen.queryByTestId('FLOW_DIAGRAM_ERROR')).toBeInTheDocument();
      });

      expect(screen.getByTestId('FLOW_DIAGRAM_ERROR').textContent).toBe(
        'Could not render flow diagram',
      );
      expect(screen.queryByTestId('REACT_FLOW_CANVAS')).toBe(null);
    });
  });

  describe('node card accent colors by type', () => {
    it.each(
      Object.keys(flowNodeStyleStatics.accent).map((nodeType) => ({
        input: nodeType as keyof typeof flowNodeStyleStatics.accent,
      })),
    )(
      'VALID: {$input node} => $input card accent color matches source-of-truth',
      async ({ input }) => {
        const proxy = ReactFlowDiagramWidgetProxy();
        const node = FlowNodeStub({
          id: FlowNodeIdStub({ value: input }),
          type: input,
          observables: [],
        });
        const flow = FlowStub({ nodes: [node], edges: [] });

        proxy.setupPositions({ children: [{ id: input, x: 0, y: 0 }] });

        mantineRenderAdapter({ ui: <ReactFlowDiagramWidget flow={flow} /> });

        await waitFor(() => {
          expect(screen.queryByTestId('FLOW_NODE')).toBeInTheDocument();
        });

        expect(screen.getByTestId('FLOW_NODE').getAttribute('data-accent-color')).toBe(
          flowNodeStyleStatics.accent[input],
        );
      },
    );
  });

  describe('node badge', () => {
    it('VALID: {node with 2 contracts} => FLOW_NODE_BADGE shows "2"', async () => {
      const proxy = ReactFlowDiagramWidgetProxy();
      const nodeId = FlowNodeIdStub({ value: 'login-page' });
      const node = FlowNodeStub({ id: nodeId, type: 'state', observables: [] });
      const flow = FlowStub({ nodes: [node], edges: [] });
      const contracts = [
        QuestContractEntryStub({ id: 'login-credentials', nodeId, name: 'LoginCredentials' }),
        QuestContractEntryStub({ id: 'auth-login-endpoint', nodeId, name: 'AuthLoginEndpoint' }),
      ];

      proxy.setupPositions({ children: [{ id: 'login-page', x: 0, y: 0 }] });

      mantineRenderAdapter({ ui: <ReactFlowDiagramWidget flow={flow} contracts={contracts} /> });

      await waitFor(() => {
        expect(screen.queryByTestId('FLOW_NODE_BADGE')).toBeInTheDocument();
      });

      expect(screen.getByTestId('FLOW_NODE_BADGE').textContent).toBe('2');
    });

    it('EMPTY: {node with 0 contracts} => no FLOW_NODE_BADGE', async () => {
      const proxy = ReactFlowDiagramWidgetProxy();
      const node = FlowNodeStub({
        id: FlowNodeIdStub({ value: 'login-page' }),
        type: 'state',
        observables: [],
      });
      const flow = FlowStub({ nodes: [node], edges: [] });

      proxy.setupPositions({ children: [{ id: 'login-page', x: 0, y: 0 }] });

      mantineRenderAdapter({ ui: <ReactFlowDiagramWidget flow={flow} contracts={[]} /> });

      await waitFor(() => {
        expect(screen.queryByTestId('FLOW_NODE')).toBeInTheDocument();
      });

      expect(screen.queryByTestId('FLOW_NODE_BADGE')).toBe(null);
    });
  });

  describe('edge labels', () => {
    it('EMPTY: {edge without label} => no FLOW_EDGE_LABEL rendered', async () => {
      const proxy = ReactFlowDiagramWidgetProxy();
      const node1 = FlowNodeStub({
        id: FlowNodeIdStub({ value: 'login-page' }),
        type: 'state',
        observables: [],
      });
      const node2 = FlowNodeStub({
        id: FlowNodeIdStub({ value: 'dashboard' }),
        type: 'state',
        observables: [],
      });
      const edge = FlowEdgeStub({
        id: 'login-to-dash',
        from: 'login-page',
        to: 'dashboard',
        label: undefined,
      });
      const flow = FlowStub({ nodes: [node1, node2], edges: [edge] });

      proxy.setupPositions({
        children: [
          { id: 'login-page', x: 0, y: 0 },
          { id: 'dashboard', x: 200, y: 0 },
        ],
      });

      mantineRenderAdapter({ ui: <ReactFlowDiagramWidget flow={flow} /> });

      await waitFor(() => {
        expect(screen.queryByTestId('FLOW_DIAGRAM')).toBeInTheDocument();
      });

      expect(screen.queryByTestId('FLOW_EDGE_LABEL')).toBe(null);
    });

    it('VALID: {edge with label} => FLOW_EDGE_LABEL shows label text', async () => {
      const proxy = ReactFlowDiagramWidgetProxy();
      const node1 = FlowNodeStub({
        id: FlowNodeIdStub({ value: 'login-page' }),
        type: 'state',
        observables: [],
      });
      const node2 = FlowNodeStub({
        id: FlowNodeIdStub({ value: 'dashboard' }),
        type: 'state',
        observables: [],
      });
      const edge = FlowEdgeStub({
        id: 'login-to-dash',
        from: 'login-page',
        to: 'dashboard',
        label: 'success',
      });
      const flow = FlowStub({ nodes: [node1, node2], edges: [edge] });

      proxy.setupPositions({
        children: [
          { id: 'login-page', x: 0, y: 0 },
          { id: 'dashboard', x: 200, y: 0 },
        ],
      });

      mantineRenderAdapter({ ui: <ReactFlowDiagramWidget flow={flow} /> });

      await waitFor(() => {
        expect(screen.queryByTestId('FLOW_EDGE_LABEL')).toBeInTheDocument();
      });

      expect(screen.getByTestId('FLOW_EDGE_LABEL').textContent).toBe('success');
    });
  });

  describe('node selection', () => {
    it('VALID: {before any click} => no FLOW_NODE_DETAIL_PANEL', async () => {
      const proxy = ReactFlowDiagramWidgetProxy();
      const node = FlowNodeStub({
        id: FlowNodeIdStub({ value: 'login-page' }),
        type: 'state',
        observables: [],
      });
      const flow = FlowStub({ nodes: [node], edges: [] });

      proxy.setupPositions({ children: [{ id: 'login-page', x: 0, y: 0 }] });

      mantineRenderAdapter({ ui: <ReactFlowDiagramWidget flow={flow} /> });

      await waitFor(() => {
        expect(screen.queryByTestId('FLOW_NODE')).toBeInTheDocument();
      });

      expect(proxy.hasDetailPanel()).toBe(false);
    });

    it('VALID: {node clicked} => FLOW_NODE_DETAIL_PANEL appears with node label as heading', async () => {
      const proxy = ReactFlowDiagramWidgetProxy();
      const node = FlowNodeStub({
        id: FlowNodeIdStub({ value: 'login-page' }),
        label: 'Login Page',
        type: 'state',
        observables: [],
      });
      const flow = FlowStub({ nodes: [node], edges: [] });

      proxy.setupPositions({ children: [{ id: 'login-page', x: 0, y: 0 }] });

      mantineRenderAdapter({ ui: <ReactFlowDiagramWidget flow={flow} /> });

      await waitFor(() => {
        expect(screen.queryByTestId('FLOW_NODE')).toBeInTheDocument();
      });

      await proxy.clickNode({ nodeId: 'login-page' });

      expect(proxy.hasDetailPanel()).toBe(true);
      expect(proxy.getDetailPanelHeading()?.textContent).toBe('Login Page');
    });

    it('VALID: {node clicked} => FLOW_NODE gets data-selected="true"', async () => {
      const proxy = ReactFlowDiagramWidgetProxy();
      const node = FlowNodeStub({
        id: FlowNodeIdStub({ value: 'login-page' }),
        type: 'state',
        observables: [],
      });
      const flow = FlowStub({ nodes: [node], edges: [] });

      proxy.setupPositions({ children: [{ id: 'login-page', x: 0, y: 0 }] });

      mantineRenderAdapter({ ui: <ReactFlowDiagramWidget flow={flow} /> });

      await waitFor(() => {
        expect(screen.queryByTestId('FLOW_NODE')).toBeInTheDocument();
      });

      await proxy.clickNode({ nodeId: 'login-page' });

      expect(screen.getByTestId('FLOW_NODE').getAttribute('data-selected')).toBe('true');
    });

    it('VALID: {second node clicked} => panel replaces with second node heading', async () => {
      const proxy = ReactFlowDiagramWidgetProxy();
      const node1 = FlowNodeStub({
        id: FlowNodeIdStub({ value: 'login-page' }),
        label: 'Login Page',
        type: 'state',
        observables: [],
      });
      const node2 = FlowNodeStub({
        id: FlowNodeIdStub({ value: 'dashboard' }),
        label: 'Dashboard',
        type: 'action',
        observables: [],
      });
      const flow = FlowStub({ nodes: [node1, node2], edges: [] });

      proxy.setupPositions({
        children: [
          { id: 'login-page', x: 0, y: 0 },
          { id: 'dashboard', x: 200, y: 0 },
        ],
      });

      mantineRenderAdapter({ ui: <ReactFlowDiagramWidget flow={flow} /> });

      await waitFor(() => {
        expect(screen.queryByTestId('FLOW_DIAGRAM')).toBeInTheDocument();
      });

      await proxy.clickNode({ nodeId: 'login-page' });

      expect(proxy.getDetailPanelHeading()?.textContent).toBe('Login Page');

      await proxy.clickNode({ nodeId: 'dashboard' });

      expect(proxy.getDetailPanelHeading()?.textContent).toBe('Dashboard');
    });
  });

  describe('panel content', () => {
    it('VALID: {node with matching contract} => panel shows contract name and property as "name: type"', async () => {
      const proxy = ReactFlowDiagramWidgetProxy();
      const nodeId = FlowNodeIdStub({ value: 'login-page' });
      const node = FlowNodeStub({ id: nodeId, type: 'state', observables: [] });
      const flow = FlowStub({ nodes: [node], edges: [] });
      const contract = QuestContractEntryStub({
        nodeId,
        name: 'LoginCredentials',
        properties: [{ name: 'email', type: 'EmailAddress', description: 'User email' }],
      });

      proxy.setupPositions({ children: [{ id: 'login-page', x: 0, y: 0 }] });

      mantineRenderAdapter({ ui: <ReactFlowDiagramWidget flow={flow} contracts={[contract]} /> });

      await waitFor(() => {
        expect(screen.queryByTestId('FLOW_NODE')).toBeInTheDocument();
      });

      await proxy.clickNode({ nodeId: 'login-page' });

      expect(screen.getByTestId('FLOW_DETAIL_PANEL_CONTRACT_NAME').textContent).toBe(
        'LoginCredentials',
      );
      expect(screen.getByTestId('FLOW_DETAIL_PANEL_CONTRACT_PROPERTY').textContent).toBe(
        'email: EmailAddress',
      );
    });

    it('EMPTY: {node with no contracts} => panel shows empty message', async () => {
      const proxy = ReactFlowDiagramWidgetProxy();
      const nodeId = FlowNodeIdStub({ value: 'login-page' });
      const node = FlowNodeStub({ id: nodeId, type: 'state', observables: [] });
      const flow = FlowStub({ nodes: [node], edges: [] });

      proxy.setupPositions({ children: [{ id: 'login-page', x: 0, y: 0 }] });

      mantineRenderAdapter({ ui: <ReactFlowDiagramWidget flow={flow} contracts={[]} /> });

      await waitFor(() => {
        expect(screen.queryByTestId('FLOW_NODE')).toBeInTheDocument();
      });

      await proxy.clickNode({ nodeId: 'login-page' });

      expect(screen.getByTestId('FLOW_DETAIL_PANEL_EMPTY').textContent).toBe(
        'No contracts or comments for this box',
      );
    });
  });

  describe('assertion nodes', () => {
    it('VALID: {node with 3 observables} => all 3 assertion cards branch onto the canvas', async () => {
      const proxy = ReactFlowDiagramWidgetProxy();
      const node = FlowNodeStub({
        id: FlowNodeIdStub({ value: 'login-page' }),
        type: 'state',
        observables: [
          FlowObservableStub({
            id: 'shows-form',
            type: 'ui-state',
            description: 'shows login form',
          }),
          FlowObservableStub({
            id: 'posts-creds',
            type: 'api-call',
            description: 'POSTs credentials',
          }),
          FlowObservableStub({
            id: 'redirects',
            type: 'ui-state',
            description: 'redirects to dashboard',
          }),
        ],
      });
      const flow = FlowStub({ nodes: [node], edges: [] });

      proxy.setupPositions({ children: [{ id: 'login-page', x: 0, y: 0 }] });

      mantineRenderAdapter({ ui: <ReactFlowDiagramWidget flow={flow} /> });

      await waitFor(() => {
        expect(proxy.getObservableDescriptions().map((el) => el.textContent)).toStrictEqual([
          'shows login form',
          'POSTs credentials',
          'redirects to dashboard',
        ]);
      });

      expect(proxy.getObservableTypeTags().map((el) => el.textContent)).toStrictEqual([
        'ui-state',
        'api-call',
        'ui-state',
      ]);
    });

    it('VALID: {assertion node clicked} => detail panel opens headed by that assertion description', async () => {
      const proxy = ReactFlowDiagramWidgetProxy();
      const node = FlowNodeStub({
        id: FlowNodeIdStub({ value: 'login-page' }),
        type: 'state',
        observables: [
          FlowObservableStub({
            id: 'redirects',
            type: 'ui-state',
            description: 'redirects to dashboard',
          }),
        ],
      });
      const flow = FlowStub({ nodes: [node], edges: [] });

      proxy.setupPositions({ children: [{ id: 'login-page', x: 0, y: 0 }] });

      mantineRenderAdapter({ ui: <ReactFlowDiagramWidget flow={flow} /> });

      await waitFor(() => {
        expect(screen.queryByTestId('FLOW_OBSERVABLE_NODE')).toBeInTheDocument();
      });

      await proxy.clickObservableNode({ nodeId: 'login-page', observableId: 'redirects' });

      expect(proxy.getDetailPanelHeading()?.textContent).toBe('redirects to dashboard');
    });

    it('VALID: {assertion node clicked} => its parent FLOW_NODE card is left unselected', async () => {
      const proxy = ReactFlowDiagramWidgetProxy();
      const node = FlowNodeStub({
        id: FlowNodeIdStub({ value: 'login-page' }),
        type: 'state',
        observables: [
          FlowObservableStub({
            id: 'redirects',
            type: 'ui-state',
            description: 'redirects to dashboard',
          }),
        ],
      });
      const flow = FlowStub({ nodes: [node], edges: [] });

      proxy.setupPositions({ children: [{ id: 'login-page', x: 0, y: 0 }] });

      mantineRenderAdapter({ ui: <ReactFlowDiagramWidget flow={flow} /> });

      await waitFor(() => {
        expect(screen.queryByTestId('FLOW_OBSERVABLE_NODE')).toBeInTheDocument();
      });

      await proxy.clickObservableNode({ nodeId: 'login-page', observableId: 'redirects' });

      expect(screen.getByTestId('FLOW_NODE').getAttribute('data-selected')).toBe(null);
    });
  });

  describe('persisted comments', () => {
    it('VALID: {node carrying two comments} => COMMENT_COUNT_BADGE on the FLOW_NODE card reads 2', async () => {
      const proxy = ReactFlowDiagramWidgetProxy();
      const node = FlowNodeStub({
        id: FlowNodeIdStub({ value: 'login-page' }),
        type: 'state',
        observables: [],
      });
      const flow = FlowStub({ id: 'login-flow', nodes: [node], edges: [] });

      proxy.setupPositions({ children: [{ id: 'login-page', x: 0, y: 0 }] });

      mantineRenderAdapter({
        ui: (
          <ReactFlowDiagramWidget
            flow={flow}
            comments={[
              QuestCommentStub({
                id: 'aaaaaaaa-58cc-4372-a567-0e02b2c3d479',
                flowId: 'login-flow',
                nodeId: 'login-page',
                text: 'older note',
                createdAt: '2026-01-01T00:00:00.000Z',
              }),
              QuestCommentStub({
                id: 'bbbbbbbb-58cc-4372-a567-0e02b2c3d479',
                flowId: 'login-flow',
                nodeId: 'login-page',
                text: 'newer note',
                createdAt: '2026-02-01T00:00:00.000Z',
              }),
            ]}
          />
        ),
      });

      await waitFor(() => {
        expect(screen.queryByTestId('FLOW_NODE')).toBeInTheDocument();
      });

      expect(proxy.getCommentBadgeTextsOn({ testId: 'FLOW_NODE' })).toStrictEqual(['2']);
    });

    it('EMPTY: {node carrying no comments} => no COMMENT_COUNT_BADGE on the FLOW_NODE card', async () => {
      const proxy = ReactFlowDiagramWidgetProxy();
      const node = FlowNodeStub({
        id: FlowNodeIdStub({ value: 'login-page' }),
        type: 'state',
        observables: [],
      });
      const flow = FlowStub({ id: 'login-flow', nodes: [node], edges: [] });

      proxy.setupPositions({ children: [{ id: 'login-page', x: 0, y: 0 }] });

      mantineRenderAdapter({ ui: <ReactFlowDiagramWidget flow={flow} comments={[]} /> });

      await waitFor(() => {
        expect(screen.queryByTestId('FLOW_NODE')).toBeInTheDocument();
      });

      expect(proxy.getCommentBadgeTextsOn({ testId: 'FLOW_NODE' })).toStrictEqual([]);
    });

    it('VALID: {observable carrying one comment} => COMMENT_COUNT_BADGE on the FLOW_OBSERVABLE_NODE card reads 1 and the node card carries none', async () => {
      const proxy = ReactFlowDiagramWidgetProxy();
      const node = FlowNodeStub({
        id: FlowNodeIdStub({ value: 'login-page' }),
        type: 'state',
        observables: [
          FlowObservableStub({
            id: 'redirects',
            type: 'ui-state',
            description: 'redirects to dashboard',
          }),
        ],
      });
      const flow = FlowStub({ id: 'login-flow', nodes: [node], edges: [] });

      proxy.setupPositions({ children: [{ id: 'login-page', x: 0, y: 0 }] });

      mantineRenderAdapter({
        ui: (
          <ReactFlowDiagramWidget
            flow={flow}
            comments={[
              QuestCommentStub({
                flowId: 'login-flow',
                nodeId: 'login-page',
                observableId: 'redirects',
                text: 'this assertion is wrong',
                createdAt: '2026-01-01T00:00:00.000Z',
              }),
            ]}
          />
        ),
      });

      await waitFor(() => {
        expect(screen.queryByTestId('FLOW_OBSERVABLE_NODE')).toBeInTheDocument();
      });

      expect(proxy.getCommentBadgeTextsOn({ testId: 'FLOW_OBSERVABLE_NODE' })).toStrictEqual(['1']);
      expect(proxy.getCommentBadgeTextsOn({ testId: 'FLOW_NODE' })).toStrictEqual([]);
    });

    it('VALID: {node clicked} => FLOW_DETAIL_PANEL_COMMENTS lists its comments newest first', async () => {
      const proxy = ReactFlowDiagramWidgetProxy();
      const node = FlowNodeStub({
        id: FlowNodeIdStub({ value: 'login-page' }),
        type: 'state',
        observables: [],
      });
      const flow = FlowStub({ id: 'login-flow', nodes: [node], edges: [] });

      proxy.setupPositions({ children: [{ id: 'login-page', x: 0, y: 0 }] });

      mantineRenderAdapter({
        ui: (
          <ReactFlowDiagramWidget
            flow={flow}
            comments={[
              QuestCommentStub({
                id: 'aaaaaaaa-58cc-4372-a567-0e02b2c3d479',
                flowId: 'login-flow',
                nodeId: 'login-page',
                text: 'older note',
                createdAt: '2026-01-01T00:00:00.000Z',
              }),
              QuestCommentStub({
                id: 'bbbbbbbb-58cc-4372-a567-0e02b2c3d479',
                flowId: 'login-flow',
                nodeId: 'login-page',
                text: 'newer note',
                createdAt: '2026-02-01T00:00:00.000Z',
              }),
            ]}
          />
        ),
      });

      await waitFor(() => {
        expect(screen.queryByTestId('FLOW_NODE')).toBeInTheDocument();
      });

      await proxy.clickNode({ nodeId: 'login-page' });

      expect(proxy.getPanelCommentTexts()).toStrictEqual(['newer note', 'older note']);
    });

    it('VALID: {node clicked} => its observables comments are absent from the node panel', async () => {
      const proxy = ReactFlowDiagramWidgetProxy();
      const node = FlowNodeStub({
        id: FlowNodeIdStub({ value: 'login-page' }),
        type: 'state',
        observables: [
          FlowObservableStub({
            id: 'redirects',
            type: 'ui-state',
            description: 'redirects to dashboard',
          }),
        ],
      });
      const flow = FlowStub({ id: 'login-flow', nodes: [node], edges: [] });

      proxy.setupPositions({ children: [{ id: 'login-page', x: 0, y: 0 }] });

      mantineRenderAdapter({
        ui: (
          <ReactFlowDiagramWidget
            flow={flow}
            comments={[
              QuestCommentStub({
                id: 'aaaaaaaa-58cc-4372-a567-0e02b2c3d479',
                flowId: 'login-flow',
                nodeId: 'login-page',
                text: 'note on the node',
                createdAt: '2026-01-01T00:00:00.000Z',
              }),
              QuestCommentStub({
                id: 'bbbbbbbb-58cc-4372-a567-0e02b2c3d479',
                flowId: 'login-flow',
                nodeId: 'login-page',
                observableId: 'redirects',
                text: 'note on the assertion',
                createdAt: '2026-02-01T00:00:00.000Z',
              }),
            ]}
          />
        ),
      });

      await waitFor(() => {
        expect(screen.queryByTestId('FLOW_NODE')).toBeInTheDocument();
      });

      await proxy.clickNode({ nodeId: 'login-page' });

      expect(proxy.getPanelCommentTexts()).toStrictEqual(['note on the node']);
    });

    it('VALID: {assertion card clicked} => the panel lists that assertion own comments only', async () => {
      const proxy = ReactFlowDiagramWidgetProxy();
      const node = FlowNodeStub({
        id: FlowNodeIdStub({ value: 'login-page' }),
        type: 'state',
        observables: [
          FlowObservableStub({
            id: 'redirects',
            type: 'ui-state',
            description: 'redirects to dashboard',
          }),
        ],
      });
      const flow = FlowStub({ id: 'login-flow', nodes: [node], edges: [] });

      proxy.setupPositions({ children: [{ id: 'login-page', x: 0, y: 0 }] });

      mantineRenderAdapter({
        ui: (
          <ReactFlowDiagramWidget
            flow={flow}
            comments={[
              QuestCommentStub({
                id: 'aaaaaaaa-58cc-4372-a567-0e02b2c3d479',
                flowId: 'login-flow',
                nodeId: 'login-page',
                text: 'note on the node',
                createdAt: '2026-01-01T00:00:00.000Z',
              }),
              QuestCommentStub({
                id: 'bbbbbbbb-58cc-4372-a567-0e02b2c3d479',
                flowId: 'login-flow',
                nodeId: 'login-page',
                observableId: 'redirects',
                text: 'note on the assertion',
                createdAt: '2026-02-01T00:00:00.000Z',
              }),
            ]}
          />
        ),
      });

      await waitFor(() => {
        expect(screen.queryByTestId('FLOW_OBSERVABLE_NODE')).toBeInTheDocument();
      });

      await proxy.clickObservableNode({ nodeId: 'login-page', observableId: 'redirects' });

      expect(proxy.getPanelCommentTexts()).toStrictEqual(['note on the assertion']);
    });

    it('EMPTY: {node with contracts but no comments clicked} => FLOW_DETAIL_PANEL_COMMENTS absent while contract rows still render', async () => {
      const proxy = ReactFlowDiagramWidgetProxy();
      const node = FlowNodeStub({
        id: FlowNodeIdStub({ value: 'login-page' }),
        type: 'state',
        observables: [],
      });
      const flow = FlowStub({ id: 'login-flow', nodes: [node], edges: [] });
      const contracts = [QuestContractEntryStub({ nodeId: 'login-page' })];

      proxy.setupPositions({ children: [{ id: 'login-page', x: 0, y: 0 }] });

      mantineRenderAdapter({
        ui: <ReactFlowDiagramWidget flow={flow} contracts={contracts} comments={[]} />,
      });

      await waitFor(() => {
        expect(screen.queryByTestId('FLOW_NODE')).toBeInTheDocument();
      });

      await proxy.clickNode({ nodeId: 'login-page' });

      expect(proxy.hasCommentsSection()).toBe(false);
      expect(screen.queryByTestId('FLOW_DETAIL_PANEL_CONTRACTS')).toBeInTheDocument();
    });
  });

  describe('selection resolved against the live flow', () => {
    it('VALID: {selected node removed from the flow while its panel is open} => the panel closes instead of stranding on a box that no longer exists', async () => {
      const proxy = ReactFlowDiagramWidgetProxy();
      const node = FlowNodeStub({
        id: FlowNodeIdStub({ value: 'login-page' }),
        label: 'Login Page',
        type: 'state',
        observables: [],
      });
      const survivor = FlowNodeStub({
        id: FlowNodeIdStub({ value: 'dashboard' }),
        label: 'Dashboard',
        type: 'terminal',
        observables: [],
      });
      const comments = [
        QuestCommentStub({
          id: 'aaaaaaaa-58cc-4372-a567-0e02b2c3d479',
          flowId: 'login-flow',
          nodeId: 'login-page',
          text: 'note on the doomed node',
          createdAt: '2026-01-01T00:00:00.000Z',
        }),
      ];

      proxy.setupPositions({
        children: [
          { id: 'login-page', x: 0, y: 0 },
          { id: 'dashboard', x: 0, y: 200 },
        ],
      });

      const rendered = mantineRenderAdapter({
        ui: (
          <ReactFlowDiagramWidget
            flow={FlowStub({ id: 'login-flow', nodes: [node, survivor], edges: [] })}
            comments={comments}
          />
        ),
      });

      await waitFor(() => {
        expect(screen.getAllByTestId('FLOW_NODE_LABEL').map((el) => el.textContent)).toStrictEqual([
          'Login Page',
          'Dashboard',
        ]);
      });

      await proxy.clickNode({ nodeId: 'login-page' });

      expect(proxy.getPanelCommentTexts()).toStrictEqual(['note on the doomed node']);

      // An agent turn deletes the selected node from the spec. The comment stays on the quest
      // (orphan cleanup is a write-time concern), so nothing but the live-flow lookup stops the
      // panel from stranding on a box the canvas no longer draws.
      rendered.rerender(
        <ReactFlowDiagramWidget
          flow={FlowStub({ id: 'login-flow', nodes: [survivor], edges: [] })}
          comments={comments}
        />,
      );

      expect(screen.getAllByTestId('FLOW_NODE_LABEL').map((el) => el.textContent)).toStrictEqual([
        'Dashboard',
      ]);
      expect(proxy.hasDetailPanel()).toBe(false);
      expect(proxy.getPanelCommentTexts()).toStrictEqual([]);
    });

    it('VALID: {selected assertion removed from its node while its panel is open} => the panel closes rather than falling back to the parent node own comments', async () => {
      const proxy = ReactFlowDiagramWidgetProxy();
      const observable = FlowObservableStub({
        id: 'redirects',
        type: 'ui-state',
        description: 'redirects to dashboard',
      });
      const comments = [
        QuestCommentStub({
          id: 'aaaaaaaa-58cc-4372-a567-0e02b2c3d479',
          flowId: 'login-flow',
          nodeId: 'login-page',
          text: 'note on the parent node',
          createdAt: '2026-01-01T00:00:00.000Z',
        }),
        QuestCommentStub({
          id: 'bbbbbbbb-58cc-4372-a567-0e02b2c3d479',
          flowId: 'login-flow',
          nodeId: 'login-page',
          observableId: 'redirects',
          text: 'note on the doomed assertion',
          createdAt: '2026-02-01T00:00:00.000Z',
        }),
      ];

      proxy.setupPositions({ children: [{ id: 'login-page', x: 0, y: 0 }] });

      const rendered = mantineRenderAdapter({
        ui: (
          <ReactFlowDiagramWidget
            flow={FlowStub({
              id: 'login-flow',
              nodes: [
                FlowNodeStub({
                  id: FlowNodeIdStub({ value: 'login-page' }),
                  type: 'state',
                  observables: [observable],
                }),
              ],
              edges: [],
            })}
            comments={comments}
          />
        ),
      });

      await waitFor(() => {
        expect(screen.queryByTestId('FLOW_OBSERVABLE_NODE')).toBeInTheDocument();
      });

      await proxy.clickObservableNode({ nodeId: 'login-page', observableId: 'redirects' });

      expect(proxy.getPanelCommentTexts()).toStrictEqual(['note on the doomed assertion']);

      // The assertion disappears but its PARENT NODE survives, so the dangerous failure is a
      // silent fallback to the node's panel — the reader would be shown another box's comments
      // under a heading they never clicked.
      rendered.rerender(
        <ReactFlowDiagramWidget
          flow={FlowStub({
            id: 'login-flow',
            nodes: [
              FlowNodeStub({
                id: FlowNodeIdStub({ value: 'login-page' }),
                type: 'state',
                observables: [],
              }),
            ],
            edges: [],
          })}
          comments={comments}
        />,
      );

      expect(proxy.hasDetailPanel()).toBe(false);
      expect(proxy.getPanelCommentTexts()).toStrictEqual([]);
    });
  });

  describe('panel dismissal', () => {
    it('VALID: {ESC pressed after selection} => panel removed and node deselected', async () => {
      const proxy = ReactFlowDiagramWidgetProxy();
      const node = FlowNodeStub({
        id: FlowNodeIdStub({ value: 'login-page' }),
        type: 'state',
        observables: [],
      });
      const flow = FlowStub({ nodes: [node], edges: [] });

      proxy.setupPositions({ children: [{ id: 'login-page', x: 0, y: 0 }] });

      mantineRenderAdapter({ ui: <ReactFlowDiagramWidget flow={flow} /> });

      await waitFor(() => {
        expect(screen.queryByTestId('FLOW_NODE')).toBeInTheDocument();
      });

      await proxy.clickNode({ nodeId: 'login-page' });

      expect(proxy.hasDetailPanel()).toBe(true);

      await proxy.pressEsc();

      expect(proxy.hasDetailPanel()).toBe(false);
      expect(screen.getByTestId('FLOW_NODE').getAttribute('data-selected')).toBe(null);
    });

    it('VALID: {close button clicked} => panel removed', async () => {
      const user = userEvent.setup();
      const proxy = ReactFlowDiagramWidgetProxy();
      const node = FlowNodeStub({
        id: FlowNodeIdStub({ value: 'login-page' }),
        type: 'state',
        observables: [],
      });
      const flow = FlowStub({ nodes: [node], edges: [] });

      proxy.setupPositions({ children: [{ id: 'login-page', x: 0, y: 0 }] });

      mantineRenderAdapter({ ui: <ReactFlowDiagramWidget flow={flow} /> });

      await waitFor(() => {
        expect(screen.queryByTestId('FLOW_NODE')).toBeInTheDocument();
      });

      await proxy.clickNode({ nodeId: 'login-page' });

      expect(proxy.hasDetailPanel()).toBe(true);

      await user.click(screen.getByTestId('FLOW_DETAIL_PANEL_CLOSE'));

      expect(proxy.hasDetailPanel()).toBe(false);
    });
  });

  describe('controls', () => {
    it('VALID: {diagram rendered} => ZOOM_IN, ZOOM_OUT, FIT_VIEW, FULLSCREEN buttons present', async () => {
      const proxy = ReactFlowDiagramWidgetProxy();
      const node = FlowNodeStub({
        id: FlowNodeIdStub({ value: 'login-page' }),
        type: 'state',
        observables: [],
      });
      const flow = FlowStub({ nodes: [node], edges: [] });

      proxy.setupPositions({ children: [{ id: 'login-page', x: 0, y: 0 }] });

      mantineRenderAdapter({ ui: <ReactFlowDiagramWidget flow={flow} /> });

      await waitFor(() => {
        expect(screen.queryByTestId('FLOW_DIAGRAM')).toBeInTheDocument();
      });

      expect(screen.getByTestId('ZOOM_IN_BUTTON')).toBeInTheDocument();
      expect(screen.getByTestId('ZOOM_OUT_BUTTON')).toBeInTheDocument();
      expect(screen.getByTestId('FIT_VIEW_BUTTON')).toBeInTheDocument();
      expect(screen.getByTestId('FULLSCREEN_BUTTON')).toBeInTheDocument();
    });

    it('VALID: {fullscreen clicked} => canvas wrapper pins a DEFINITE near-viewport height', async () => {
      const proxy = ReactFlowDiagramWidgetProxy();
      const node = FlowNodeStub({
        id: FlowNodeIdStub({ value: 'login-page' }),
        type: 'state',
        observables: [],
      });
      const flow = FlowStub({ nodes: [node], edges: [] });

      proxy.setupPositions({ children: [{ id: 'login-page', x: 0, y: 0 }] });

      mantineRenderAdapter({ ui: <ReactFlowDiagramWidget flow={flow} /> });

      await waitFor(() => {
        expect(screen.queryByTestId('FLOW_DIAGRAM')).toBeInTheDocument();
      });

      const wrapperBefore = screen.getByTestId('FLOW_DIAGRAM_CANVAS_WRAPPER');

      // Collapsed state pins a DEFINITE height so the React Flow canvas can size itself; a
      // bare maxHeight collapses the canvas to 0px.
      expect({
        height: wrapperBefore.style.height,
        minHeight: wrapperBefore.style.minHeight,
      }).toStrictEqual({ height: '800px', minHeight: '' });

      await proxy.clickFullscreen();

      const wrapperAfter = screen.getByTestId('FLOW_DIAGRAM_CANVAS_WRAPPER');

      // Expanded must ALSO pin a definite `height` (not minHeight) — React Flow's height:100%
      // canvas resolves against `height`, so a minHeight-only wrapper collapses it to 0px.
      expect({
        minHeight: wrapperAfter.style.minHeight,
        height: wrapperAfter.style.height,
      }).toStrictEqual({ minHeight: '', height: 'calc(100vh - 160px)' });
    });

    it('VALID: {fullscreen clicked twice} => canvas wrapper restores definite height 400', async () => {
      const proxy = ReactFlowDiagramWidgetProxy();
      const node = FlowNodeStub({
        id: FlowNodeIdStub({ value: 'login-page' }),
        type: 'state',
        observables: [],
      });
      const flow = FlowStub({ nodes: [node], edges: [] });

      proxy.setupPositions({ children: [{ id: 'login-page', x: 0, y: 0 }] });

      mantineRenderAdapter({ ui: <ReactFlowDiagramWidget flow={flow} /> });

      await waitFor(() => {
        expect(screen.queryByTestId('FLOW_DIAGRAM')).toBeInTheDocument();
      });

      await proxy.clickFullscreen();
      await proxy.clickFullscreen();

      const wrapper = screen.getByTestId('FLOW_DIAGRAM_CANVAS_WRAPPER');

      expect({
        height: wrapper.style.height,
        minHeight: wrapper.style.minHeight,
      }).toStrictEqual({ height: '800px', minHeight: '' });
    });

    it('VALID: {diagram collapsed} => FULLSCREEN_BUTTON data-expanded is false', async () => {
      const proxy = ReactFlowDiagramWidgetProxy();
      const node = FlowNodeStub({
        id: FlowNodeIdStub({ value: 'login-page' }),
        type: 'state',
        observables: [],
      });
      const flow = FlowStub({ nodes: [node], edges: [] });

      proxy.setupPositions({ children: [{ id: 'login-page', x: 0, y: 0 }] });

      mantineRenderAdapter({ ui: <ReactFlowDiagramWidget flow={flow} /> });

      await waitFor(() => {
        expect(screen.queryByTestId('FLOW_DIAGRAM')).toBeInTheDocument();
      });

      expect(proxy.isExpanded()).toBe(false);
    });

    it('VALID: {fullscreen clicked} => FULLSCREEN_BUTTON data-expanded is true', async () => {
      const proxy = ReactFlowDiagramWidgetProxy();
      const node = FlowNodeStub({
        id: FlowNodeIdStub({ value: 'login-page' }),
        type: 'state',
        observables: [],
      });
      const flow = FlowStub({ nodes: [node], edges: [] });

      proxy.setupPositions({ children: [{ id: 'login-page', x: 0, y: 0 }] });

      mantineRenderAdapter({ ui: <ReactFlowDiagramWidget flow={flow} /> });

      await waitFor(() => {
        expect(screen.queryByTestId('FLOW_DIAGRAM')).toBeInTheDocument();
      });

      await proxy.clickFullscreen();

      expect(proxy.isExpanded()).toBe(true);
    });
  });

  describe('contracts prop default', () => {
    it('VALID: {contracts prop omitted} => renders without error (default = [])', async () => {
      const proxy = ReactFlowDiagramWidgetProxy();
      const node = FlowNodeStub({
        id: FlowNodeIdStub({ value: 'login-page' }),
        type: 'state',
        observables: [],
      });
      const flow = FlowStub({ nodes: [node], edges: [] });

      proxy.setupPositions({ children: [{ id: 'login-page', x: 0, y: 0 }] });

      mantineRenderAdapter({ ui: <ReactFlowDiagramWidget flow={flow} /> });

      await waitFor(() => {
        expect(screen.queryByTestId('FLOW_DIAGRAM')).toBeInTheDocument();
      });

      await proxy.clickNode({ nodeId: 'login-page' });

      // Panel renders the empty-state message (not a contract error) confirming contracts defaulted to [].
      expect(screen.getByTestId('FLOW_DETAIL_PANEL_EMPTY').textContent).toBe(
        'No contracts or comments for this box',
      );
    });
  });

  describe('useEffect hasRun guard', () => {
    it('VALID: {layout resolves once then flow re-renders} => no second layout call, diagram stays visible', async () => {
      const proxy = ReactFlowDiagramWidgetProxy();
      const node = FlowNodeStub({
        id: FlowNodeIdStub({ value: 'login-page' }),
        type: 'state',
        observables: [],
      });
      const flow = FlowStub({ nodes: [node], edges: [] });

      // Only one positions response is queued. If the guard is absent a second effect
      // run would call the mock a second time with no configured return, reject, and
      // flip the component to FLOW_DIAGRAM_ERROR.
      proxy.setupPositions({ children: [{ id: 'login-page', x: 0, y: 0 }] });

      const { rerender } = mantineRenderAdapter({ ui: <ReactFlowDiagramWidget flow={flow} /> });

      await waitFor(() => {
        expect(screen.queryByTestId('FLOW_DIAGRAM')).toBeInTheDocument();
      });

      rerender(<ReactFlowDiagramWidget flow={flow} />);

      // Diagram remains visible; no error shown means the layout mock was not called again.
      expect(screen.queryByTestId('FLOW_DIAGRAM_ERROR')).toBe(null);
      expect(screen.getByTestId('FLOW_DIAGRAM')).toBeInTheDocument();
    });
  });

  describe('comment buttons', () => {
    it('VALID: {commentQuestId set} => every flow card and assertion card carries a COMMENT_BUTTON while the portal carries none', async () => {
      const proxy = ReactFlowDiagramWidgetProxy();
      proxy.setupEmptyQueue();
      const node = FlowNodeStub({
        id: FlowNodeIdStub({ value: 'login-page' }),
        type: 'state',
        observables: [
          FlowObservableStub({
            id: 'redirects',
            type: 'ui-state',
            description: 'redirects to dashboard',
          }),
        ],
      });
      const flow = FlowStub({
        id: 'login-flow',
        nodes: [node],
        edges: [FlowEdgeStub({ id: 'to-compile', from: 'login-page', to: 'compile-flow:entry' })],
      });

      proxy.setupPositions({
        children: [
          { id: 'login-page', x: 0, y: 0 },
          { id: 'compile-flow:entry', x: 0, y: 200 },
        ],
      });

      mantineRenderAdapter({
        ui: (
          <ReactFlowDiagramWidget flow={flow} commentQuestId={QuestIdStub({ value: 'quest-a' })} />
        ),
      });

      await waitFor(() => {
        expect(screen.queryByTestId('FLOW_PORTAL_NODE')).toBeInTheDocument();
      });

      expect(proxy.countCommentButtonsOn({ testId: 'FLOW_NODE' })).toBe(1);
      expect(proxy.countCommentButtonsOn({ testId: 'FLOW_OBSERVABLE_NODE' })).toBe(1);
      expect(proxy.countCommentButtonsOn({ testId: 'FLOW_PORTAL_NODE' })).toBe(0);
    });

    it('EMPTY: {commentQuestId absent} => the whole diagram renders zero COMMENT_BUTTON elements', async () => {
      const proxy = ReactFlowDiagramWidgetProxy();
      proxy.setupEmptyQueue();
      const node = FlowNodeStub({
        id: FlowNodeIdStub({ value: 'login-page' }),
        type: 'state',
        observables: [
          FlowObservableStub({
            id: 'redirects',
            type: 'ui-state',
            description: 'redirects to dashboard',
          }),
        ],
      });
      const flow = FlowStub({ id: 'login-flow', nodes: [node], edges: [] });

      proxy.setupPositions({ children: [{ id: 'login-page', x: 0, y: 0 }] });

      mantineRenderAdapter({ ui: <ReactFlowDiagramWidget flow={flow} /> });

      await waitFor(() => {
        expect(screen.queryByTestId('FLOW_OBSERVABLE_NODE')).toBeInTheDocument();
      });

      expect(proxy.countCommentButtons()).toBe(0);
    });
  });
});
