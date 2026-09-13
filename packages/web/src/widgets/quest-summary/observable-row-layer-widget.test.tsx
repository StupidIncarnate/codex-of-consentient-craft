import { screen } from '@testing-library/react';

import { QuestSummaryObservableStub } from '@dungeonmaster/shared/contracts';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { ObservableRowLayerWidget } from './observable-row-layer-widget';
import { ObservableRowLayerWidgetProxy } from './observable-row-layer-widget.proxy';

describe('ObservableRowLayerWidget', () => {
  describe('observable fields', () => {
    it('VALID: {observable added by siegemaster} => renders who added it, its anchor and its text', () => {
      ObservableRowLayerWidgetProxy();
      const observable = QuestSummaryObservableStub({
        id: 'login-flow:observable:crash-on-bleh',
        flowId: 'login-flow',
        nodeId: 'login-page',
        observableId: 'crash-on-bleh',
        addedBy: 'siegemaster',
        observableType: 'api-call',
        description: 'POST /api/auth/login returns 400 for a non-JSON body',
      });

      mantineRenderAdapter({ ui: <ObservableRowLayerWidget observable={observable} /> });

      expect(screen.getByTestId('QUEST_SUMMARY_OBSERVABLE_ADDED_BY').textContent).toBe(
        'added by siegemaster',
      );
      expect(screen.getByTestId('QUEST_SUMMARY_OBSERVABLE_ANCHOR').textContent).toBe(
        'login-flow / login-page [api-call]',
      );
      expect(screen.getByTestId('QUEST_SUMMARY_OBSERVABLE_DESCRIPTION').textContent).toBe(
        'POST /api/auth/login returns 400 for a non-JSON body',
      );
    });
  });
});
