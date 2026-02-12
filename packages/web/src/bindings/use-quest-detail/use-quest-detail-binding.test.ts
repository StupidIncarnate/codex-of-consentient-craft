import { QuestIdStub, QuestStub } from '@dungeonmaster/shared/contracts';

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

      proxy.setupError({ error: new Error('Network failure') });

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
        error: new Error('Network failure'),
        refresh: expect.any(Function),
      });
    });
  });
});
