import { QuestListItemStub } from '@dungeonmaster/shared/contracts';

import { testingLibraryActAdapter } from '../../adapters/testing-library/act/testing-library-act-adapter';
import { testingLibraryRenderHookAdapter } from '../../adapters/testing-library/render-hook/testing-library-render-hook-adapter';
import { testingLibraryWaitForAdapter } from '../../adapters/testing-library/wait-for/testing-library-wait-for-adapter';

import { useQuestsBinding } from './use-quests-binding';
import { useQuestsBindingProxy } from './use-quests-binding.proxy';

describe('useQuestsBinding', () => {
  describe('loading state', () => {
    it('VALID: {} => starts with loading true and empty data', () => {
      const proxy = useQuestsBindingProxy();
      proxy.setupQuests({ quests: [] });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useQuestsBinding(),
      });

      expect(result.current).toStrictEqual({
        data: [],
        loading: true,
        error: null,
        refresh: expect.any(Function),
      });
    });
  });

  describe('successful fetch', () => {
    it('VALID: {} => returns quests after loading', async () => {
      const proxy = useQuestsBindingProxy();
      const quests = [
        QuestListItemStub({ id: 'quest-1', title: 'First Quest' }),
        QuestListItemStub({ id: 'quest-2', title: 'Second Quest' }),
      ];

      proxy.setupQuests({ quests });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useQuestsBinding(),
      });

      await testingLibraryWaitForAdapter({
        callback: () => {
          expect(result.current.loading).toBe(false);
        },
      });

      expect(result.current).toStrictEqual({
        data: quests,
        loading: false,
        error: null,
        refresh: expect.any(Function),
      });
    });
  });

  describe('empty state', () => {
    it('EMPTY: {no quests} => returns empty array after loading', async () => {
      const proxy = useQuestsBindingProxy();
      proxy.setupQuests({ quests: [] });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useQuestsBinding(),
      });

      await testingLibraryWaitForAdapter({
        callback: () => {
          expect(result.current.loading).toBe(false);
        },
      });

      expect(result.current).toStrictEqual({
        data: [],
        loading: false,
        error: null,
        refresh: expect.any(Function),
      });
    });
  });

  describe('error handling', () => {
    it('ERROR: {broker throws} => returns error state', async () => {
      const proxy = useQuestsBindingProxy();
      proxy.setupError({ error: new Error('Failed to list quests') });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useQuestsBinding(),
      });

      await testingLibraryWaitForAdapter({
        callback: () => {
          expect(result.current.loading).toBe(false);
        },
      });

      expect(result.current).toStrictEqual({
        data: [],
        loading: false,
        error: new Error('Failed to list quests'),
        refresh: expect.any(Function),
      });
    });
  });

  describe('refresh', () => {
    it('VALID: {refresh called} => re-fetches quests', async () => {
      const proxy = useQuestsBindingProxy();
      proxy.setupQuests({ quests: [QuestListItemStub({ id: 'quest-1', title: 'First' })] });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useQuestsBinding(),
      });

      await testingLibraryWaitForAdapter({
        callback: () => {
          expect(result.current.loading).toBe(false);
        },
      });

      proxy.setupQuests({
        quests: [
          QuestListItemStub({ id: 'quest-1', title: 'First' }),
          QuestListItemStub({ id: 'quest-2', title: 'Second' }),
        ],
      });

      testingLibraryActAdapter({
        callback: () => {
          result.current.refresh().catch(() => undefined);
        },
      });

      await testingLibraryWaitForAdapter({
        callback: () => {
          expect(result.current.data).toHaveLength(2);
        },
      });

      expect(result.current).toStrictEqual({
        data: [
          QuestListItemStub({ id: 'quest-1', title: 'First' }),
          QuestListItemStub({ id: 'quest-2', title: 'Second' }),
        ],
        loading: false,
        error: null,
        refresh: expect.any(Function),
      });
    });
  });
});
