import { GuildListItemStub } from '@dungeonmaster/shared/contracts';

import { act, renderHook, waitFor } from '#gateway/npm/testing-library__react';

import { useGuildsBinding } from './use-guilds-binding';
import { useGuildsBindingProxy } from './use-guilds-binding.proxy';

describe('useGuildsBinding', () => {
  describe('loading state', () => {
    it('VALID: {} => starts with loading true and empty guilds', () => {
      const proxy = useGuildsBindingProxy();
      proxy.setupGuilds({ guilds: [] });

      const { result } = renderHook(() => useGuildsBinding());

      expect(result.current).toStrictEqual({
        guilds: [],
        loading: true,
        error: null,
        refresh: expect.any(Function),
      });
    });
  });

  describe('successful fetch', () => {
    it('VALID: {} => returns guilds after loading', async () => {
      const proxy = useGuildsBindingProxy();
      const guilds = [
        GuildListItemStub({ id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', name: 'First Guild' }),
        GuildListItemStub({ id: 'c2cb8161-6200-6ca1-b8d4-8b9a3c14cc7c', name: 'Second Guild' }),
      ];

      proxy.setupGuilds({ guilds });

      const { result } = renderHook(() => useGuildsBinding());

      const currentState = (): ReturnType<typeof useGuildsBinding> => result.current;

      await waitFor(() => {
        expect(currentState().loading).toBe(false);
      });

      expect(result.current).toStrictEqual({
        guilds,
        loading: false,
        error: null,
        refresh: expect.any(Function),
      });
    });
  });

  describe('empty state', () => {
    it('EMPTY: {no guilds} => returns empty array after loading', async () => {
      const proxy = useGuildsBindingProxy();
      proxy.setupGuilds({ guilds: [] });

      const { result } = renderHook(() => useGuildsBinding());

      const currentState = (): ReturnType<typeof useGuildsBinding> => result.current;

      await waitFor(() => {
        expect(currentState().loading).toBe(false);
      });

      expect(result.current).toStrictEqual({
        guilds: [],
        loading: false,
        error: null,
        refresh: expect.any(Function),
      });
    });
  });

  describe('error handling', () => {
    it('ERROR: {broker throws} => returns error state', async () => {
      const proxy = useGuildsBindingProxy();
      proxy.setupError();

      const { result } = renderHook(() => useGuildsBinding());

      const currentState = (): ReturnType<typeof useGuildsBinding> => result.current;

      await waitFor(() => {
        expect(currentState().loading).toBe(false);
      });

      const { error } = result.current;

      expect(error).toBeInstanceOf(Error);

      expect(result.current).toStrictEqual({
        guilds: [],
        loading: false,
        error,
        refresh: expect.any(Function),
      });
    });
  });

  describe('refresh', () => {
    it('VALID: {refresh called} => re-fetches guilds', async () => {
      const proxy = useGuildsBindingProxy();
      proxy.setupGuilds({
        guilds: [GuildListItemStub({ id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', name: 'First' })],
      });

      const { result } = renderHook(() => useGuildsBinding());

      const currentState = (): ReturnType<typeof useGuildsBinding> => result.current;

      await waitFor(() => {
        expect(currentState().loading).toBe(false);
      });

      proxy.setupGuilds({
        guilds: [
          GuildListItemStub({ id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', name: 'First' }),
          GuildListItemStub({ id: 'c2cb8161-6200-6ca1-b8d4-8b9a3c14cc7c', name: 'Second' }),
        ],
      });

      const { refresh } = result.current;

      act(() => {
        refresh().catch((error: unknown) => {
          globalThis.console.error('[test] refresh failed', error);
        });
      });

      await waitFor(() => {
        expect(currentState().loading).toBe(false);
      });

      expect(result.current).toStrictEqual({
        guilds: [
          GuildListItemStub({ id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', name: 'First' }),
          GuildListItemStub({ id: 'c2cb8161-6200-6ca1-b8d4-8b9a3c14cc7c', name: 'Second' }),
        ],
        loading: false,
        error: null,
        refresh: expect.any(Function),
      });
    });
  });

  describe('non-Error thrown values', () => {
    it('ERROR: {broker throws non-Error value} => wraps in Error via String()', async () => {
      const proxy = useGuildsBindingProxy();
      proxy.setupError();

      const { result } = renderHook(() => useGuildsBinding());

      const currentState = (): ReturnType<typeof useGuildsBinding> => result.current;

      await waitFor(() => {
        expect(currentState().loading).toBe(false);
      });

      const { error } = result.current;

      expect(error).toBeInstanceOf(Error);

      expect(result.current).toStrictEqual({
        guilds: [],
        loading: false,
        error,
        refresh: expect.any(Function),
      });
    });
  });

  describe('error logging', () => {
    it('ERROR: {useEffect fetch rejects past inner catch} => logs to console.error with [use-guilds] prefix', async () => {
      const proxy = useGuildsBindingProxy();
      proxy.setupOuterCatchTrigger();

      renderHook(() => useGuildsBinding());

      await waitFor(() => {
        const loggedError = proxy.getConsoleErrorCalls()[0]?.[1];

        expect(loggedError).toBeInstanceOf(Error);
        expect(proxy.getConsoleErrorCalls()).toStrictEqual([['[use-guilds]', loggedError]]);
      });

      const loggedError = proxy.getConsoleErrorCalls()[0]?.[1];

      expect(loggedError).toBeInstanceOf(Error);
      expect(proxy.getConsoleErrorCalls()).toStrictEqual([['[use-guilds]', loggedError]]);
    });
  });
});
