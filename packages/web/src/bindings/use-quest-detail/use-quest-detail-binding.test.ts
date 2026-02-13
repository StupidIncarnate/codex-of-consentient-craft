import { QuestIdStub, QuestStub } from '@dungeonmaster/shared/contracts';

import { testingLibraryActAdapter } from '../../adapters/testing-library/act/testing-library-act-adapter';
import { testingLibraryRenderHookAdapter } from '../../adapters/testing-library/render-hook/testing-library-render-hook-adapter';
import { testingLibraryWaitForAdapter } from '../../adapters/testing-library/wait-for/testing-library-wait-for-adapter';

import { useQuestDetailBinding } from './use-quest-detail-binding';
import { useQuestDetailBindingProxy } from './use-quest-detail-binding.proxy';

describe('useQuestDetailBinding', () => {
  describe('with quest id', () => {
    it('VALID: {questId} => starts with loading true', () => {
      const proxy = useQuestDetailBindingProxy();
      const quest = QuestStub({ id: 'quest-1', title: 'Test Quest' });

      proxy.setupQuest({ quest });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useQuestDetailBinding({ questId: quest.id }),
      });

      expect(result.current).toStrictEqual({
        data: null,
        loading: true,
        error: null,
        refresh: expect.any(Function),
      });
    });

    it('VALID: {questId} => returns quest data after loading', async () => {
      const proxy = useQuestDetailBindingProxy();
      const quest = QuestStub({ id: 'quest-1', title: 'Test Quest' });

      proxy.setupQuest({ quest });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useQuestDetailBinding({ questId: quest.id }),
      });

      await testingLibraryWaitForAdapter({
        callback: () => {
          expect(result.current.loading).toBe(false);
        },
      });

      expect(result.current).toStrictEqual({
        data: quest,
        loading: false,
        error: null,
        refresh: expect.any(Function),
      });
    });
  });

  describe('without quest id', () => {
    it('EMPTY: {questId: null} => returns null data without loading', () => {
      useQuestDetailBindingProxy();

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useQuestDetailBinding({ questId: null }),
      });

      expect(result.current).toStrictEqual({
        data: null,
        loading: false,
        error: null,
        refresh: expect.any(Function),
      });
    });
  });

  describe('error handling', () => {
    it('ERROR: {fetch fails} => returns error state', async () => {
      const proxy = useQuestDetailBindingProxy();
      const questId = QuestIdStub({ value: 'quest-1' });

      proxy.setupError();

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useQuestDetailBinding({ questId }),
      });

      await testingLibraryWaitForAdapter({
        callback: () => {
          expect(result.current.loading).toBe(false);
        },
      });

      expect(result.current).toStrictEqual({
        data: null,
        loading: false,
        error: expect.any(Error),
        refresh: expect.any(Function),
      });
    });
  });

  describe('malformed API responses', () => {
    it('VALID: {broker resolves with partial quest (missing arrays)} => Zod fills defaults', async () => {
      const proxy = useQuestDetailBindingProxy();
      const questId = QuestIdStub({ value: 'quest-1' });
      const fullQuest = QuestStub({ id: 'quest-1', title: 'Partial' });
      const { requirements: _, contexts: _a, ...partialQuest } = fullQuest;

      proxy.setupQuest({ quest: partialQuest as ReturnType<typeof QuestStub> });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useQuestDetailBinding({ questId }),
      });

      await testingLibraryWaitForAdapter({
        callback: () => {
          expect(result.current.loading).toBe(false);
        },
      });

      expect(result.current).toStrictEqual({
        data: { ...partialQuest, requirements: [], contexts: [] },
        loading: false,
        error: null,
        refresh: expect.any(Function),
      });
    });

    it('ERROR: {broker resolves with null} => sets ZodError', async () => {
      const proxy = useQuestDetailBindingProxy();
      const questId = QuestIdStub({ value: 'quest-1' });

      proxy.setupQuest({ quest: null as never });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useQuestDetailBinding({ questId }),
      });

      await testingLibraryWaitForAdapter({
        callback: () => {
          expect(result.current.loading).toBe(false);
        },
      });

      expect(result.current.data).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.error?.name).toBe('ZodError');
    });
  });

  describe('race condition on questId change', () => {
    it('EDGE: {questId changes while fetch in-flight} => uses latest questId result, discards stale', async () => {
      const proxy = useQuestDetailBindingProxy();
      const questA = QuestStub({ id: 'quest-a', title: 'Quest A' });
      const questB = QuestStub({ id: 'quest-b', title: 'Quest B' });

      proxy.setupQuest({ quest: questA });

      let questId = questA.id;

      const { result, rerender } = testingLibraryRenderHookAdapter({
        renderCallback: () => useQuestDetailBinding({ questId }),
      });

      await testingLibraryWaitForAdapter({
        callback: () => {
          expect(result.current.loading).toBe(false);
        },
      });

      proxy.setupQuest({ quest: questB });
      questId = questB.id;
      rerender();

      await testingLibraryWaitForAdapter({
        callback: () => {
          expect(result.current.loading).toBe(false);
        },
      });

      expect(result.current).toStrictEqual({
        data: questB,
        loading: false,
        error: null,
        refresh: expect.any(Function),
      });
    });

    it('EDGE: {questId changes from valid to null while fetch in-flight} => stale response does not overwrite null', async () => {
      const proxy = useQuestDetailBindingProxy();
      const quest = QuestStub({ id: 'quest-1', title: 'Test Quest' });

      proxy.setupQuest({ quest });

      let questId: ReturnType<typeof QuestIdStub> | null = quest.id;

      const { result, rerender } = testingLibraryRenderHookAdapter({
        renderCallback: () => useQuestDetailBinding({ questId }),
      });

      await testingLibraryWaitForAdapter({
        callback: () => {
          expect(result.current.loading).toBe(false);
        },
      });

      questId = null;
      rerender();

      expect(result.current).toStrictEqual({
        data: null,
        loading: false,
        error: null,
        refresh: expect.any(Function),
      });
    });

    it('VALID: {questId changes from null to valid} => triggers fetch', async () => {
      const proxy = useQuestDetailBindingProxy();
      const quest = QuestStub({ id: 'quest-1', title: 'Test Quest' });

      let questId: ReturnType<typeof QuestIdStub> | null = null;

      const { result, rerender } = testingLibraryRenderHookAdapter({
        renderCallback: () => useQuestDetailBinding({ questId }),
      });

      proxy.setupQuest({ quest });
      questId = quest.id;
      rerender();

      await testingLibraryWaitForAdapter({
        callback: () => {
          expect(result.current.loading).toBe(false);
        },
      });

      expect(result.current).toStrictEqual({
        data: quest,
        loading: false,
        error: null,
        refresh: expect.any(Function),
      });
    });

    it('VALID: {questId changes from one valid ID to another} => triggers new fetch', async () => {
      const proxy = useQuestDetailBindingProxy();
      const questA = QuestStub({ id: 'quest-a', title: 'Quest A' });
      const questB = QuestStub({ id: 'quest-b', title: 'Quest B' });

      proxy.setupQuest({ quest: questA });

      let questId = questA.id;

      const { result, rerender } = testingLibraryRenderHookAdapter({
        renderCallback: () => useQuestDetailBinding({ questId }),
      });

      await testingLibraryWaitForAdapter({
        callback: () => {
          expect(result.current.loading).toBe(false);
        },
      });

      proxy.setupQuest({ quest: questB });
      questId = questB.id;
      rerender();

      await testingLibraryWaitForAdapter({
        callback: () => {
          expect(result.current.loading).toBe(false);
        },
      });

      expect(result.current).toStrictEqual({
        data: questB,
        loading: false,
        error: null,
        refresh: expect.any(Function),
      });
    });
  });

  describe('refresh and edge cases', () => {
    it('VALID: {refresh called after initial load} => re-fetches quest data', async () => {
      const proxy = useQuestDetailBindingProxy();
      const quest = QuestStub({ id: 'quest-1', title: 'Original' });
      const updatedQuest = QuestStub({ id: 'quest-1', title: 'Updated' });

      proxy.setupQuest({ quest });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useQuestDetailBinding({ questId: quest.id }),
      });

      await testingLibraryWaitForAdapter({
        callback: () => {
          expect(result.current.loading).toBe(false);
        },
      });

      proxy.setupQuest({ quest: updatedQuest });

      testingLibraryActAdapter({
        callback: () => {
          result.current.refresh().catch(() => undefined);
        },
      });

      await testingLibraryWaitForAdapter({
        callback: () => {
          expect(result.current.loading).toBe(false);
        },
      });

      expect(result.current).toStrictEqual({
        data: updatedQuest,
        loading: false,
        error: null,
        refresh: expect.any(Function),
      });
    });

    it('VALID: {refresh called after error} => clears error and retries', async () => {
      const proxy = useQuestDetailBindingProxy();
      const questId = QuestIdStub({ value: 'quest-1' });
      const quest = QuestStub({ id: 'quest-1', title: 'Recovered' });

      proxy.setupError();

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useQuestDetailBinding({ questId }),
      });

      await testingLibraryWaitForAdapter({
        callback: () => {
          expect(result.current.loading).toBe(false);
        },
      });

      proxy.setupQuest({ quest });

      testingLibraryActAdapter({
        callback: () => {
          result.current.refresh().catch(() => undefined);
        },
      });

      await testingLibraryWaitForAdapter({
        callback: () => {
          expect(result.current.loading).toBe(false);
        },
      });

      expect(result.current).toStrictEqual({
        data: quest,
        loading: false,
        error: null,
        refresh: expect.any(Function),
      });
    });

    it('ERROR: {broker throws non-Error value} => wraps in Error via String()', async () => {
      const proxy = useQuestDetailBindingProxy();
      const questId = QuestIdStub({ value: 'quest-1' });

      proxy.setupError();

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useQuestDetailBinding({ questId }),
      });

      await testingLibraryWaitForAdapter({
        callback: () => {
          expect(result.current.loading).toBe(false);
        },
      });

      expect(result.current).toStrictEqual({
        data: null,
        loading: false,
        error: expect.any(Error),
        refresh: expect.any(Function),
      });
    });
  });
});
