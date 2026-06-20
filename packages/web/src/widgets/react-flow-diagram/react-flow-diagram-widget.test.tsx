import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import {
  FlowEdgeStub,
  FlowNodeIdStub,
  FlowNodeStub,
  FlowObservableStub,
  FlowStub,
  QuestContractEntryStub,
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
    it('VALID: {decision node} => card accent style matches #f5a623', async () => {
      const proxy = ReactFlowDiagramWidgetProxy();
      const node = FlowNodeStub({
        id: FlowNodeIdStub({ value: 'branch-node' }),
        type: 'decision',
        observables: [],
      });
      const flow = FlowStub({ nodes: [node], edges: [] });

      proxy.setupPositions({ children: [{ id: 'branch-node', x: 0, y: 0 }] });

      mantineRenderAdapter({ ui: <ReactFlowDiagramWidget flow={flow} /> });

      await waitFor(() => {
        expect(screen.queryByTestId('FLOW_NODE')).toBeInTheDocument();
      });

      expect(screen.getByTestId('FLOW_NODE').getAttribute('data-accent-color')).toBe(
        flowNodeStyleStatics.accent.decision,
      );
    });

    it('VALID: {action node} => card accent style matches #4aa3df', async () => {
      const proxy = ReactFlowDiagramWidgetProxy();
      const node = FlowNodeStub({
        id: FlowNodeIdStub({ value: 'fetch-action' }),
        type: 'action',
        observables: [],
      });
      const flow = FlowStub({ nodes: [node], edges: [] });

      proxy.setupPositions({ children: [{ id: 'fetch-action', x: 0, y: 0 }] });

      mantineRenderAdapter({ ui: <ReactFlowDiagramWidget flow={flow} /> });

      await waitFor(() => {
        expect(screen.queryByTestId('FLOW_NODE')).toBeInTheDocument();
      });

      expect(screen.getByTestId('FLOW_NODE').getAttribute('data-accent-color')).toBe(
        flowNodeStyleStatics.accent.action,
      );
    });

    it('VALID: {state node} => card accent style matches #8b9bb4', async () => {
      const proxy = ReactFlowDiagramWidgetProxy();
      const node = FlowNodeStub({
        id: FlowNodeIdStub({ value: 'state-node' }),
        type: 'state',
        observables: [],
      });
      const flow = FlowStub({ nodes: [node], edges: [] });

      proxy.setupPositions({ children: [{ id: 'state-node', x: 0, y: 0 }] });

      mantineRenderAdapter({ ui: <ReactFlowDiagramWidget flow={flow} /> });

      await waitFor(() => {
        expect(screen.queryByTestId('FLOW_NODE')).toBeInTheDocument();
      });

      expect(screen.getByTestId('FLOW_NODE').getAttribute('data-accent-color')).toBe(
        flowNodeStyleStatics.accent.state,
      );
    });

    it('VALID: {terminal node} => card accent style matches #5bbf8a', async () => {
      const proxy = ReactFlowDiagramWidgetProxy();
      const node = FlowNodeStub({
        id: FlowNodeIdStub({ value: 'end-node' }),
        type: 'terminal',
        observables: [],
      });
      const flow = FlowStub({ nodes: [node], edges: [] });

      proxy.setupPositions({ children: [{ id: 'end-node', x: 0, y: 0 }] });

      mantineRenderAdapter({ ui: <ReactFlowDiagramWidget flow={flow} /> });

      await waitFor(() => {
        expect(screen.queryByTestId('FLOW_NODE')).toBeInTheDocument();
      });

      expect(screen.getByTestId('FLOW_NODE').getAttribute('data-accent-color')).toBe(
        flowNodeStyleStatics.accent.terminal,
      );
    });
  });

  describe('node badge', () => {
    it('VALID: {node with 2 observables} => FLOW_NODE_BADGE shows "2"', async () => {
      const proxy = ReactFlowDiagramWidgetProxy();
      const node = FlowNodeStub({
        id: FlowNodeIdStub({ value: 'login-page' }),
        type: 'state',
        observables: [
          FlowObservableStub({ description: 'shows login form' }),
          FlowObservableStub({ description: 'shows error on bad creds' }),
        ],
      });
      const flow = FlowStub({ nodes: [node], edges: [] });

      proxy.setupPositions({ children: [{ id: 'login-page', x: 0, y: 0 }] });

      mantineRenderAdapter({ ui: <ReactFlowDiagramWidget flow={flow} /> });

      await waitFor(() => {
        expect(screen.queryByTestId('FLOW_NODE_BADGE')).toBeInTheDocument();
      });

      expect(screen.getByTestId('FLOW_NODE_BADGE').textContent).toBe('2');
    });

    it('EMPTY: {node with 0 observables} => no FLOW_NODE_BADGE', async () => {
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

      expect(screen.queryByTestId('FLOW_NODE_BADGE')).toBe(null);
    });
  });

  describe('edge labels', () => {
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
    it('VALID: {node with observable} => panel shows observable type and description', async () => {
      const proxy = ReactFlowDiagramWidgetProxy();
      const observable = FlowObservableStub({
        type: 'ui-state',
        description: 'redirects to dashboard',
      });
      const node = FlowNodeStub({
        id: FlowNodeIdStub({ value: 'login-page' }),
        type: 'state',
        observables: [observable],
      });
      const flow = FlowStub({ nodes: [node], edges: [] });

      proxy.setupPositions({ children: [{ id: 'login-page', x: 0, y: 0 }] });

      mantineRenderAdapter({ ui: <ReactFlowDiagramWidget flow={flow} /> });

      await waitFor(() => {
        expect(screen.queryByTestId('FLOW_NODE')).toBeInTheDocument();
      });

      await proxy.clickNode({ nodeId: 'login-page' });

      expect(screen.getByTestId('FLOW_DETAIL_PANEL_OBSERVABLE_TYPE').textContent).toBe('ui-state');
      expect(screen.getByTestId('FLOW_DETAIL_PANEL_OBSERVABLE_DESCRIPTION').textContent).toBe(
        'redirects to dashboard',
      );
    });

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

    it('EMPTY: {node with no observables, no contracts} => panel shows empty message', async () => {
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
        'No observables or contracts for this node',
      );
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

    it('VALID: {fullscreen clicked} => canvas wrapper switches to minHeight mode', async () => {
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

      expect(wrapperBefore.style.maxHeight).toBe('400px');

      await proxy.clickFullscreen();

      const wrapperAfter = screen.getByTestId('FLOW_DIAGRAM_CANVAS_WRAPPER');

      expect({
        minHeight: wrapperAfter.style.minHeight,
        maxHeight: wrapperAfter.style.maxHeight,
      }).toStrictEqual({ minHeight: 'calc(100vh - 160px)', maxHeight: '' });
    });

    it('VALID: {fullscreen clicked twice} => canvas wrapper restores maxHeight 400', async () => {
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

      expect(wrapper.style.maxHeight).toBe('400px');
    });
  });
});
