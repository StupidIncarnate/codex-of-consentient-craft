import { GuildIdStub } from '@dungeonmaster/shared/contracts/guild-id/guild-id.stub';
import { QuestListItemStub } from '@dungeonmaster/shared/contracts/quest-list-item/quest-list-item.stub';
import { SkippedQuestFileStub } from '@dungeonmaster/shared/contracts/skipped-quest-file/skipped-quest-file.stub';

import { console } from '#gateway/browser/console';
import { act, renderHook, waitFor } from '#gateway/npm/testing-library__react';

import { useQuestsBinding } from './use-quests-binding';
import { useQuestsBindingProxy } from './use-quests-binding.proxy';

const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });

describe('useQuestsBinding', () => {
  describe('loading state', () => {
    it('VALID: {guildId} => starts with loading true and empty data', () => {
      const proxy = useQuestsBindingProxy();
      proxy.setupQuests({ quests: [] });

      const { result } = renderHook(() => useQuestsBinding({ guildId }));

      expect(result.current).toStrictEqual({
        data: [],
        skipped: [],
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

      const { result } = renderHook(() => useQuestsBinding({ guildId }));

      const currentState = (): ReturnType<typeof useQuestsBinding> => result.current;

      await waitFor(() => {
        expect(currentState().loading).toBe(false);
      });

      expect(result.current).toStrictEqual({
        data: quests,
        skipped: [],
        loading: false,
        error: null,
        refresh: expect.any(Function),
      });
    });
  });

  describe('skipped quest files', () => {
    it('VALID: {list reports one skipped quest file} => exposes it in `skipped` with error still null', async () => {
      const proxy = useQuestsBindingProxy();
      const quests = [QuestListItemStub({ id: 'quest-1', title: 'First Quest' })];
      const skipped = [SkippedQuestFileStub()];

      proxy.setupQuestsWithSkips({ quests, skipped });

      const { result } = renderHook(() => useQuestsBinding({ guildId }));

      const currentState = (): ReturnType<typeof useQuestsBinding> => result.current;

      await waitFor(() => {
        expect(currentState().loading).toBe(false);
      });

      expect(result.current).toStrictEqual({
        data: quests,
        skipped,
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

      const { result } = renderHook(() => useQuestsBinding({ guildId }));

      const currentState = (): ReturnType<typeof useQuestsBinding> => result.current;

      await waitFor(() => {
        expect(currentState().loading).toBe(false);
      });

      expect(result.current).toStrictEqual({
        data: [],
        skipped: [],
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

      const { result } = renderHook(() => useQuestsBinding({ guildId }));

      const currentState = (): ReturnType<typeof useQuestsBinding> => result.current;

      await waitFor(() => {
        expect(currentState().loading).toBe(false);
      });

      const { error } = result.current;

      expect(error).toBeInstanceOf(Error);

      expect(result.current).toStrictEqual({
        data: [],
        skipped: [],
        loading: false,
        error,
        refresh: expect.any(Function),
      });
    });
  });

  describe('refresh', () => {
    it('VALID: {refresh called} => re-fetches quests', async () => {
      const proxy = useQuestsBindingProxy();
      proxy.setupQuests({ quests: [QuestListItemStub({ id: 'quest-1', title: 'First' })] });

      const { result } = renderHook(() => useQuestsBinding({ guildId }));

      const currentState = (): ReturnType<typeof useQuestsBinding> => result.current;

      await waitFor(() => {
        expect(currentState().loading).toBe(false);
      });

      proxy.setupQuests({
        quests: [
          QuestListItemStub({ id: 'quest-1', title: 'First' }),
          QuestListItemStub({ id: 'quest-2', title: 'Second' }),
        ],
      });

      const { refresh } = result.current;

      act(() => {
        refresh().catch((error: unknown) => {
          console.error('[test] refresh failed', error);
        });
      });

      await waitFor(() => {
        expect(currentState().loading).toBe(false);
      });

      expect(result.current).toStrictEqual({
        data: [
          QuestListItemStub({ id: 'quest-1', title: 'First' }),
          QuestListItemStub({ id: 'quest-2', title: 'Second' }),
        ],
        skipped: [],
        loading: false,
        error: null,
        refresh: expect.any(Function),
      });
    });

    it('VALID: {refresh after error} => clears error and retries', async () => {
      const proxy = useQuestsBindingProxy();
      proxy.setupError();

      const { result } = renderHook(() => useQuestsBinding({ guildId }));

      const currentState = (): ReturnType<typeof useQuestsBinding> => result.current;

      await waitFor(() => {
        expect(currentState().loading).toBe(false);
      });

      proxy.setupQuests({
        quests: [QuestListItemStub({ id: 'quest-1', title: 'Recovered' })],
      });

      const { refresh } = result.current;

      act(() => {
        refresh().catch((error: unknown) => {
          console.error('[test] refresh failed', error);
        });
      });

      await waitFor(() => {
        expect(currentState().loading).toBe(false);
      });

      expect(result.current).toStrictEqual({
        data: [QuestListItemStub({ id: 'quest-1', title: 'Recovered' })],
        skipped: [],
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

      const { result } = renderHook(() => useQuestsBinding({ guildId }));

      const currentState = (): ReturnType<typeof useQuestsBinding> => result.current;

      await waitFor(() => {
        expect(currentState().loading).toBe(false);
      });

      proxy.setupError();

      const { refresh } = result.current;

      act(() => {
        refresh().catch((error: unknown) => {
          console.error('[test] refresh failed', error);
        });
      });

      await waitFor(() => {
        expect(currentState().loading).toBe(false);
      });

      const { error } = result.current;

      expect(error).toBeInstanceOf(Error);

      expect(result.current).toStrictEqual({
        data: [QuestListItemStub({ id: 'quest-1', title: 'Original' })],
        skipped: [],
        loading: false,
        error,
        refresh: expect.any(Function),
      });
    });
  });

  describe('malformed API responses', () => {
    it('ERROR: {broker resolves with non-array value} => sets ZodError', async () => {
      const proxy = useQuestsBindingProxy();
      proxy.setupQuests({ quests: { notAnArray: true } as never });

      const { result } = renderHook(() => useQuestsBinding({ guildId }));

      const currentState = (): ReturnType<typeof useQuestsBinding> => result.current;

      await waitFor(() => {
        expect(currentState().loading).toBe(false);
      });

      expect(result.current.error?.name).toBe('ZodError');
    });

    it('ERROR: {broker resolves with an empty body} => does not crash', async () => {
      const proxy = useQuestsBindingProxy();
      proxy.setupEmptyBody();

      const { result } = renderHook(() => useQuestsBinding({ guildId }));

      const currentState = (): ReturnType<typeof useQuestsBinding> => result.current;

      await waitFor(() => {
        expect(currentState().loading).toBe(false);
      });

      const { error } = result.current;

      expect(error?.message).toBe(
        `GET /api/quests?guildId=${guildId} returned invalid JSON: Unexpected end of JSON input (body: )`,
      );

      expect(result.current).toStrictEqual({
        data: [],
        skipped: [],
        loading: false,
        error,
        refresh: expect.any(Function),
      });
    });
  });

  describe('non-Error thrown values', () => {
    it('ERROR: {broker throws non-Error value} => wraps in Error via String()', async () => {
      const proxy = useQuestsBindingProxy();
      proxy.setupError();

      const { result } = renderHook(() => useQuestsBinding({ guildId }));

      const currentState = (): ReturnType<typeof useQuestsBinding> => result.current;

      await waitFor(() => {
        expect(currentState().loading).toBe(false);
      });

      const { error } = result.current;

      expect(error).toBeInstanceOf(Error);

      expect(result.current).toStrictEqual({
        data: [],
        skipped: [],
        loading: false,
        error,
        refresh: expect.any(Function),
      });
    });
  });

  describe('error logging', () => {
    it('ERROR: {useEffect fetch rejects past inner catch} => logs to console.error with [use-quests] prefix', async () => {
      const proxy = useQuestsBindingProxy();
      proxy.setupOuterCatchTrigger({ guildId });

      renderHook(() => useQuestsBinding({ guildId }));

      await waitFor(() => {
        expect(proxy.getConsoleErrorCalls()[0]?.[0]).toBe('[use-quests]');
      });

      expect(proxy.getConsoleErrorCalls()[0]?.[1]).toBeInstanceOf(Error);
    });
  });
});
