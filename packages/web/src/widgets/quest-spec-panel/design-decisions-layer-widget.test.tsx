import { screen } from '@testing-library/react';

import { DesignDecisionStub } from '@dungeonmaster/shared/contracts';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { DesignDecisionsLayerWidget } from './design-decisions-layer-widget';
import { DesignDecisionsLayerWidgetProxy } from './design-decisions-layer-widget.proxy';

type DesignDecision = ReturnType<typeof DesignDecisionStub>;

describe('DesignDecisionsLayerWidget', () => {
  describe('read mode', () => {
    it('VALID: {designDecisions: [dec]} => renders decision title', () => {
      DesignDecisionsLayerWidgetProxy();
      const decision = DesignDecisionStub({ title: 'Use JWT' });

      mantineRenderAdapter({
        ui: (
          <DesignDecisionsLayerWidget
            designDecisions={[decision]}
            editing={false}
            onChange={jest.fn()}
          />
        ),
      });

      expect(screen.getByTestId('DECISION_TITLE').textContent).toBe('Use JWT');
    });

    it('VALID: {designDecisions: [dec]} => renders decision rationale', () => {
      DesignDecisionsLayerWidgetProxy();
      const decision = DesignDecisionStub({ rationale: 'Stateless auth' });

      mantineRenderAdapter({
        ui: (
          <DesignDecisionsLayerWidget
            designDecisions={[decision]}
            editing={false}
            onChange={jest.fn()}
          />
        ),
      });

      expect(screen.getByTestId('DECISION_RATIONALE').textContent).toBe('Stateless auth');
    });

    it('VALID: {designDecisions: [dec with relatedRequirements]} => renders tag list', () => {
      DesignDecisionsLayerWidgetProxy();
      const decision = DesignDecisionStub({
        relatedRequirements: ['a12ac10b-58cc-4372-a567-0e02b2c3d479'],
      });

      mantineRenderAdapter({
        ui: (
          <DesignDecisionsLayerWidget
            designDecisions={[decision]}
            editing={false}
            onChange={jest.fn()}
          />
        ),
      });

      expect(screen.getByTestId('FORM_TAG_LIST')).toBeInTheDocument();
    });

    it('EMPTY: {designDecisions: []} => renders section with DESIGN DECISIONS header', () => {
      DesignDecisionsLayerWidgetProxy();
      const decisions: DesignDecision[] = [];

      mantineRenderAdapter({
        ui: (
          <DesignDecisionsLayerWidget
            designDecisions={decisions}
            editing={false}
            onChange={jest.fn()}
          />
        ),
      });

      expect(screen.getByText('DESIGN DECISIONS')).toBeInTheDocument();
    });
  });

  describe('edit mode', () => {
    it('VALID: {editing: true, designDecisions: [dec]} => renders FormInputWidget for title', () => {
      DesignDecisionsLayerWidgetProxy();
      const decision = DesignDecisionStub({ title: 'Use JWT' });

      mantineRenderAdapter({
        ui: (
          <DesignDecisionsLayerWidget
            designDecisions={[decision]}
            editing={true}
            onChange={jest.fn()}
          />
        ),
      });

      const inputs = screen.getAllByTestId('FORM_INPUT');
      const titleInput = inputs.find((input) => input.getAttribute('value') === 'Use JWT');

      expect(titleInput).toBeInTheDocument();
    });
  });
});
