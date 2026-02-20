import { screen } from '@testing-library/react';

import { ContextStub, FlowStub, ObservableStub } from '@dungeonmaster/shared/contracts';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { ObservablesLayerWidget } from './observables-layer-widget';
import { ObservablesLayerWidgetProxy } from './observables-layer-widget.proxy';

type Flow = ReturnType<typeof FlowStub>;
type Context = ReturnType<typeof ContextStub>;
type Observable = ReturnType<typeof ObservableStub>;

describe('ObservablesLayerWidget', () => {
  describe('read mode - flows', () => {
    it('VALID: {flows: [flow]} => renders flow name', () => {
      ObservablesLayerWidgetProxy();
      const flow = FlowStub({ name: 'Login Flow' });

      mantineRenderAdapter({
        ui: (
          <ObservablesLayerWidget
            flows={[flow]}
            contexts={[]}
            observables={[]}
            editing={false}
            onChange={jest.fn()}
          />
        ),
      });

      expect(screen.getByTestId('FLOW_NAME').textContent).toBe('Login Flow');
    });

    it('VALID: {flows: [flow]} => renders flow entry point', () => {
      ObservablesLayerWidgetProxy();
      const flow = FlowStub({ entryPoint: '/login' });

      mantineRenderAdapter({
        ui: (
          <ObservablesLayerWidget
            flows={[flow]}
            contexts={[]}
            observables={[]}
            editing={false}
            onChange={jest.fn()}
          />
        ),
      });

      expect(screen.getByTestId('FLOW_ENTRY_POINT').textContent).toBe('entry: /login');
    });

    it('VALID: {flows: [flow]} => renders flow exit points', () => {
      ObservablesLayerWidgetProxy();
      const flow = FlowStub({ exitPoints: ['/dashboard', '/settings'] });

      mantineRenderAdapter({
        ui: (
          <ObservablesLayerWidget
            flows={[flow]}
            contexts={[]}
            observables={[]}
            editing={false}
            onChange={jest.fn()}
          />
        ),
      });

      expect(screen.getByTestId('FLOW_EXIT_POINTS').textContent).toBe(
        'exit: /dashboard, /settings',
      );
    });

    it('VALID: {flows: [flow with diagram]} => renders diagram indicator', () => {
      ObservablesLayerWidgetProxy();
      const flow = FlowStub({ diagram: 'graph TD; A-->B' });

      mantineRenderAdapter({
        ui: (
          <ObservablesLayerWidget
            flows={[flow]}
            contexts={[]}
            observables={[]}
            editing={false}
            onChange={jest.fn()}
          />
        ),
      });

      expect(screen.getByTestId('FLOW_DIAGRAM_INDICATOR').textContent).toBe('[diagram]');
    });

    it('EMPTY: {flows: []} => renders section with FLOWS header', () => {
      ObservablesLayerWidgetProxy();
      const flows: Flow[] = [];

      mantineRenderAdapter({
        ui: (
          <ObservablesLayerWidget
            flows={flows}
            contexts={[]}
            observables={[]}
            editing={false}
            onChange={jest.fn()}
          />
        ),
      });

      expect(screen.getByText('FLOWS')).toBeInTheDocument();
    });
  });

  describe('read mode - contexts', () => {
    it('VALID: {contexts: [ctx]} => renders context name in gold', () => {
      ObservablesLayerWidgetProxy();
      const ctx = ContextStub({ name: 'Admin Page' });

      mantineRenderAdapter({
        ui: (
          <ObservablesLayerWidget
            flows={[]}
            contexts={[ctx]}
            observables={[]}
            editing={false}
            onChange={jest.fn()}
          />
        ),
      });

      expect(screen.getByTestId('CONTEXT_NAME').textContent).toBe('Admin Page');
    });

    it('VALID: {contexts: [ctx]} => renders context description', () => {
      ObservablesLayerWidgetProxy();
      const ctx = ContextStub({ description: 'User admin section' });

      mantineRenderAdapter({
        ui: (
          <ObservablesLayerWidget
            flows={[]}
            contexts={[ctx]}
            observables={[]}
            editing={false}
            onChange={jest.fn()}
          />
        ),
      });

      expect(screen.getByTestId('CONTEXT_DESCRIPTION').textContent).toBe('User admin section');
    });

    it('VALID: {contexts: [ctx with locator]} => renders locator page and section', () => {
      ObservablesLayerWidgetProxy();
      const ctx = ContextStub({ locator: { page: '/admin', section: '#permissions' } });

      mantineRenderAdapter({
        ui: (
          <ObservablesLayerWidget
            flows={[]}
            contexts={[ctx]}
            observables={[]}
            editing={false}
            onChange={jest.fn()}
          />
        ),
      });

      expect(screen.getByTestId('CONTEXT_LOCATOR').textContent).toBe(
        'locator: /admin \u2192 #permissions',
      );
    });

    it('EMPTY: {contexts: []} => renders section with CONTEXTS header', () => {
      ObservablesLayerWidgetProxy();
      const contexts: Context[] = [];

      mantineRenderAdapter({
        ui: (
          <ObservablesLayerWidget
            flows={[]}
            contexts={contexts}
            observables={[]}
            editing={false}
            onChange={jest.fn()}
          />
        ),
      });

      expect(screen.getByText('CONTEXTS')).toBeInTheDocument();
    });
  });

  describe('read mode - observables', () => {
    it('VALID: {observables: [obs]} => renders context ref', () => {
      ObservablesLayerWidgetProxy();
      const obs = ObservableStub({ contextId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });

      mantineRenderAdapter({
        ui: (
          <ObservablesLayerWidget
            flows={[]}
            contexts={[]}
            observables={[obs]}
            editing={false}
            onChange={jest.fn()}
          />
        ),
      });

      expect(screen.getByTestId('OBSERVABLE_CONTEXT_REF').textContent).toBe(
        'ctx: f47ac10b-58cc-4372-a567-0e02b2c3d479',
      );
    });

    it('VALID: {observables: [obs with requirementId]} => renders req ref', () => {
      ObservablesLayerWidgetProxy();
      const obs = ObservableStub({ requirementId: 'a12ac10b-58cc-4372-a567-0e02b2c3d479' });

      mantineRenderAdapter({
        ui: (
          <ObservablesLayerWidget
            flows={[]}
            contexts={[]}
            observables={[obs]}
            editing={false}
            onChange={jest.fn()}
          />
        ),
      });

      expect(screen.getByTestId('OBSERVABLE_REQ_REF').textContent).toBe(
        'req: a12ac10b-58cc-4372-a567-0e02b2c3d479',
      );
    });

    it('VALID: {observables: [obs]} => renders verification status', () => {
      ObservablesLayerWidgetProxy();
      const obs = ObservableStub({ verificationStatus: 'verified' });

      mantineRenderAdapter({
        ui: (
          <ObservablesLayerWidget
            flows={[]}
            contexts={[]}
            observables={[obs]}
            editing={false}
            onChange={jest.fn()}
          />
        ),
      });

      expect(screen.getByTestId('OBSERVABLE_VERIFICATION_STATUS').textContent).toBe('verified');
    });

    it('VALID: {observables: [obs]} => renders WHEN trigger', () => {
      ObservablesLayerWidgetProxy();
      const obs = ObservableStub({ trigger: 'Click submit button' });

      mantineRenderAdapter({
        ui: (
          <ObservablesLayerWidget
            flows={[]}
            contexts={[]}
            observables={[obs]}
            editing={false}
            onChange={jest.fn()}
          />
        ),
      });

      expect(screen.getByTestId('OBSERVABLE_TRIGGER').textContent).toBe('WHEN Click submit button');
    });

    it('VALID: {observables: [obs with outcomes]} => renders THEN outcomes', () => {
      ObservablesLayerWidgetProxy();
      const obs = ObservableStub({
        outcomes: [{ type: 'ui-state', description: 'Form is submitted', criteria: {} }],
      });

      mantineRenderAdapter({
        ui: (
          <ObservablesLayerWidget
            flows={[]}
            contexts={[]}
            observables={[obs]}
            editing={false}
            onChange={jest.fn()}
          />
        ),
      });

      expect(screen.getByTestId('OBSERVABLE_OUTCOME').textContent).toBe(
        'THEN Form is submitted (ui-state)',
      );
    });

    it('EDGE: {observables: [obs with no verificationStatus]} => renders pending as default', () => {
      ObservablesLayerWidgetProxy();
      const obs = ObservableStub({});

      mantineRenderAdapter({
        ui: (
          <ObservablesLayerWidget
            flows={[]}
            contexts={[]}
            observables={[obs]}
            editing={false}
            onChange={jest.fn()}
          />
        ),
      });

      expect(screen.getByTestId('OBSERVABLE_VERIFICATION_STATUS').textContent).toBe('pending');
    });

    it('EMPTY: {observables: []} => renders section with OBSERVABLES header', () => {
      ObservablesLayerWidgetProxy();
      const observables: Observable[] = [];

      mantineRenderAdapter({
        ui: (
          <ObservablesLayerWidget
            flows={[]}
            contexts={[]}
            observables={observables}
            editing={false}
            onChange={jest.fn()}
          />
        ),
      });

      expect(screen.getByText('OBSERVABLES')).toBeInTheDocument();
    });
  });

  describe('edit mode - flows', () => {
    it('VALID: {editing: true, flows: [flow]} => renders FormInputWidget for name', () => {
      ObservablesLayerWidgetProxy();
      const flow = FlowStub({ name: 'Login Flow' });

      mantineRenderAdapter({
        ui: (
          <ObservablesLayerWidget
            flows={[flow]}
            contexts={[]}
            observables={[]}
            editing={true}
            onChange={jest.fn()}
          />
        ),
      });

      const inputs = screen.getAllByTestId('FORM_INPUT');
      const nameInput = inputs.find((input) => input.getAttribute('value') === 'Login Flow');

      expect(nameInput).toBeInTheDocument();
    });
  });

  describe('edit mode - contexts', () => {
    it('VALID: {editing: true, contexts: [ctx]} => renders FormInputWidget for name', () => {
      ObservablesLayerWidgetProxy();
      const ctx = ContextStub({ name: 'Admin Page' });

      mantineRenderAdapter({
        ui: (
          <ObservablesLayerWidget
            flows={[]}
            contexts={[ctx]}
            observables={[]}
            editing={true}
            onChange={jest.fn()}
          />
        ),
      });

      const inputs = screen.getAllByTestId('FORM_INPUT');
      const nameInput = inputs.find((input) => input.getAttribute('value') === 'Admin Page');

      expect(nameInput).toBeInTheDocument();
    });
  });

  describe('edit mode - observables', () => {
    it('VALID: {editing: true, observables: [obs]} => renders FormInputWidget for trigger', () => {
      ObservablesLayerWidgetProxy();
      const ctx = ContextStub({});
      const obs = ObservableStub({ trigger: 'Click submit button', contextId: ctx.id });

      mantineRenderAdapter({
        ui: (
          <ObservablesLayerWidget
            flows={[]}
            contexts={[ctx]}
            observables={[obs]}
            editing={true}
            onChange={jest.fn()}
          />
        ),
      });

      const inputs = screen.getAllByTestId('FORM_INPUT');
      const triggerInput = inputs.find(
        (input) => input.getAttribute('value') === 'Click submit button',
      );

      expect(triggerInput).toBeInTheDocument();
    });

    it('VALID: {editing: true, observables: [obs]} => renders FormDropdownWidget for context', () => {
      ObservablesLayerWidgetProxy();
      const ctx = ContextStub({});
      const obs = ObservableStub({ contextId: ctx.id });

      mantineRenderAdapter({
        ui: (
          <ObservablesLayerWidget
            flows={[]}
            contexts={[ctx]}
            observables={[obs]}
            editing={true}
            onChange={jest.fn()}
          />
        ),
      });

      expect(screen.getAllByTestId('FORM_DROPDOWN').length).toBeGreaterThanOrEqual(1);
    });
  });
});
