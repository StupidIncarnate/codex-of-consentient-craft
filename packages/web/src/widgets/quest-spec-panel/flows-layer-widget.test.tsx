import { screen } from '@testing-library/react';

import { FlowStub } from '@dungeonmaster/shared/contracts';

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

    it('VALID: {flows: [flow with diagram]} => renders mermaid diagram container', () => {
      FlowsLayerWidgetProxy();
      const flow = FlowStub({ diagram: 'graph TD; A-->B' });

      mantineRenderAdapter({
        ui: <FlowsLayerWidget flows={[flow]} editing={false} onChange={jest.fn()} />,
      });

      expect(screen.getByTestId('FLOW_DIAGRAM')).toBeInTheDocument();
      expect(screen.getByTestId('MERMAID_CONTAINER')).toBeInTheDocument();
    });

    it('EMPTY: {flows: []} => renders section with FLOWS header', () => {
      FlowsLayerWidgetProxy();
      const flows: Flow[] = [];

      mantineRenderAdapter({
        ui: <FlowsLayerWidget flows={flows} editing={false} onChange={jest.fn()} />,
      });

      expect(screen.getByText('FLOWS')).toBeInTheDocument();
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
