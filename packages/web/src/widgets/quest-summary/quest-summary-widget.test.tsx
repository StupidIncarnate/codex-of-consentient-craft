import { screen, waitFor } from '@testing-library/react';

import {
  QuestIdStub,
  QuestNoteStub,
  QuestSummaryFlowStub,
  QuestSummaryNoteGroupStub,
  QuestSummaryObservableStub,
  QuestSummaryStub,
  QuestSummaryTrackCountsStub,
  QuestSummaryUnconfirmableStub,
  SignoffStub,
} from '@dungeonmaster/shared/contracts';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { QuestSummaryWidget } from './quest-summary-widget';
import { QuestSummaryWidgetProxy } from './quest-summary-widget.proxy';

const QUEST_ID = QuestIdStub({ value: 'q-summary' });

describe('QuestSummaryWidget', () => {
  describe('coverage section', () => {
    it('VALID: {flow measured by both tracks} => renders one row per track carrying that track real counts', async () => {
      const proxy = QuestSummaryWidgetProxy();
      proxy.setupConnectedChannel();
      proxy.setupSummary({
        summary: QuestSummaryStub({
          questId: 'q-summary',
          flows: [
            QuestSummaryFlowStub({
              id: 'login-flow',
              name: 'Login Flow',
              flowType: 'runtime',
              tracks: [
                QuestSummaryTrackCountsStub({
                  id: 'flowrider',
                  confirmed: 1,
                  unconfirmable: 0,
                  outstanding: 1,
                }),
                QuestSummaryTrackCountsStub({
                  id: 'siegemaster',
                  confirmed: 0,
                  unconfirmable: 1,
                  outstanding: 9,
                }),
              ],
            }),
          ],
        }),
      });

      mantineRenderAdapter({ ui: <QuestSummaryWidget questId={QUEST_ID} /> });

      await screen.findByTestId('QUEST_SUMMARY');

      const trackRows = screen.getAllByTestId('QUEST_SUMMARY_TRACK_ROW');

      expect(screen.getByTestId('QUEST_SUMMARY_FLOW_NAME').textContent).toBe(
        'Login Flow [runtime]',
      );
      expect(trackRows.map((row) => String(row.textContent))).toStrictEqual([
        'FLOWRIDER1 confirmed0 unconfirmable1 outstanding',
        'SIEGEMASTER0 confirmed1 unconfirmable9 outstanding',
      ]);
    });

    it('EMPTY: {flows: []} => renders the no-flows line rather than an empty coverage section', async () => {
      const proxy = QuestSummaryWidgetProxy();
      proxy.setupConnectedChannel();
      proxy.setupSummary({
        summary: QuestSummaryStub({ questId: 'q-summary', flows: [] }),
      });

      mantineRenderAdapter({ ui: <QuestSummaryWidget questId={QUEST_ID} /> });

      await screen.findByTestId('QUEST_SUMMARY');

      expect(screen.getByTestId('QUEST_SUMMARY_COVERAGE_EMPTY').textContent).toBe(
        'no flows on this quest',
      );
    });
  });

  describe('mid-quest observables section', () => {
    it('VALID: {one siegemaster-added observable} => renders who added it, its anchor and its text', async () => {
      const proxy = QuestSummaryWidgetProxy();
      proxy.setupConnectedChannel();
      proxy.setupSummary({
        summary: QuestSummaryStub({
          questId: 'q-summary',
          midQuestObservables: [
            QuestSummaryObservableStub({
              id: 'login-flow:observable:crash-on-bleh',
              flowId: 'login-flow',
              nodeId: 'login-page',
              observableId: 'crash-on-bleh',
              addedBy: 'siegemaster',
              observableType: 'api-call',
              description: 'POST /api/auth/login returns 400 for a non-JSON body',
            }),
          ],
        }),
      });

      mantineRenderAdapter({ ui: <QuestSummaryWidget questId={QUEST_ID} /> });

      await screen.findByTestId('QUEST_SUMMARY');

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

    it('EMPTY: {midQuestObservables: []} => renders the nothing-added line', async () => {
      const proxy = QuestSummaryWidgetProxy();
      proxy.setupConnectedChannel();
      proxy.setupSummary({
        summary: QuestSummaryStub({ questId: 'q-summary', midQuestObservables: [] }),
      });

      mantineRenderAdapter({ ui: <QuestSummaryWidget questId={QUEST_ID} /> });

      await screen.findByTestId('QUEST_SUMMARY');

      expect(screen.getByTestId('QUEST_SUMMARY_DRIFT_EMPTY').textContent).toBe(
        'nothing added after approval',
      );
    });
  });

  describe('unconfirmable section', () => {
    it('VALID: {one unconfirmable verdict} => renders the unit, the reason text and the action that would settle it', async () => {
      const proxy = QuestSummaryWidgetProxy();
      proxy.setupConnectedChannel();
      proxy.setupSummary({
        summary: QuestSummaryStub({
          questId: 'q-summary',
          unconfirmable: [
            QuestSummaryUnconfirmableStub({
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
            }),
          ],
        }),
      });

      mantineRenderAdapter({ ui: <QuestSummaryWidget questId={QUEST_ID} /> });

      await screen.findByTestId('QUEST_SUMMARY');

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

    it('EMPTY: {unconfirmable: []} => renders the no-debt line', async () => {
      const proxy = QuestSummaryWidgetProxy();
      proxy.setupConnectedChannel();
      proxy.setupSummary({
        summary: QuestSummaryStub({ questId: 'q-summary', unconfirmable: [] }),
      });

      mantineRenderAdapter({ ui: <QuestSummaryWidget questId={QUEST_ID} /> });

      await screen.findByTestId('QUEST_SUMMARY');

      expect(screen.getByTestId('QUEST_SUMMARY_DEBT_EMPTY').textContent).toBe(
        'no unconfirmable verdicts',
      );
    });
  });

  describe('note groups section', () => {
    it('VALID: {a populated group and an empty group} => renders both titles with their counts and only the populated group has a row', async () => {
      const proxy = QuestSummaryWidgetProxy();
      proxy.setupConnectedChannel();
      proxy.setupSummary({
        summary: QuestSummaryStub({
          questId: 'q-summary',
          noteGroups: [
            QuestSummaryNoteGroupStub({
              id: 'open-question',
              notes: [
                QuestNoteStub({
                  id: 'open-question-anchor-scope',
                  kind: 'open-question',
                  role: 'siegemaster',
                  summary: 'Should a stale anchor notify per box or once per batch?',
                  detail: 'The batch send drops boxes whose node id no longer exists in the flow.',
                }),
              ],
            }),
            QuestSummaryNoteGroupStub({ id: 'walk-reset', notes: [] }),
          ],
        }),
      });

      mantineRenderAdapter({ ui: <QuestSummaryWidget questId={QUEST_ID} /> });

      await screen.findByTestId('QUEST_SUMMARY');

      expect(
        screen.getAllByTestId('QUEST_SUMMARY_NOTE_GROUP_TITLE').map((el) => String(el.textContent)),
      ).toStrictEqual(['OPEN-QUESTION (1)', 'WALK-RESET (0)']);
      expect(
        screen.getAllByTestId('QUEST_SUMMARY_NOTE_ROW').map((el) => String(el.textContent)),
      ).toStrictEqual([
        'Should a stale anchor notify per box or once per batch?siegemaster — The batch send drops boxes whose node id no longer exists in the flow.',
      ]);
    });
  });

  describe('pre-data surfaces', () => {
    it('VALID: {first render, fetch not settled} => renders the reading placeholder, not the panel', () => {
      const proxy = QuestSummaryWidgetProxy();
      proxy.setupConnectedChannel();
      proxy.setupSummary({ summary: QuestSummaryStub({ questId: 'q-summary' }) });

      const { queryByTestId } = mantineRenderAdapter({
        ui: <QuestSummaryWidget questId={QUEST_ID} />,
      });

      expect(queryByTestId('QUEST_SUMMARY_LOADING')?.textContent).toBe(
        'Reading verification summary...',
      );
      expect(queryByTestId('QUEST_SUMMARY')).toBe(null);
    });

    it('ERROR: {endpoint returns 404} => renders the unreadable line carrying the failure', async () => {
      const proxy = QuestSummaryWidgetProxy();
      proxy.setupConnectedChannel();
      proxy.setupNotFound();

      const { queryByTestId } = mantineRenderAdapter({
        ui: <QuestSummaryWidget questId={QUEST_ID} />,
      });

      await waitFor(() => {
        expect(queryByTestId('QUEST_SUMMARY_ERROR')?.getAttribute('data-testid')).toBe(
          'QUEST_SUMMARY_ERROR',
        );
      });

      expect(queryByTestId('QUEST_SUMMARY_ERROR')?.textContent).toBe(
        'VERIFICATION SUMMARY UNREADABLE — GET /api/quests/q-summary/summary failed with status 404',
      );
    });
  });
});
