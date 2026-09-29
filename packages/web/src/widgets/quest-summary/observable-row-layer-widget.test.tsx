import { screen } from '#gateway/npm/testing-library__react';

import { QuestSummaryObservableStub } from '@dungeonmaster/shared/contracts';

import { mantineRenderMiddleware } from '@dungeonmaster/testing/middleware/mantine-render';
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

      mantineRenderMiddleware({ ui: <ObservableRowLayerWidget observable={observable} /> });

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
