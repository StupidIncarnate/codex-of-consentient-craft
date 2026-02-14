import { GuildListItemStub } from '@dungeonmaster/shared/contracts';

import { testingLibraryActAdapter } from '../../adapters/testing-library/act/testing-library-act-adapter';
import { testingLibraryRenderHookAdapter } from '../../adapters/testing-library/render-hook/testing-library-render-hook-adapter';
import { testingLibraryWaitForAdapter } from '../../adapters/testing-library/wait-for/testing-library-wait-for-adapter';

import { useGuildsBinding } from './use-guilds-binding';
import { useGuildsBindingProxy } from './use-guilds-binding.proxy';

describe('useGuildsBinding', () => {
  describe('loading state', () => {
    it('VALID: {} => starts with loading true and empty guilds', () => {
      const proxy = useGuildsBindingProxy();
      proxy.setupGuilds({ guilds: [] });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useGuildsBinding(),
      });

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
        GuildListItemStub({ id: 'a1b2c3d4-5678-9abc-def0-123456789abc', name: 'Second Guild' }),
      ];

      proxy.setupGuilds({ guilds });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useGuildsBinding(),
      });

      await testingLibraryWaitForAdapter({
        callback: () => {
          expect(result.current.loading).toBe(false);
        },
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

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useGuildsBinding(),
      });

      await testingLibraryWaitForAdapter({
        callback: () => {
          expect(result.current.loading).toBe(false);
        },
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

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useGuildsBinding(),
      });

      await testingLibraryWaitForAdapter({
        callback: () => {
          expect(result.current.loading).toBe(false);
        },
      });

      expect(result.current).toStrictEqual({
        guilds: [],
        loading: false,
        error: expect.any(Error),
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

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useGuildsBinding(),
      });

      await testingLibraryWaitForAdapter({
        callback: () => {
          expect(result.current.loading).toBe(false);
        },
      });

      proxy.setupGuilds({
        guilds: [
          GuildListItemStub({ id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', name: 'First' }),
          GuildListItemStub({ id: 'a1b2c3d4-5678-9abc-def0-123456789abc', name: 'Second' }),
        ],
      });

      testingLibraryActAdapter({
        callback: () => {
          result.current.refresh().catch(() => undefined);
        },
      });

      await testingLibraryWaitForAdapter({
        callback: () => {
          expect(result.current.guilds).toHaveLength(2);
        },
      });

      expect(result.current).toStrictEqual({
        guilds: [
          GuildListItemStub({ id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', name: 'First' }),
          GuildListItemStub({ id: 'a1b2c3d4-5678-9abc-def0-123456789abc', name: 'Second' }),
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

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useGuildsBinding(),
      });

      await testingLibraryWaitForAdapter({
        callback: () => {
          expect(result.current.loading).toBe(false);
        },
      });

      expect(result.current).toStrictEqual({
        guilds: [],
        loading: false,
        error: expect.any(Error),
        refresh: expect.any(Function),
      });
    });
  });
});
