import {
  QuestIdStub,
  QuestStub,
  QuestSummaryFlowStub,
  QuestSummaryStub,
  QuestSummaryTrackCountsStub,
} from '@dungeonmaster/shared/contracts';

import { testingLibraryActAdapter } from '../../adapters/testing-library/act/testing-library-act-adapter';
import { testingLibraryRenderHookAdapter } from '../../adapters/testing-library/render-hook/testing-library-render-hook-adapter';
import { testingLibraryWaitForAdapter } from '../../adapters/testing-library/wait-for/testing-library-wait-for-adapter';
import { useQuestSummaryBinding } from './use-quest-summary-binding';
import { useQuestSummaryBindingProxy } from './use-quest-summary-binding.proxy';

const QUEST_ID = QuestIdStub({ value: 'q-summary' });
const OTHER_QUEST_ID = QuestIdStub({ value: 'q-other' });

describe('useQuestSummaryBinding', () => {
  describe('initial mount', () => {
    it('VALID: {questId} => fetches and populates the summary', async () => {
      const proxy = useQuestSummaryBindingProxy();
      proxy.setupConnectedChannel();
      const summary = QuestSummaryStub({ questId: 'q-summary' });
      proxy.setupSummary({ summary });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useQuestSummaryBinding({ questId: QUEST_ID }),
      });

      const currentState = (): ReturnType<typeof useQuestSummaryBinding> => result.current;

      await testingLibraryWaitForAdapter({
        callback: () => {
          expect(currentState().loading).toBe(false);
        },
      });

      expect(result.current).toStrictEqual({ data: summary, loading: false, error: null });
    });

    it('VALID: {initial mount} => loading starts true', () => {
      const proxy = useQuestSummaryBindingProxy();
      proxy.setupConnectedChannel();
      proxy.setupSummary({ summary: QuestSummaryStub({ questId: 'q-summary' }) });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useQuestSummaryBinding({ questId: QUEST_ID }),
      });

      expect(result.current.loading).toBe(true);
    });

    it('EMPTY: {questId: null} => settles with no data and never calls the endpoint', async () => {
      const proxy = useQuestSummaryBindingProxy();
      proxy.setupConnectedChannel();
      proxy.setupSummary({ summary: QuestSummaryStub({ questId: 'q-summary' }) });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useQuestSummaryBinding({ questId: null }),
      });

      const currentState = (): ReturnType<typeof useQuestSummaryBinding> => result.current;

      await testingLibraryWaitForAdapter({
        callback: () => {
          expect(currentState().loading).toBe(false);
        },
      });

      expect(result.current).toStrictEqual({ data: null, loading: false, error: null });
      expect(proxy.getSummaryRequestCount()).toBe(0);
    });
  });

  describe('failed fetch', () => {
    it('ERROR: {endpoint returns 404} => surfaces the error and leaves data null', async () => {
      const proxy = useQuestSummaryBindingProxy();
      proxy.setupConnectedChannel();
      proxy.setupNotFound();

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useQuestSummaryBinding({ questId: QUEST_ID }),
      });

      const currentState = (): ReturnType<typeof useQuestSummaryBinding> => result.current;

      await testingLibraryWaitForAdapter({
        callback: () => {
          expect(currentState().loading).toBe(false);
        },
      });

      expect(result.current.data).toBe(null);
      expect(String(result.current.error?.message)).toBe(
        'GET /api/quests/q-summary/summary failed with status 404',
      );
    });
  });

  describe('quest-modified refetch', () => {
    it('VALID: {quest-modified for this quest} => re-fetches and replaces the summary', async () => {
      const proxy = useQuestSummaryBindingProxy();
      proxy.setupConnectedChannel();
      const initial = QuestSummaryStub({
        questId: 'q-summary',
        flows: [
          QuestSummaryFlowStub({
            tracks: [
              QuestSummaryTrackCountsStub({
                id: 'siegemaster',
                confirmed: 0,
                unconfirmable: 0,
                outstanding: 10,
              }),
            ],
          }),
        ],
      });
      proxy.setupSummary({ summary: initial });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useQuestSummaryBinding({ questId: QUEST_ID }),
      });

      const currentState = (): ReturnType<typeof useQuestSummaryBinding> => result.current;

      await testingLibraryWaitForAdapter({
        callback: () => {
          expect(currentState().loading).toBe(false);
        },
      });

      // A sign-off landed on disk: the same quest now reports one confirmed unit fewer outstanding.
      const afterSignoff = QuestSummaryStub({
        questId: 'q-summary',
        flows: [
          QuestSummaryFlowStub({
            tracks: [
              QuestSummaryTrackCountsStub({
                id: 'siegemaster',
                confirmed: 1,
                unconfirmable: 0,
                outstanding: 9,
              }),
            ],
          }),
        ],
      });
      proxy.setupSummary({ summary: afterSignoff });

      testingLibraryActAdapter({
        callback: () => {
          proxy.deliverWsMessage({
            data: JSON.stringify({
              type: 'quest-modified',
              payload: {
                questId: 'q-summary',
                quest: QuestStub({ id: 'q-summary', status: 'in_progress' }),
              },
              timestamp: '2026-01-01T00:00:00.000Z',
            }),
          });
        },
      });

      await testingLibraryWaitForAdapter({
        callback: () => {
          expect(currentState().data).toStrictEqual(afterSignoff);
        },
      });

      expect(result.current).toStrictEqual({ data: afterSignoff, loading: false, error: null });
    });

    it('VALID: {quest-modified for a DIFFERENT quest} => does not re-fetch', async () => {
      const proxy = useQuestSummaryBindingProxy();
      proxy.setupConnectedChannel();
      const initial = QuestSummaryStub({ questId: 'q-summary' });
      proxy.setupSummary({ summary: initial });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useQuestSummaryBinding({ questId: QUEST_ID }),
      });

      const currentState = (): ReturnType<typeof useQuestSummaryBinding> => result.current;

      await testingLibraryWaitForAdapter({
        callback: () => {
          expect(currentState().loading).toBe(false);
        },
      });

      testingLibraryActAdapter({
        callback: () => {
          proxy.deliverWsMessage({
            data: JSON.stringify({
              type: 'quest-modified',
              payload: {
                questId: String(OTHER_QUEST_ID),
                quest: QuestStub({ id: 'q-other', status: 'in_progress' }),
              },
              timestamp: '2026-01-01T00:00:00.000Z',
            }),
          });
        },
      });

      // Allow any microtasks a stray refetch would have queued to settle.
      await Promise.resolve();

      expect(proxy.getSummaryRequestCount()).toBe(1);
      expect(result.current).toStrictEqual({ data: initial, loading: false, error: null });
    });
  });
});
