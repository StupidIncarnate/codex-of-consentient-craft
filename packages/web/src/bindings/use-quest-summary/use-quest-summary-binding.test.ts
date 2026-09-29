import {
  QuestIdStub,
  QuestStub,
  QuestSummaryFlowStub,
  QuestSummaryStub,
  QuestSummaryTrackCountsStub,
} from '@dungeonmaster/shared/contracts';

import { setTimeout } from '#gateway/browser/setTimeout';
import { act, renderHook, waitFor } from '#gateway/npm/testing-library__react';
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

      const { result } = renderHook(() => useQuestSummaryBinding({ questId: QUEST_ID }));

      const currentState = (): ReturnType<typeof useQuestSummaryBinding> => result.current;

      await waitFor(() => {
        expect(currentState().loading).toBe(false);
      });

      expect(result.current).toStrictEqual({ data: summary, loading: false, error: null });
    });

    it('VALID: {initial mount} => loading starts true', () => {
      const proxy = useQuestSummaryBindingProxy();
      proxy.setupConnectedChannel();
      proxy.setupSummary({ summary: QuestSummaryStub({ questId: 'q-summary' }) });

      const { result } = renderHook(() => useQuestSummaryBinding({ questId: QUEST_ID }));

      expect(result.current.loading).toBe(true);
    });

    it('EMPTY: {questId: null} => settles with no data and never calls the endpoint', async () => {
      const proxy = useQuestSummaryBindingProxy();
      proxy.setupConnectedChannel();
      proxy.setupSummary({ summary: QuestSummaryStub({ questId: 'q-summary' }) });

      const { result } = renderHook(() => useQuestSummaryBinding({ questId: null }));

      const currentState = (): ReturnType<typeof useQuestSummaryBinding> => result.current;

      await waitFor(() => {
        expect(currentState().loading).toBe(false);
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

      const { result } = renderHook(() => useQuestSummaryBinding({ questId: QUEST_ID }));

      const currentState = (): ReturnType<typeof useQuestSummaryBinding> => result.current;

      await waitFor(() => {
        expect(currentState().loading).toBe(false);
      });

      expect(result.current.data).toBe(null);
      expect(String(result.current.error?.message)).toBe(
        'GET /api/quests/q-summary/summary failed with status 404: {"error":"Quest with id \\"q-missing\\" not found in any guild"}',
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
                met: 0,
                cantMeet: 0,
                unmet: 0,
                outstanding: 10,
              }),
            ],
          }),
        ],
      });
      proxy.setupSummary({ summary: initial });

      const { result } = renderHook(() => useQuestSummaryBinding({ questId: QUEST_ID }));

      const currentState = (): ReturnType<typeof useQuestSummaryBinding> => result.current;

      await waitFor(() => {
        expect(currentState().loading).toBe(false);
      });

      // An observation landed on disk: the same quest now reports one unit met and one fewer
      // outstanding.
      const afterSignoff = QuestSummaryStub({
        questId: 'q-summary',
        flows: [
          QuestSummaryFlowStub({
            tracks: [
              QuestSummaryTrackCountsStub({
                id: 'siegemaster',
                met: 1,
                cantMeet: 0,
                unmet: 0,
                outstanding: 9,
              }),
            ],
          }),
        ],
      });
      proxy.setupSummary({ summary: afterSignoff });

      act(() => {
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
      });

      await waitFor(() => {
        expect(currentState().data).toStrictEqual(afterSignoff);
      });

      expect(result.current).toStrictEqual({ data: afterSignoff, loading: false, error: null });
    });

    it('VALID: {quest-modified for a DIFFERENT quest} => does not re-fetch', async () => {
      const proxy = useQuestSummaryBindingProxy();
      proxy.setupConnectedChannel();
      const initial = QuestSummaryStub({ questId: 'q-summary' });
      proxy.setupSummary({ summary: initial });

      const { result } = renderHook(() => useQuestSummaryBinding({ questId: QUEST_ID }));

      const currentState = (): ReturnType<typeof useQuestSummaryBinding> => result.current;

      await waitFor(() => {
        expect(currentState().loading).toBe(false);
      });

      act(() => {
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
      });

      // A stray refetch lands a macrotask later, so one microtask tick would let a broken filter pass.
      await new Promise((resolve) => {
        setTimeout(resolve, 0);
      });

      expect(proxy.getSummaryRequestCount()).toBe(1);
      expect(result.current).toStrictEqual({ data: initial, loading: false, error: null });
    });
  });
});
