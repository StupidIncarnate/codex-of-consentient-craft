import { GuildIdStub, GuildStub } from '@dungeonmaster/shared/contracts';

import { testingLibraryRenderHookAdapter } from '../../adapters/testing-library/render-hook/testing-library-render-hook-adapter';
import { testingLibraryWaitForAdapter } from '../../adapters/testing-library/wait-for/testing-library-wait-for-adapter';

import { useGuildDetailBinding } from './use-guild-detail-binding';
import { useGuildDetailBindingProxy } from './use-guild-detail-binding.proxy';

describe('useGuildDetailBinding', () => {
  describe('with guild id', () => {
    it('VALID: {guildId} => returns guild data after loading', async () => {
      const proxy = useGuildDetailBindingProxy();
      const guild = GuildStub({ name: 'Test Guild' });

      proxy.setupGuild({ guild });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useGuildDetailBinding({ guildId: guild.id }),
      });

      const currentState = (): ReturnType<typeof useGuildDetailBinding> => result.current;

      await testingLibraryWaitForAdapter({
        callback: () => {
          expect(currentState().loading).toBe(false);
        },
      });

      expect(result.current).toStrictEqual({
        data: guild,
        loading: false,
        error: null,
        refresh: expect.any(Function),
      });
    });
  });

  describe('without guild id', () => {
    it('EMPTY: {guildId: null} => returns null data without loading', () => {
      useGuildDetailBindingProxy();

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useGuildDetailBinding({ guildId: null }),
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
      const proxy = useGuildDetailBindingProxy();
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });

      proxy.setupError();

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useGuildDetailBinding({ guildId }),
      });

      const currentState = (): ReturnType<typeof useGuildDetailBinding> => result.current;

      await testingLibraryWaitForAdapter({
        callback: () => {
          expect(currentState().loading).toBe(false);
        },
      });

      const { error } = result.current;

      expect(error).toBeInstanceOf(Error);

      expect(result.current).toStrictEqual({
        data: null,
        loading: false,
        error,
        refresh: expect.any(Function),
      });
    });
  });

  describe('error logging', () => {
    it('ERROR: {useEffect fetch rejects past inner catch} => logs to console.error with [use-guild-detail] prefix', async () => {
      const proxy = useGuildDetailBindingProxy();
      const testGuildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      proxy.setupOuterCatchTrigger();

      const consoleErrorCalls = proxy.getConsoleErrorCalls();

      testingLibraryRenderHookAdapter({
        renderCallback: () => useGuildDetailBinding({ guildId: testGuildId }),
      });

      const getErrorCalls = (): unknown[][] => consoleErrorCalls;

      await testingLibraryWaitForAdapter({
        callback: () => {
          const loggedError = getErrorCalls()[0]?.[1];

          expect(loggedError).toBeInstanceOf(Error);
          expect(getErrorCalls()).toStrictEqual([['[use-guild-detail]', loggedError]]);
        },
      });

      const loggedError = consoleErrorCalls[0]?.[1];

      expect(loggedError).toBeInstanceOf(Error);
      expect(consoleErrorCalls).toStrictEqual([['[use-guild-detail]', loggedError]]);
    });
  });
});
