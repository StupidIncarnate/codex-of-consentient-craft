import { screen } from '@testing-library/react';

import { FlowStub, FlowNodeStub, QuestContractEntryStub } from '@dungeonmaster/shared/contracts';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';
import { FlowsLayerWidget } from './flows-layer-widget';
import { FlowsLayerWidgetProxy } from './flows-layer-widget.proxy';

type Flow = ReturnType<typeof FlowStub>;

describe('FlowsLayerWidget', () => {
  describe('read mode', () => {
    it('VALID: {flows: [flow]} => renders flow name', () => {
      FlowsLayerWidgetProxy();
      const flow = FlowStub({ name: 'Login Flow' });

      mantineRenderAdapter({
        ui: <FlowsLayerWidget flows={[flow]} editing={false} onChange={jest.fn()} />,
      });

      expect(screen.getByTestId('FLOW_NAME').textContent).toBe('Login Flow');
    });

    it('VALID: {flows: [flow]} => renders flow entry point', () => {
      FlowsLayerWidgetProxy();
      const flow = FlowStub({ entryPoint: '/login' });

      mantineRenderAdapter({
        ui: <FlowsLayerWidget flows={[flow]} editing={false} onChange={jest.fn()} />,
      });

      expect(screen.getByTestId('FLOW_ENTRY_POINT').textContent).toBe('entry: /login');
    });

    it('VALID: {flows: [flow]} => renders flow exit points', () => {
      FlowsLayerWidgetProxy();
      const flow = FlowStub({ exitPoints: ['/dashboard', '/settings'] });

      mantineRenderAdapter({
        ui: <FlowsLayerWidget flows={[flow]} editing={false} onChange={jest.fn()} />,
      });

      expect(screen.getByTestId('FLOW_EXIT_POINTS').textContent).toBe(
        'exit: /dashboard, /settings',
      );
    });

    it('VALID: {flows: [flow with scope]} => renders flow scope in dim text', () => {
      FlowsLayerWidgetProxy();
      const flow = FlowStub({ scope: 'packages/web' as never });

      mantineRenderAdapter({
        ui: <FlowsLayerWidget flows={[flow]} editing={false} onChange={jest.fn()} />,
      });

      expect(screen.getByTestId('FLOW_SCOPE').textContent).toBe('packages/web');
    });

    it('VALID: {flows: [flow without scope]} => does not render scope element', () => {
      FlowsLayerWidgetProxy();
      const flow = FlowStub();

      mantineRenderAdapter({
        ui: <FlowsLayerWidget flows={[flow]} editing={false} onChange={jest.fn()} />,
      });

      expect(screen.queryByTestId('FLOW_SCOPE')).toBe(null);
    });

    it('VALID: {flows: [runtime flow]} => renders FLOW_TYPE_BADGE with "runtime" text', () => {
      FlowsLayerWidgetProxy();
      const flow = FlowStub({ flowType: 'runtime' });

      mantineRenderAdapter({
        ui: <FlowsLayerWidget flows={[flow]} editing={false} onChange={jest.fn()} />,
      });

      expect(screen.getByTestId('FLOW_TYPE_BADGE').textContent).toBe('runtime');
    });

    it('VALID: {flows: [operational flow]} => renders FLOW_TYPE_BADGE with "operational" text', () => {
      FlowsLayerWidgetProxy();
      const flow = FlowStub({ flowType: 'operational' });

      mantineRenderAdapter({
        ui: <FlowsLayerWidget flows={[flow]} editing={false} onChange={jest.fn()} />,
      });

      expect(screen.getByTestId('FLOW_TYPE_BADGE').textContent).toBe('operational');
    });

    it('VALID: {flows: [runtime, operational]} => renders both FLOW_TYPE_BADGE labels', () => {
      FlowsLayerWidgetProxy();
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
        ui: (
          <FlowsLayerWidget
            flows={[runtimeFlow, operationalFlow]}
            editing={false}
            onChange={jest.fn()}
          />
        ),
      });

      const badges = screen.getAllByTestId('FLOW_TYPE_BADGE');

      expect(badges.map((badge) => badge.textContent)).toStrictEqual(['runtime', 'operational']);
    });

    it('VALID: {runtime flow in read mode} => badge text color matches primary theme color', () => {
      FlowsLayerWidgetProxy();
      const flow = FlowStub({ flowType: 'runtime' });

      mantineRenderAdapter({
        ui: <FlowsLayerWidget flows={[flow]} editing={false} onChange={jest.fn()} />,
      });

      const badgeTextColor = screen.getByTestId('FLOW_TYPE_BADGE').style.color;

      expect(badgeTextColor).toBe('rgb(255, 107, 53)');
      expect(emberDepthsThemeStatics.colors.primary).toBe('#ff6b35');
    });

    it('VALID: {operational flow in read mode} => badge text color matches loot-rare theme color', () => {
      FlowsLayerWidgetProxy();
      const flow = FlowStub({ flowType: 'operational' });

      mantineRenderAdapter({
        ui: <FlowsLayerWidget flows={[flow]} editing={false} onChange={jest.fn()} />,
      });

      const badgeTextColor = screen.getByTestId('FLOW_TYPE_BADGE').style.color;

      expect(badgeTextColor).toBe('rgb(232, 121, 249)');
      expect(emberDepthsThemeStatics.colors['loot-rare']).toBe('#e879f9');
    });

    it('VALID: {read mode badge placement} => badge is rendered inside same Group as flow name', () => {
      FlowsLayerWidgetProxy();
      const flow = FlowStub({ name: 'Login Flow', flowType: 'runtime' });

      mantineRenderAdapter({
        ui: <FlowsLayerWidget flows={[flow]} editing={false} onChange={jest.fn()} />,
      });

      const nameParent = screen.getByTestId('FLOW_NAME').parentElement;
      const badgeParent = screen.getByTestId('FLOW_TYPE_BADGE').parentElement;

      expect(nameParent).toBe(badgeParent);
    });

    it('VALID: {flows: [flow with nodes]} => renders mermaid diagram from flowToMermaidTransformer', () => {
      FlowsLayerWidgetProxy();
      const node = FlowNodeStub({ id: 'login-page', label: 'Login', type: 'state' });
      const flow = FlowStub({
        nodes: [node],
        edges: [],
      });

      mantineRenderAdapter({
        ui: <FlowsLayerWidget flows={[flow]} editing={false} onChange={jest.fn()} />,
      });

      expect(screen.getByTestId('FLOW_DIAGRAM')).toBeInTheDocument();
      expect(screen.getByTestId('MERMAID_CONTAINER')).toBeInTheDocument();
    });

    it('VALID: {flows: [flow with nodes], contracts: [linked]} => renders mermaid diagram with contracts', () => {
      FlowsLayerWidgetProxy();
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
        ui: (
          <FlowsLayerWidget
            flows={[flow]}
            contracts={[contract]}
            editing={false}
            onChange={jest.fn()}
          />
        ),
      });

      expect(screen.getByTestId('FLOW_DIAGRAM')).toBeInTheDocument();
      expect(screen.getByTestId('MERMAID_CONTAINER')).toBeInTheDocument();
    });

    it('VALID: {flows: [flow with nodes], contracts: undefined} => renders mermaid diagram without contracts', () => {
      FlowsLayerWidgetProxy();
      const node = FlowNodeStub({ id: 'login-page', label: 'Login', type: 'state' });
      const flow = FlowStub({
        nodes: [node],
        edges: [],
      });

      mantineRenderAdapter({
        ui: <FlowsLayerWidget flows={[flow]} editing={false} onChange={jest.fn()} />,
      });

      expect(screen.getByTestId('FLOW_DIAGRAM')).toBeInTheDocument();
      expect(screen.getByTestId('MERMAID_CONTAINER')).toBeInTheDocument();
    });

    it('VALID: {flows: [flow with empty nodes]} => does not render mermaid diagram', () => {
      FlowsLayerWidgetProxy();
      const flow = FlowStub({ nodes: [], edges: [] });

      mantineRenderAdapter({
        ui: <FlowsLayerWidget flows={[flow]} editing={false} onChange={jest.fn()} />,
      });

      expect(screen.queryByTestId('FLOW_DIAGRAM')).toBe(null);
    });

    it('EMPTY: {flows: []} => renders section with FLOWS header', () => {
      FlowsLayerWidgetProxy();
      const flows: Flow[] = [];

      mantineRenderAdapter({
        ui: <FlowsLayerWidget flows={flows} editing={false} onChange={jest.fn()} />,
      });

      expect(screen.getByTestId('SECTION_HEADER_LABEL').textContent).toBe('FLOWS');
    });
  });

  describe('edit mode', () => {
    it('VALID: {editing: true, flows: [flow]} => renders FormInputWidget for name', () => {
      FlowsLayerWidgetProxy();
      const flow = FlowStub({ name: 'Login Flow' });

      mantineRenderAdapter({
        ui: <FlowsLayerWidget flows={[flow]} editing={true} onChange={jest.fn()} />,
      });

      const inputs = screen.getAllByTestId('FORM_INPUT');
      const nameInput = inputs.find((input) => input.getAttribute('value') === 'Login Flow');

      expect(nameInput).toBeInTheDocument();
    });

    it('VALID: {editing: true, flows: [runtime flow]} => renders FLOW_TYPE_BADGE with "runtime" text', () => {
      FlowsLayerWidgetProxy();
      const flow = FlowStub({ flowType: 'runtime' });

      mantineRenderAdapter({
        ui: <FlowsLayerWidget flows={[flow]} editing={true} onChange={jest.fn()} />,
      });

      expect(screen.getByTestId('FLOW_TYPE_BADGE').textContent).toBe('runtime');
    });

    it('VALID: {editing: true, flows: [operational flow]} => renders FLOW_TYPE_BADGE with "operational" text', () => {
      FlowsLayerWidgetProxy();
      const flow = FlowStub({ flowType: 'operational' });

      mantineRenderAdapter({
        ui: <FlowsLayerWidget flows={[flow]} editing={true} onChange={jest.fn()} />,
      });

      expect(screen.getByTestId('FLOW_TYPE_BADGE').textContent).toBe('operational');
    });

    it('VALID: {editing: true, flows: [], click add} => calls onChange with new flow carrying flowType "runtime"', async () => {
      const proxy = FlowsLayerWidgetProxy();
      const flows: Flow[] = [];
      const onChange = jest.fn();

      mantineRenderAdapter({
        ui: <FlowsLayerWidget flows={flows} editing={true} onChange={onChange} />,
      });

      await proxy.clickAdd();

      expect(onChange).toHaveBeenCalledTimes(1);

      const nextFlows = onChange.mock.calls[0]![0] as Flow[];
      const { id: _createdId, ...createdWithoutId } = nextFlows[0]!;

      expect(createdWithoutId).toStrictEqual({
        name: '',
        flowType: 'runtime',
        entryPoint: '',
        exitPoints: [],
        nodes: [],
        edges: [],
      });
    });
  });
});
