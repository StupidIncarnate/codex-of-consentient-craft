import { GuildIdStub, QuestListItemStub } from '@dungeonmaster/shared/contracts';

import { testingLibraryActAdapter } from '../../adapters/testing-library/act/testing-library-act-adapter';
import { testingLibraryRenderHookAdapter } from '../../adapters/testing-library/render-hook/testing-library-render-hook-adapter';
import { testingLibraryWaitForAdapter } from '../../adapters/testing-library/wait-for/testing-library-wait-for-adapter';

import { useQuestsBinding } from './use-quests-binding';
import { useQuestsBindingProxy } from './use-quests-binding.proxy';

const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });

describe('useQuestsBinding', () => {
  describe('loading state', () => {
    it('VALID: {guildId} => starts with loading true and empty data', () => {
      const proxy = useQuestsBindingProxy();
      proxy.setupQuests({ quests: [] });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useQuestsBinding({ guildId }),
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
    it('VALID: {guildId} => returns quests after loading', async () => {
      const proxy = useQuestsBindingProxy();
      const quests = [
        QuestListItemStub({ id: 'quest-1', title: 'First Quest' }),
        QuestListItemStub({ id: 'quest-2', title: 'Second Quest' }),
      ];

      proxy.setupQuests({ quests });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useQuestsBinding({ guildId }),
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
        renderCallback: () => useQuestsBinding({ guildId }),
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
      proxy.setupError();

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useQuestsBinding({ guildId }),
      });

      await testingLibraryWaitForAdapter({
        callback: () => {
          expect(result.current.loading).toBe(false);
        },
      });

      expect(result.current).toStrictEqual({
        data: [],
        loading: false,
        error: expect.any(Error),
        refresh: expect.any(Function),
      });
    });
  });

  describe('refresh', () => {
    it('VALID: {refresh called} => re-fetches quests', async () => {
      const proxy = useQuestsBindingProxy();
      proxy.setupQuests({ quests: [QuestListItemStub({ id: 'quest-1', title: 'First' })] });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useQuestsBinding({ guildId }),
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

    it('VALID: {refresh after error} => clears error and retries', async () => {
      const proxy = useQuestsBindingProxy();
      proxy.setupError();

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useQuestsBinding({ guildId }),
      });

      await testingLibraryWaitForAdapter({
        callback: () => {
          expect(result.current.loading).toBe(false);
        },
      });

      proxy.setupQuests({
        quests: [QuestListItemStub({ id: 'quest-1', title: 'Recovered' })],
      });

      testingLibraryActAdapter({
        callback: () => {
          result.current.refresh().catch(() => undefined);
        },
      });

      await testingLibraryWaitForAdapter({
        callback: () => {
          expect(result.current.data).toHaveLength(1);
        },
      });

      expect(result.current).toStrictEqual({
        data: [QuestListItemStub({ id: 'quest-1', title: 'Recovered' })],
        loading: false,
        error: null,
        refresh: expect.any(Function),
      });
    });

    it('ERROR: {refresh fails} => sets error, preserves previous data', async () => {
      const proxy = useQuestsBindingProxy();
      proxy.setupQuests({
        quests: [QuestListItemStub({ id: 'quest-1', title: 'Original' })],
      });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useQuestsBinding({ guildId }),
      });

      await testingLibraryWaitForAdapter({
        callback: () => {
          expect(result.current.loading).toBe(false);
        },
      });

      proxy.setupError();

      testingLibraryActAdapter({
        callback: () => {
          result.current.refresh().catch(() => undefined);
        },
      });

      await testingLibraryWaitForAdapter({
        callback: () => {
          expect(result.current.error).not.toBeNull();
        },
      });

      expect(result.current).toStrictEqual({
        data: [QuestListItemStub({ id: 'quest-1', title: 'Original' })],
        loading: false,
        error: expect.any(Error),
        refresh: expect.any(Function),
      });
    });
  });

  describe('malformed API responses', () => {
    it('ERROR: {broker resolves with non-array value} => sets ZodError', async () => {
      const proxy = useQuestsBindingProxy();
      proxy.setupQuests({ quests: { notAnArray: true } as never });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useQuestsBinding({ guildId }),
      });

      await testingLibraryWaitForAdapter({
        callback: () => {
          expect(result.current.loading).toBe(false);
        },
      });

      expect(result.current.data).toStrictEqual([]);
      expect(result.current.loading).toBe(false);
      expect(result.current.error?.name).toBe('ZodError');
    });

    it('ERROR: {broker resolves with undefined} => does not crash', async () => {
      const proxy = useQuestsBindingProxy();
      proxy.setupQuests({ quests: undefined as never });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useQuestsBinding({ guildId }),
      });

      await testingLibraryWaitForAdapter({
        callback: () => {
          expect(result.current.loading).toBe(false);
        },
      });

      expect(result.current).toStrictEqual({
        data: [],
        loading: false,
        error: expect.any(SyntaxError),
        refresh: expect.any(Function),
      });
    });
  });

  describe('non-Error thrown values', () => {
    it('ERROR: {broker throws non-Error value} => wraps in Error via String()', async () => {
      const proxy = useQuestsBindingProxy();
      proxy.setupError();

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useQuestsBinding({ guildId }),
      });

      await testingLibraryWaitForAdapter({
        callback: () => {
          expect(result.current.loading).toBe(false);
        },
      });

      expect(result.current).toStrictEqual({
        data: [],
        loading: false,
        error: expect.any(Error),
        refresh: expect.any(Function),
      });
    });
  });
});
