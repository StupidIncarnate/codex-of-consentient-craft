import {
  QuestSummaryDebtStub,
  QuestSummaryFlowStub,
  QuestSummaryNoteGroupStub,
  QuestSummaryObservableStub,
  QuestSummaryStub,
  QuestSummaryTrackCountsStub,
} from '@dungeonmaster/shared/contracts';

import { QuestSummaryLayerResponder } from './quest-summary-layer-responder';
import { QuestSummaryLayerResponderProxy } from './quest-summary-layer-responder.proxy';

const JSON_INDENT_SPACES = 2;

describe('QuestSummaryLayerResponder', () => {
  describe('successful summary', () => {
    it('VALID: {questId} => returns the RENDERED summary, not the JSON structure', async () => {
      const proxy = QuestSummaryLayerResponderProxy();
      proxy.setupReturns({
        questId: 'add-auth',
        summary: QuestSummaryStub({
          questId: 'add-auth',
          flows: [
            QuestSummaryFlowStub({
              id: 'login-flow',
              name: 'Login Flow',
              flowType: 'runtime',
              tracks: [
                QuestSummaryTrackCountsStub({
                  id: 'siegemaster',
                  met: 15,
                  cantMeet: 0,
                  unmet: 0,
                  outstanding: 1,
                }),
              ],
            }),
          ],
          midQuestObservables: [],
          debt: [],
          noteGroups: [],
        }),
      });

      const result = await QuestSummaryLayerResponder({ args: { questId: 'add-auth' } });
      const lines = String(result.content[0]?.text).split('\n');

      expect({
        isError: result.isError,
        type: result.content[0]?.type,
        title: lines[0],
        flowHeading: lines.find((line) => line.startsWith('### `login-flow`')),
        trackRow: lines.find((line) => line.startsWith('    siegemaster:')),
      }).toStrictEqual({
        isError: undefined,
        type: 'text',
        title: '# QUEST SUMMARY — `add-auth`',
        flowHeading: '### `login-flow` "Login Flow" [runtime]',
        trackRow: '    siegemaster: met 15 / cant-meet 0 / unmet 0 / outstanding 1',
      });
    });

    it('VALID: {quest carrying debt entries} => a cant-meet entry renders its toSettle and an unmet entry renders none recorded', async () => {
      const proxy = QuestSummaryLayerResponderProxy();
      proxy.setupReturns({
        questId: 'add-auth',
        summary: QuestSummaryStub({
          questId: 'add-auth',
          flows: [],
          midQuestObservables: [
            QuestSummaryObservableStub({
              id: 'login-flow:observable:rejects-bleh-payload',
              addedBy: 'siegemaster',
              description: 'POST /api/auth/login returns 400 for a non-JSON body',
            }),
          ],
          debt: [
            QuestSummaryDebtStub({
              mark: 'cant-meet',
              evidence: 'playwright.config.ts declares no webServer, so no e2e run reaches the app',
              toSettle:
                'Add a webServer block to playwright.config.ts, then re-run this spec against it.',
            }),
            QuestSummaryDebtStub({
              id: 'login-flow:off-map:perf:siegemaster',
              unitId: 'login-flow:off-map:perf',
              kind: 'off-map',
              track: 'siegemaster',
            }),
          ],
          noteGroups: [QuestSummaryNoteGroupStub({ id: 'open-question', notes: [] })],
        }),
      });

      const result = await QuestSummaryLayerResponder({ args: { questId: 'add-auth' } });
      const lines = String(result.content[0]?.text).split('\n');

      expect({
        addedBy: lines.find((line) => line.startsWith('- added by')),
        debtHeadings: lines.filter((line) => line.startsWith('### `login-flow:')),
        toSettleLines: lines.filter((line) => line.startsWith('      toSettle:')),
        openQuestionHeading: lines.find((line) => line.startsWith('### open-question')),
      }).toStrictEqual({
        addedBy: '- added by siegemaster: `login-flow:observable:rejects-bleh-payload` [api-call]',
        debtHeadings: [
          '### `login-flow:observable:rejects-bleh-payload` [observable] — cant-meet on the flowrider track',
          '### `login-flow:off-map:perf` [off-map] — unmet on the siegemaster track',
        ],
        toSettleLines: [
          '      toSettle: Add a webServer block to playwright.config.ts, then re-run this spec against it.',
          '      toSettle: (none recorded)',
        ],
        openQuestionHeading: '### open-question (0)',
      });
    });

    it('VALID: {questId} => forwards it to the orchestrator', async () => {
      const proxy = QuestSummaryLayerResponderProxy();
      proxy.setupReturns({
        questId: 'add-auth',
        summary: QuestSummaryStub({ questId: 'add-auth' }),
      });

      await QuestSummaryLayerResponder({ args: { questId: 'add-auth' } });

      expect(proxy.getLastCalledInputFor({ questId: 'add-auth' })).toStrictEqual({
        questId: 'add-auth',
      });
    });
  });

  describe('adapter failures', () => {
    it('ERROR: {orchestrator throws} => returns the JSON error shape with isError', async () => {
      const proxy = QuestSummaryLayerResponderProxy();
      proxy.setupThrows({ questId: 'add-auth', error: new Error('Quest not found: add-auth') });

      const result = await QuestSummaryLayerResponder({ args: { questId: 'add-auth' } });

      expect(result).toStrictEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              { success: false, error: 'Quest not found: add-auth' },
              null,
              JSON_INDENT_SPACES,
            ),
          },
        ],
        isError: true,
      });
    });
  });

  describe('input validation', () => {
    it('INVALID: {missing questId} => throws before any adapter call', async () => {
      QuestSummaryLayerResponderProxy();

      await expect(QuestSummaryLayerResponder({ args: {} })).rejects.toThrow(/Required/u);
    });

    it('INVALID: {flowId} => throws on the strict contract, the summary is whole-quest by design', async () => {
      QuestSummaryLayerResponderProxy();

      await expect(
        QuestSummaryLayerResponder({ args: { questId: 'add-auth', flowId: 'login-flow' } }),
      ).rejects.toThrow(/Unrecognized key/u);
    });
  });
});
