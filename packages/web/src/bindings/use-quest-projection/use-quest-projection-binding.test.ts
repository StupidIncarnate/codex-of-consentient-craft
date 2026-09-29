import { QuestIdStub } from '@dungeonmaster/shared/contracts/quest-id/quest-id.stub';
import { QuestProjectionStub } from '@dungeonmaster/shared/contracts/quest-projection/quest-projection.stub';
import { QuestStub } from '@dungeonmaster/shared/contracts/quest/quest.stub';

import { setTimeout } from '#gateway/browser/setTimeout';
import { act, renderHook, waitFor } from '#gateway/npm/testing-library__react';
import { useQuestProjectionBinding } from './use-quest-projection-binding';
import { useQuestProjectionBindingProxy } from './use-quest-projection-binding.proxy';

const QUEST_ID = QuestIdStub({ value: 'q-projection' });
const OTHER_QUEST_ID = QuestIdStub({ value: 'q-other' });

describe('useQuestProjectionBinding', () => {
  describe('initial mount', () => {
    it('VALID: {questId} => fetches and populates the projection', async () => {
      const proxy = useQuestProjectionBindingProxy();
      proxy.setupConnectedChannel();
      const projection = QuestProjectionStub({ questId: 'q-projection' });
      proxy.setupProjection({ projection });

      const { result } = renderHook(() => useQuestProjectionBinding({ questId: QUEST_ID }));

      const currentState = (): ReturnType<typeof useQuestProjectionBinding> => result.current;

      await waitFor(() => {
        expect(currentState().loading).toBe(false);
      });

      expect(result.current).toStrictEqual({ data: projection, loading: false, error: null });
    });

    it('VALID: {initial mount} => loading starts true', () => {
      const proxy = useQuestProjectionBindingProxy();
      proxy.setupConnectedChannel();
      proxy.setupProjection({ projection: QuestProjectionStub({ questId: 'q-projection' }) });

      const { result } = renderHook(() => useQuestProjectionBinding({ questId: QUEST_ID }));

      expect(result.current.loading).toBe(true);
    });

    it('EMPTY: {questId: null} => settles with no data and never calls the endpoint', async () => {
      const proxy = useQuestProjectionBindingProxy();
      proxy.setupConnectedChannel();
      proxy.setupProjection({ projection: QuestProjectionStub({ questId: 'q-projection' }) });

      const { result } = renderHook(() => useQuestProjectionBinding({ questId: null }));

      const currentState = (): ReturnType<typeof useQuestProjectionBinding> => result.current;

      await waitFor(() => {
        expect(currentState().loading).toBe(false);
      });

      expect(result.current).toStrictEqual({ data: null, loading: false, error: null });
      expect(proxy.getProjectionRequestCount()).toBe(0);
    });
  });

  describe('failed fetch', () => {
    it('ERROR: {endpoint returns 404} => surfaces the error and leaves data null', async () => {
      const proxy = useQuestProjectionBindingProxy();
      proxy.setupConnectedChannel();
      proxy.setupNotFound();

      const { result } = renderHook(() => useQuestProjectionBinding({ questId: QUEST_ID }));

      const currentState = (): ReturnType<typeof useQuestProjectionBinding> => result.current;

      await waitFor(() => {
        expect(currentState().loading).toBe(false);
      });

      expect(result.current.data).toBe(null);
      expect(String(result.current.error?.message)).toBe(
        'GET /api/quests/q-projection/projection failed with status 404: {"error":"Quest with id \\"q-missing\\" not found in any guild"}',
      );
    });
  });

  describe('quest-modified refetch', () => {
    it('VALID: {quest-modified for this quest} => re-fetches and replaces the projection', async () => {
      const proxy = useQuestProjectionBindingProxy();
      proxy.setupConnectedChannel();
      const initial = QuestProjectionStub({
        questId: 'q-projection',
        totalPlannedSteps: 2,
        completedSteps: 0,
      });
      proxy.setupProjection({ projection: initial });

      const { result } = renderHook(() => useQuestProjectionBinding({ questId: QUEST_ID }));

      const currentState = (): ReturnType<typeof useQuestProjectionBinding> => result.current;

      await waitFor(() => {
        expect(currentState().loading).toBe(false);
      });

      // A work item completed on disk: the same quest now reports one more completed step.
      const afterCompletion = QuestProjectionStub({
        questId: 'q-projection',
        totalPlannedSteps: 2,
        completedSteps: 1,
      });
      proxy.setupProjection({ projection: afterCompletion });

      act(() => {
        proxy.deliverWsMessage({
          data: JSON.stringify({
            type: 'quest-modified',
            payload: {
              questId: 'q-projection',
              quest: QuestStub({ id: 'q-projection', status: 'in_progress' }),
            },
            timestamp: '2026-01-01T00:00:00.000Z',
          }),
        });
      });

      await waitFor(() => {
        expect(currentState().data).toStrictEqual(afterCompletion);
      });

      expect(result.current).toStrictEqual({ data: afterCompletion, loading: false, error: null });
    });

    it('VALID: {quest-modified for a DIFFERENT quest} => does not re-fetch', async () => {
      const proxy = useQuestProjectionBindingProxy();
      proxy.setupConnectedChannel();
      const initial = QuestProjectionStub({ questId: 'q-projection' });
      proxy.setupProjection({ projection: initial });

      const { result } = renderHook(() => useQuestProjectionBinding({ questId: QUEST_ID }));

      const currentState = (): ReturnType<typeof useQuestProjectionBinding> => result.current;

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

      // A stray refetch runs its broker call and mock-fetch resolution across several microtask
      // hops — a single `await Promise.resolve()` drains only one and lets a broken filter pass
      // silently. Flushing to the next macrotask drains every queued microtask first, so a refetch
      // the filter should have blocked has always landed on state by the time this returns.
      await new Promise((resolve) => {
        setTimeout(resolve, 0);
      });

      expect(proxy.getProjectionRequestCount()).toBe(1);
      expect(result.current).toStrictEqual({ data: initial, loading: false, error: null });
    });
  });
});
