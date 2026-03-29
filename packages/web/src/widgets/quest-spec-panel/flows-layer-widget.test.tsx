import { screen } from '@testing-library/react';

import { FlowStub, FlowNodeStub } from '@dungeonmaster/shared/contracts';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
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
  });
});
