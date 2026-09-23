import { screen, waitFor } from '@testing-library/react';

import {
  QuestIdStub,
  QuestNoteStub,
  QuestSummaryDebtStub,
  QuestSummaryFlowStub,
  QuestSummaryNoteGroupStub,
  QuestSummaryObservableStub,
  QuestSummaryStub,
  QuestSummaryTrackCountsStub,
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
                  met: 1,
                  cantMeet: 0,
                  unmet: 0,
                  outstanding: 1,
                }),
                QuestSummaryTrackCountsStub({
                  id: 'siegemaster',
                  met: 0,
                  cantMeet: 1,
                  unmet: 2,
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
        'FLOWRIDER1 met0 cant-meet0 unmet1 outstanding',
        'SIEGEMASTER0 met1 cant-meet2 unmet9 outstanding',
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

  describe('debt section', () => {
    it('VALID: {a cant-meet entry and an unmet entry} => renders both rows, each carrying its own mark, unit and evidence', async () => {
      const proxy = QuestSummaryWidgetProxy();
      proxy.setupConnectedChannel();
      proxy.setupSummary({
        summary: QuestSummaryStub({
          questId: 'q-summary',
          debt: [
            QuestSummaryDebtStub({
              id: 'login-flow:terminal:dashboard:siegemaster',
              unitId: 'login-flow:terminal:dashboard',
              flowId: 'login-flow',
              kind: 'terminal',
              track: 'siegemaster',
              mark: 'cant-meet',
              evidence: 'the sandbox refuses to bind port 3737, so no browser can reach the app',
              toSettle: 'Start the sandbox dev server on a free port, then re-walk this node.',
            }),
            QuestSummaryDebtStub({
              id: 'login-flow:observable:rejects-bleh-payload:flowrider',
              unitId: 'login-flow:observable:rejects-bleh-payload',
              flowId: 'login-flow',
              kind: 'observable',
              track: 'flowrider',
              mark: 'unmet',
              evidence: 'the spec asserts the 400 body but nothing drives a non-JSON request yet',
            }),
          ],
        }),
      });

      mantineRenderAdapter({ ui: <QuestSummaryWidget questId={QUEST_ID} /> });

      await screen.findByTestId('QUEST_SUMMARY');

      expect(
        screen.getAllByTestId('QUEST_SUMMARY_DEBT_UNIT').map((el) => String(el.textContent)),
      ).toStrictEqual([
        '[cant-meet] [siegemaster] login-flow:terminal:dashboard',
        '[unmet] [flowrider] login-flow:observable:rejects-bleh-payload',
      ]);
      expect(
        screen.getAllByTestId('QUEST_SUMMARY_DEBT_EVIDENCE').map((el) => String(el.textContent)),
      ).toStrictEqual([
        'the sandbox refuses to bind port 3737, so no browser can reach the app',
        'the spec asserts the 400 body but nothing drives a non-JSON request yet',
      ]);
    });

    it('VALID: {a cant-meet entry and an unmet entry} => only the cant-meet row carries a to-settle line and only the unmet row says nothing hands it over', async () => {
      const proxy = QuestSummaryWidgetProxy();
      proxy.setupConnectedChannel();
      proxy.setupSummary({
        summary: QuestSummaryStub({
          questId: 'q-summary',
          debt: [
            QuestSummaryDebtStub({
              id: 'login-flow:terminal:dashboard:siegemaster',
              unitId: 'login-flow:terminal:dashboard',
              track: 'siegemaster',
              kind: 'terminal',
              mark: 'cant-meet',
              evidence: 'the sandbox refuses to bind port 3737, so no browser can reach the app',
              toSettle: 'Start the sandbox dev server on a free port, then re-walk this node.',
            }),
            QuestSummaryDebtStub({
              id: 'login-flow:observable:rejects-bleh-payload:flowrider',
              unitId: 'login-flow:observable:rejects-bleh-payload',
              track: 'flowrider',
              kind: 'observable',
              mark: 'unmet',
              evidence: 'the spec asserts the 400 body but nothing drives a non-JSON request yet',
            }),
          ],
        }),
      });

      mantineRenderAdapter({ ui: <QuestSummaryWidget questId={QUEST_ID} /> });

      await screen.findByTestId('QUEST_SUMMARY');

      expect(
        screen.getAllByTestId('QUEST_SUMMARY_DEBT_TO_SETTLE').map((el) => String(el.textContent)),
      ).toStrictEqual(['→ Start the sandbox dev server on a free port, then re-walk this node.']);
      expect(
        screen.getAllByTestId('QUEST_SUMMARY_DEBT_SUCCESSOR').map((el) => String(el.textContent)),
      ).toStrictEqual(['→ nothing hands this over; a successor is owed the work']);
      expect(
        screen
          .getAllByTestId('QUEST_SUMMARY_DEBT_ROW')
          .map((row) =>
            Array.from(row.children).map((line) => String(line.getAttribute('data-testid'))),
          ),
      ).toStrictEqual([
        ['QUEST_SUMMARY_DEBT_UNIT', 'QUEST_SUMMARY_DEBT_EVIDENCE', 'QUEST_SUMMARY_DEBT_TO_SETTLE'],
        ['QUEST_SUMMARY_DEBT_UNIT', 'QUEST_SUMMARY_DEBT_EVIDENCE', 'QUEST_SUMMARY_DEBT_SUCCESSOR'],
      ]);
    });

    it('VALID: {one unit carrying debt on two tracks} => renders a row per track, each with its own mark and evidence', async () => {
      const proxy = QuestSummaryWidgetProxy();
      proxy.setupConnectedChannel();
      proxy.setupSummary({
        summary: QuestSummaryStub({
          questId: 'q-summary',
          debt: [
            QuestSummaryDebtStub({
              id: 'login-flow:observable:rejects-bleh-payload:flowrider',
              unitId: 'login-flow:observable:rejects-bleh-payload',
              track: 'flowrider',
              kind: 'observable',
              mark: 'unmet',
              evidence: 'no spec drives a non-JSON request at the login route yet',
            }),
            QuestSummaryDebtStub({
              id: 'login-flow:observable:rejects-bleh-payload:siegemaster',
              unitId: 'login-flow:observable:rejects-bleh-payload',
              track: 'siegemaster',
              kind: 'observable',
              mark: 'cant-meet',
              evidence: 'a browser cannot post a non-JSON body through the login form',
              toSettle: 'Drive this observable from an API-level walk instead of the browser.',
            }),
          ],
        }),
      });

      mantineRenderAdapter({ ui: <QuestSummaryWidget questId={QUEST_ID} /> });

      await screen.findByTestId('QUEST_SUMMARY');

      expect(
        screen.getAllByTestId('QUEST_SUMMARY_DEBT_UNIT').map((el) => String(el.textContent)),
      ).toStrictEqual([
        '[unmet] [flowrider] login-flow:observable:rejects-bleh-payload',
        '[cant-meet] [siegemaster] login-flow:observable:rejects-bleh-payload',
      ]);
      expect(
        screen.getAllByTestId('QUEST_SUMMARY_DEBT_EVIDENCE').map((el) => String(el.textContent)),
      ).toStrictEqual([
        'no spec drives a non-JSON request at the login route yet',
        'a browser cannot post a non-JSON body through the login form',
      ]);
    });

    it('VALID: {one unit carrying debt on two tracks} => the two rows are keyed apart, so React reconciles them as separate entries', async () => {
      const proxy = QuestSummaryWidgetProxy();
      proxy.setupConnectedChannel();
      proxy.setupSummary({
        summary: QuestSummaryStub({
          questId: 'q-summary',
          debt: [
            QuestSummaryDebtStub({
              id: 'login-flow:observable:rejects-bleh-payload:flowrider',
              unitId: 'login-flow:observable:rejects-bleh-payload',
              track: 'flowrider',
              kind: 'observable',
              mark: 'unmet',
              evidence: 'no spec drives a non-JSON request at the login route yet',
            }),
            QuestSummaryDebtStub({
              id: 'login-flow:observable:rejects-bleh-payload:siegemaster',
              unitId: 'login-flow:observable:rejects-bleh-payload',
              track: 'siegemaster',
              kind: 'observable',
              mark: 'cant-meet',
              evidence: 'a browser cannot post a non-JSON body through the login form',
              toSettle: 'Drive this observable from an API-level walk instead of the browser.',
            }),
          ],
        }),
      });

      mantineRenderAdapter({ ui: <QuestSummaryWidget questId={QUEST_ID} /> });

      await screen.findByTestId('QUEST_SUMMARY');

      expect(proxy.hasDuplicateRowKeyWarning()).toBe(false);
      expect(
        screen.getAllByTestId('QUEST_SUMMARY_DEBT_UNIT').map((el) => String(el.textContent)),
      ).toStrictEqual([
        '[unmet] [flowrider] login-flow:observable:rejects-bleh-payload',
        '[cant-meet] [siegemaster] login-flow:observable:rejects-bleh-payload',
      ]);
    });

    it('EMPTY: {debt: []} => renders the every-unit-is-proven line and no debt rows', async () => {
      const proxy = QuestSummaryWidgetProxy();
      proxy.setupConnectedChannel();
      proxy.setupSummary({
        summary: QuestSummaryStub({ questId: 'q-summary', debt: [] }),
      });

      mantineRenderAdapter({ ui: <QuestSummaryWidget questId={QUEST_ID} /> });

      await screen.findByTestId('QUEST_SUMMARY');

      expect(screen.getByTestId('QUEST_SUMMARY_DEBT_EMPTY').textContent).toBe(
        'every unit is proven',
      );
      expect(screen.queryAllByTestId('QUEST_SUMMARY_DEBT_ROW')).toStrictEqual([]);
    });

    it('VALID: {one unmet entry} => the section heading reads DEBT and the empty line is gone', async () => {
      const proxy = QuestSummaryWidgetProxy();
      proxy.setupConnectedChannel();
      proxy.setupSummary({
        summary: QuestSummaryStub({
          questId: 'q-summary',
          debt: [
            QuestSummaryDebtStub({
              id: 'login-flow:observable:rejects-bleh-payload:flowrider',
              mark: 'unmet',
              evidence: 'no spec drives a non-JSON request at the login route yet',
            }),
          ],
        }),
      });

      mantineRenderAdapter({ ui: <QuestSummaryWidget questId={QUEST_ID} /> });

      await screen.findByTestId('QUEST_SUMMARY');

      const section = screen.getByTestId('QUEST_SUMMARY_SECTION_DEBT');

      expect(String(section.children[0]?.textContent)).toBe('DEBT');
      expect(screen.queryByTestId('QUEST_SUMMARY_DEBT_EMPTY')).toBe(null);
    });
  });

  describe('human check section', () => {
    it('VALID: {one verifyByHuman criterion, no matching note} => renders the section with the criterion unjudged', async () => {
      const proxy = QuestSummaryWidgetProxy();
      proxy.setupConnectedChannel();
      proxy.setupSummary({
        summary: QuestSummaryStub({
          questId: 'q-summary',
          humanChecks: [
            QuestSummaryObservableStub({
              id: 'login-flow:observable:motion-feels-smooth',
              observableId: 'motion-feels-smooth',
              description: 'the dungeon-raid transition never stutters',
            }),
          ],
        }),
      });

      mantineRenderAdapter({ ui: <QuestSummaryWidget questId={QUEST_ID} /> });

      await screen.findByTestId('QUEST_SUMMARY');

      expect(
        screen.getByTestId('QUEST_SUMMARY_SECTION_HUMAN_CHECK').getAttribute('data-testid'),
      ).toBe('QUEST_SUMMARY_SECTION_HUMAN_CHECK');
      expect(screen.getByTestId('HUMAN_CHECK_DESCRIPTION').textContent).toBe(
        'the dungeon-raid transition never stutters',
      );
      expect(screen.queryByTestId('HUMAN_CHECK_VERDICT')).toBe(null);
    });

    it("VALID: {criterion matched by the human-verdict note group's own note} => renders the recorded verdict", async () => {
      const proxy = QuestSummaryWidgetProxy();
      proxy.setupConnectedChannel();
      proxy.setupSummary({
        summary: QuestSummaryStub({
          questId: 'q-summary',
          humanChecks: [
            QuestSummaryObservableStub({
              id: 'login-flow:observable:motion-feels-smooth',
              observableId: 'motion-feels-smooth',
              description: 'the dungeon-raid transition never stutters',
            }),
          ],
          noteGroups: [
            QuestSummaryNoteGroupStub({
              id: 'human-verdict',
              notes: [
                QuestNoteStub({
                  id: 'human-verdict-motion-feels-smooth',
                  kind: 'human-verdict',
                  unitId: 'motion-feels-smooth',
                  outcome: 'met',
                  detail: 'Watched it end to end.',
                }),
              ],
            }),
          ],
        }),
      });

      mantineRenderAdapter({ ui: <QuestSummaryWidget questId={QUEST_ID} /> });

      await screen.findByTestId('QUEST_SUMMARY');

      expect(screen.getByTestId('HUMAN_CHECK_VERDICT').textContent).toBe(
        '[met] Watched it end to end.',
      );
    });

    it('EMPTY: {humanChecks: []} => renders no human-check section at all', async () => {
      const proxy = QuestSummaryWidgetProxy();
      proxy.setupConnectedChannel();
      proxy.setupSummary({
        summary: QuestSummaryStub({ questId: 'q-summary', humanChecks: [] }),
      });

      mantineRenderAdapter({ ui: <QuestSummaryWidget questId={QUEST_ID} /> });

      await screen.findByTestId('QUEST_SUMMARY');

      expect(screen.queryByTestId('QUEST_SUMMARY_SECTION_HUMAN_CHECK')).toBe(null);
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
