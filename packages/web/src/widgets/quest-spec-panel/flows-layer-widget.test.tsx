import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import {
  FlowStub,
  FlowNodeStub,
  QuestCommentStub,
  QuestContractEntryStub,
  QuestIdStub,
} from '@dungeonmaster/shared/contracts';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';
import { FlowsLayerWidget } from './flows-layer-widget';
import { FlowsLayerWidgetProxy } from './flows-layer-widget.proxy';

type Flow = ReturnType<typeof FlowStub>;

// A flow an agent wrote with no name yet still reaches the panel, and the tab bar falls back to a
// positional label for it. FlowStub calls flowContract.parse() which enforces min(1), so the empty
// name is applied after the stub call via Object.assign.
const EmptyNameFlowStub = ({ id }: { id: string }): Flow =>
  Object.assign(FlowStub({ id: id as never }), { name: '' }) as Flow;

describe('FlowsLayerWidget', () => {
  describe('read mode', () => {
    it('VALID: {flows: [flow]} => renders flow name', () => {
      FlowsLayerWidgetProxy();
      const flow = FlowStub({ name: 'Login Flow' });

      mantineRenderAdapter({
        ui: <FlowsLayerWidget flows={[flow]} />,
      });

      expect(screen.getByTestId('FLOW_NAME').textContent).toBe('Login Flow');
    });

    it('VALID: {flows: [flow]} => renders flow entry point', () => {
      FlowsLayerWidgetProxy();
      const flow = FlowStub({ entryPoint: '/login' });

      mantineRenderAdapter({
        ui: <FlowsLayerWidget flows={[flow]} />,
      });

      expect(screen.getByTestId('FLOW_ENTRY_POINT').textContent).toBe('entry: /login');
    });

    it('VALID: {flows: [flow]} => renders flow exit points', () => {
      FlowsLayerWidgetProxy();
      const flow = FlowStub({ exitPoints: ['/dashboard', '/settings'] });

      mantineRenderAdapter({
        ui: <FlowsLayerWidget flows={[flow]} />,
      });

      expect(screen.getByTestId('FLOW_EXIT_POINTS').textContent).toBe(
        'exit: /dashboard, /settings',
      );
    });

    it('VALID: {flows: [flow with scope]} => renders flow scope in dim text', () => {
      FlowsLayerWidgetProxy();
      const flow = FlowStub({ scope: 'packages/web' as never });

      mantineRenderAdapter({
        ui: <FlowsLayerWidget flows={[flow]} />,
      });

      expect(screen.getByTestId('FLOW_SCOPE').textContent).toBe('packages/web');
    });

    it('VALID: {flows: [flow without scope]} => does not render scope element', () => {
      FlowsLayerWidgetProxy();
      const flow = FlowStub();

      mantineRenderAdapter({
        ui: <FlowsLayerWidget flows={[flow]} />,
      });

      expect(screen.queryByTestId('FLOW_SCOPE')).toBe(null);
    });

    it('VALID: {flows: [runtime flow]} => renders FLOW_TYPE_BADGE with "runtime" text', () => {
      FlowsLayerWidgetProxy();
      const flow = FlowStub({ flowType: 'runtime' });

      mantineRenderAdapter({
        ui: <FlowsLayerWidget flows={[flow]} />,
      });

      expect(screen.getByTestId('FLOW_TYPE_BADGE').textContent).toBe('runtime');
    });

    it('VALID: {flows: [operational flow]} => renders FLOW_TYPE_BADGE with "operational" text', () => {
      FlowsLayerWidgetProxy();
      const flow = FlowStub({ flowType: 'operational' });

      mantineRenderAdapter({
        ui: <FlowsLayerWidget flows={[flow]} />,
      });

      expect(screen.getByTestId('FLOW_TYPE_BADGE').textContent).toBe('operational');
    });

    it('VALID: {flows: [runtime, operational]} => one tab per flow; active tab badge switches on click', async () => {
      FlowsLayerWidgetProxy();
      const user = userEvent.setup();
      const runtimeFlow = FlowStub({
        id: 'runtime-flow' as never,
        name: 'Runtime Flow',
        flowType: 'runtime',
      });
      const operationalFlow = FlowStub({
        id: 'operational-flow' as never,
        name: 'Operational Flow',
        flowType: 'operational',
      });

      mantineRenderAdapter({
        ui: <FlowsLayerWidget flows={[runtimeFlow, operationalFlow]} />,
      });

      // One tab per flow; only the active flow's content (badge) is shown.
      expect(screen.getAllByTestId('FLOW_TAB').map((tab) => tab.textContent)).toStrictEqual([
        'Runtime Flow',
        'Operational Flow',
      ]);
      expect(screen.getByTestId('FLOW_TYPE_BADGE').textContent).toBe('runtime');

      // Clicking the second tab switches the active flow.
      await user.click(screen.getAllByTestId('FLOW_TAB')[1]!);

      expect(screen.getByTestId('FLOW_TYPE_BADGE').textContent).toBe('operational');
    });

    it('VALID: {flows: [single flow]} => renders no tab bar (content shown directly)', () => {
      FlowsLayerWidgetProxy();
      const flow = FlowStub({ name: 'Solo Flow' });

      mantineRenderAdapter({
        ui: <FlowsLayerWidget flows={[flow]} />,
      });

      expect(screen.queryByTestId('FLOW_TABS')).toBe(null);
      expect(screen.getByTestId('FLOW_NAME').textContent).toBe('Solo Flow');
    });

    it('EDGE: {flows: [flow with empty name]} => tab label falls back to "Flow 1"', () => {
      FlowsLayerWidgetProxy();
      const flowA = EmptyNameFlowStub({ id: 'flow-a' });
      const flowB = FlowStub({ id: 'flow-b' as never, name: 'Other' });

      mantineRenderAdapter({
        ui: <FlowsLayerWidget flows={[flowA, flowB]} />,
      });

      expect(screen.getAllByTestId('FLOW_TAB').map((tab) => tab.textContent)).toStrictEqual([
        'Flow 1',
        'Other',
      ]);
    });

    it('VALID: {flows: [flow with name > 28 chars]} => tab label is truncated with ellipsis', () => {
      FlowsLayerWidgetProxy();
      const longName = 'A'.repeat(30);
      const flowA = FlowStub({ id: 'flow-a' as never, name: longName });
      const flowB = FlowStub({ id: 'flow-b' as never, name: 'Other' });

      mantineRenderAdapter({
        ui: <FlowsLayerWidget flows={[flowA, flowB]} />,
      });

      expect(screen.getAllByTestId('FLOW_TAB').map((tab) => tab.textContent)).toStrictEqual([
        `${'A'.repeat(27)}…`,
        'Other',
      ]);
    });

    it('VALID: {runtime flow in read mode} => badge text color matches primary theme color', () => {
      FlowsLayerWidgetProxy();
      const flow = FlowStub({ flowType: 'runtime' });

      mantineRenderAdapter({
        ui: <FlowsLayerWidget flows={[flow]} />,
      });

      const badgeTextColor = screen.getByTestId('FLOW_TYPE_BADGE').style.color;

      expect(badgeTextColor).toBe('rgb(255, 107, 53)');
      expect(emberDepthsThemeStatics.colors.primary).toBe('#ff6b35');
    });

    it('VALID: {operational flow in read mode} => badge text color matches loot-rare theme color', () => {
      FlowsLayerWidgetProxy();
      const flow = FlowStub({ flowType: 'operational' });

      mantineRenderAdapter({
        ui: <FlowsLayerWidget flows={[flow]} />,
      });

      const badgeTextColor = screen.getByTestId('FLOW_TYPE_BADGE').style.color;

      expect(badgeTextColor).toBe('rgb(232, 121, 249)');
      expect(emberDepthsThemeStatics.colors['loot-rare']).toBe('#e879f9');
    });

    it('VALID: {read mode badge placement} => badge is rendered inside same Group as flow name', () => {
      FlowsLayerWidgetProxy();
      const flow = FlowStub({ name: 'Login Flow', flowType: 'runtime' });

      mantineRenderAdapter({
        ui: <FlowsLayerWidget flows={[flow]} />,
      });

      const nameParent = screen.getByTestId('FLOW_NAME').parentElement;
      const badgeParent = screen.getByTestId('FLOW_TYPE_BADGE').parentElement;

      expect(nameParent).toBe(badgeParent);
    });

    it('VALID: {flows: [flow with nodes]} => renders React Flow FLOW_DIAGRAM', async () => {
      const proxy = FlowsLayerWidgetProxy();
      proxy.setupPositions({ children: [{ id: 'login-page', x: 0, y: 0 }] });
      const node = FlowNodeStub({ id: 'login-page', label: 'Login', type: 'state' });
      const flow = FlowStub({
        nodes: [node],
        edges: [],
      });

      mantineRenderAdapter({
        ui: <FlowsLayerWidget flows={[flow]} />,
      });

      await waitFor(() => {
        expect(screen.getByTestId('FLOW_DIAGRAM')).toBeInTheDocument();
      });

      expect(screen.getByTestId('REACT_FLOW_CANVAS')).toBeInTheDocument();
      expect(screen.queryByTestId('MERMAID_CONTAINER')).toBe(null);
    });

    it('VALID: {flows: [flow with nodes], contracts: [linked]} => renders React Flow diagram with contracts', async () => {
      const proxy = FlowsLayerWidgetProxy();
      proxy.setupPositions({ children: [{ id: 'login-page', x: 0, y: 0 }] });
      const node = FlowNodeStub({ id: 'login-page', label: 'Login', type: 'state' });
      const flow = FlowStub({
        nodes: [node],
        edges: [],
      });
      const contract = QuestContractEntryStub({
        name: 'LoginCredentials',
        nodeId: 'login-page' as never,
      });

      mantineRenderAdapter({
        ui: <FlowsLayerWidget flows={[flow]} contracts={[contract]} />,
      });

      await waitFor(() => {
        expect(screen.getByTestId('FLOW_DIAGRAM')).toBeInTheDocument();
      });

      expect(screen.getByTestId('REACT_FLOW_CANVAS')).toBeInTheDocument();
    });

    it('VALID: {flows: [flow with nodes], contracts: undefined} => renders React Flow diagram without contracts', async () => {
      const proxy = FlowsLayerWidgetProxy();
      proxy.setupPositions({ children: [{ id: 'login-page', x: 0, y: 0 }] });
      const node = FlowNodeStub({ id: 'login-page', label: 'Login', type: 'state' });
      const flow = FlowStub({
        nodes: [node],
        edges: [],
      });

      mantineRenderAdapter({
        ui: <FlowsLayerWidget flows={[flow]} />,
      });

      await waitFor(() => {
        expect(screen.getByTestId('FLOW_DIAGRAM')).toBeInTheDocument();
      });

      expect(screen.getByTestId('REACT_FLOW_CANVAS')).toBeInTheDocument();
    });

    it('EMPTY: {flows: [flow with empty nodes]} => does not render FLOW_DIAGRAM', () => {
      FlowsLayerWidgetProxy();
      const flow = FlowStub({ nodes: [], edges: [] });

      mantineRenderAdapter({
        ui: <FlowsLayerWidget flows={[flow]} />,
      });

      expect(screen.queryByTestId('FLOW_DIAGRAM')).toBe(null);
    });

    it('EMPTY: {flows: []} => renders section with FLOWS header', () => {
      FlowsLayerWidgetProxy();
      const flows: Flow[] = [];

      mantineRenderAdapter({
        ui: <FlowsLayerWidget flows={flows} />,
      });

      expect(screen.getByTestId('SECTION_HEADER_LABEL').textContent).toBe('FLOWS');
    });
  });

  // FlowsLayerWidgetProxy exposes countCommentButtonsOn/getCommentBadgeTextsOn specifically to
  // verify these two optional props reach the diagram — this widget's own layer is where that
  // forwarding (not just the diagram's own rendering of them) gets proven.
  describe('comment compose forwarding', () => {
    it('VALID: {commentQuestId set} => forwards commentQuestId to the diagram, rendering a COMMENT_BUTTON on the node card', async () => {
      const proxy = FlowsLayerWidgetProxy();
      proxy.setupEmptyQueue();
      proxy.setupPositions({ children: [{ id: 'login-page', x: 0, y: 0 }] });
      const node = FlowNodeStub({ id: 'login-page', type: 'state', observables: [] });
      const flow = FlowStub({ id: 'login-flow', nodes: [node], edges: [] });

      mantineRenderAdapter({
        ui: <FlowsLayerWidget flows={[flow]} commentQuestId={QuestIdStub({ value: 'quest-a' })} />,
      });

      await waitFor(() => {
        expect(screen.getByTestId('FLOW_DIAGRAM')).toBeInTheDocument();
      });

      expect(proxy.countCommentButtonsOn({ testId: 'FLOW_NODE' })).toBe(1);
    });

    it('EMPTY: {commentQuestId absent} => the diagram renders zero COMMENT_BUTTON elements on the node card', async () => {
      const proxy = FlowsLayerWidgetProxy();
      proxy.setupPositions({ children: [{ id: 'login-page', x: 0, y: 0 }] });
      const node = FlowNodeStub({ id: 'login-page', type: 'state', observables: [] });
      const flow = FlowStub({ id: 'login-flow', nodes: [node], edges: [] });

      mantineRenderAdapter({
        ui: <FlowsLayerWidget flows={[flow]} />,
      });

      await waitFor(() => {
        expect(screen.getByTestId('FLOW_DIAGRAM')).toBeInTheDocument();
      });

      expect(proxy.countCommentButtonsOn({ testId: 'FLOW_NODE' })).toBe(0);
    });

    it('VALID: {comments carrying a note on the rendered node} => forwards comments to the diagram, painting the COMMENT_COUNT_BADGE', async () => {
      const proxy = FlowsLayerWidgetProxy();
      proxy.setupPositions({ children: [{ id: 'login-page', x: 0, y: 0 }] });
      const node = FlowNodeStub({ id: 'login-page', type: 'state', observables: [] });
      const flow = FlowStub({ id: 'login-flow', nodes: [node], edges: [] });

      mantineRenderAdapter({
        ui: (
          <FlowsLayerWidget
            flows={[flow]}
            comments={[
              QuestCommentStub({ flowId: 'login-flow', nodeId: 'login-page', text: 'a note' }),
            ]}
          />
        ),
      });

      await waitFor(() => {
        expect(screen.getByTestId('FLOW_DIAGRAM')).toBeInTheDocument();
      });

      expect(proxy.getCommentBadgeTextsOn({ testId: 'FLOW_NODE' })).toStrictEqual(['1']);
    });

    it('EMPTY: {comments prop omitted} => no COMMENT_COUNT_BADGE on the rendered node', async () => {
      const proxy = FlowsLayerWidgetProxy();
      proxy.setupPositions({ children: [{ id: 'login-page', x: 0, y: 0 }] });
      const node = FlowNodeStub({ id: 'login-page', type: 'state', observables: [] });
      const flow = FlowStub({ id: 'login-flow', nodes: [node], edges: [] });

      mantineRenderAdapter({
        ui: <FlowsLayerWidget flows={[flow]} />,
      });

      await waitFor(() => {
        expect(screen.getByTestId('FLOW_DIAGRAM')).toBeInTheDocument();
      });

      expect(proxy.getCommentBadgeTextsOn({ testId: 'FLOW_NODE' })).toStrictEqual([]);
    });
  });
});
