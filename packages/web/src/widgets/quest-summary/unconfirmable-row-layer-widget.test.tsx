import { screen } from '@testing-library/react';

import { QuestSummaryUnconfirmableStub, SignoffStub } from '@dungeonmaster/shared/contracts';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { UnconfirmableRowLayerWidget } from './unconfirmable-row-layer-widget';
import { UnconfirmableRowLayerWidgetProxy } from './unconfirmable-row-layer-widget.proxy';

describe('UnconfirmableRowLayerWidget', () => {
  describe('with a toSettle action', () => {
    it('VALID: {signoff carries toSettle} => renders the unit, the reason text and the action that would settle it', () => {
      UnconfirmableRowLayerWidgetProxy();
      const entry = QuestSummaryUnconfirmableStub({
        id: 'login-flow:terminal:dashboard:siegemaster',
        unitId: 'login-flow:terminal:dashboard',
        flowId: 'login-flow',
        kind: 'terminal',
        track: 'siegemaster',
        signoff: SignoffStub({
          verdict: 'unconfirmable',
          evidence: 'the sandbox refuses to bind port 3737, so no browser can reach the app',
          toSettle: 'Start the sandbox dev server on a free port, then re-walk this node.',
        }),
      });

      mantineRenderAdapter({ ui: <UnconfirmableRowLayerWidget entry={entry} /> });

      expect(screen.getByTestId('QUEST_SUMMARY_UNCONFIRMABLE_UNIT').textContent).toBe(
        '[siegemaster] login-flow:terminal:dashboard',
      );
      expect(screen.getByTestId('QUEST_SUMMARY_UNCONFIRMABLE_REASON').textContent).toBe(
        'the sandbox refuses to bind port 3737, so no browser can reach the app',
      );
      expect(screen.getByTestId('QUEST_SUMMARY_UNCONFIRMABLE_TO_SETTLE').textContent).toBe(
        '→ Start the sandbox dev server on a free port, then re-walk this node.',
      );
    });
  });

  describe('without a toSettle action', () => {
    it('EMPTY: {signoff carries no toSettle} => renders the unit and reason but no to-settle row', () => {
      UnconfirmableRowLayerWidgetProxy();
      const entry = QuestSummaryUnconfirmableStub({
        signoff: SignoffStub({
          verdict: 'confirmed',
          evidence: 'the sandbox refuses to bind port 3737, so no browser can reach the app',
        }),
      });

      mantineRenderAdapter({ ui: <UnconfirmableRowLayerWidget entry={entry} /> });

      expect(screen.getByTestId('QUEST_SUMMARY_UNCONFIRMABLE_REASON').textContent).toBe(
        'the sandbox refuses to bind port 3737, so no browser can reach the app',
      );
      expect(screen.queryByTestId('QUEST_SUMMARY_UNCONFIRMABLE_TO_SETTLE')).toBe(null);
    });
  });
});
