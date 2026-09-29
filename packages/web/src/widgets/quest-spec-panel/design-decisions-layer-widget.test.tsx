import { screen } from '#gateway/npm/testing-library__react';

import { DesignDecisionStub } from '@dungeonmaster/shared/contracts/design-decision/design-decision.stub';

import { mantineRenderMiddleware } from '@dungeonmaster/testing/middleware/mantine-render';
import { DesignDecisionsLayerWidget } from './design-decisions-layer-widget';
import { DesignDecisionsLayerWidgetProxy } from './design-decisions-layer-widget.proxy';

type DesignDecision = ReturnType<typeof DesignDecisionStub>;

describe('DesignDecisionsLayerWidget', () => {
  describe('read mode', () => {
    it('VALID: {designDecisions: [dec]} => renders decision title', () => {
      DesignDecisionsLayerWidgetProxy();
      const decision = DesignDecisionStub({ title: 'Use JWT' });

      mantineRenderMiddleware({
        ui: <DesignDecisionsLayerWidget designDecisions={[decision]} />,
      });

      expect(screen.getByTestId('DECISION_TITLE').textContent).toBe('Use JWT');
    });

    it('VALID: {designDecisions: [dec]} => renders decision rationale', () => {
      DesignDecisionsLayerWidgetProxy();
      const decision = DesignDecisionStub({ rationale: 'Stateless auth' });

      mantineRenderMiddleware({
        ui: <DesignDecisionsLayerWidget designDecisions={[decision]} />,
      });

      expect(screen.getByTestId('DECISION_RATIONALE').textContent).toBe('Stateless auth');
    });

    it('VALID: {designDecisions: [dec with relatedNodeIds]} => renders tag list', () => {
      DesignDecisionsLayerWidgetProxy();
      const decision = DesignDecisionStub({
        relatedNodeIds: ['login-page'],
      });

      mantineRenderMiddleware({
        ui: <DesignDecisionsLayerWidget designDecisions={[decision]} />,
      });

      expect(screen.getByTestId('FORM_TAG_LIST')).toBeInTheDocument();
    });

    it('EMPTY: {designDecisions: []} => renders section with DESIGN DECISIONS header', () => {
      DesignDecisionsLayerWidgetProxy();
      const decisions: DesignDecision[] = [];

      mantineRenderMiddleware({
        ui: <DesignDecisionsLayerWidget designDecisions={decisions} />,
      });

      expect(screen.getByTestId('SECTION_HEADER_LABEL').textContent).toBe('DESIGN DECISIONS');
    });
  });
});
