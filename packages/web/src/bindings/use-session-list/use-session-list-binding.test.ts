import { GuildIdStub, SessionListItemStub } from '@dungeonmaster/shared/contracts';

import { testingLibraryActAdapter } from '../../adapters/testing-library/act/testing-library-act-adapter';
import { testingLibraryRenderHookAdapter } from '../../adapters/testing-library/render-hook/testing-library-render-hook-adapter';
import { testingLibraryWaitForAdapter } from '../../adapters/testing-library/wait-for/testing-library-wait-for-adapter';

import { useSessionListBinding } from './use-session-list-binding';
import { useSessionListBindingProxy } from './use-session-list-binding.proxy';

const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });

describe('useSessionListBinding', () => {
  describe('loading state', () => {
    it('VALID: {guildId} => starts with loading true and empty data', () => {
      const proxy = useSessionListBindingProxy();
      proxy.setupSessions({ sessions: [] });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useSessionListBinding({ guildId }),
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
    it('VALID: {guildId} => returns sessions after loading', async () => {
      const proxy = useSessionListBindingProxy();
      const sessions = [
        SessionListItemStub({ sessionId: 'session-1' }),
        SessionListItemStub({ sessionId: 'session-2' }),
      ];

      proxy.setupSessions({ sessions });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useSessionListBinding({ guildId }),
      });

      await testingLibraryWaitForAdapter({
        callback: () => {
          expect(result.current.loading).toBe(false);
        },
      });

      expect(result.current).toStrictEqual({
        data: sessions,
        loading: false,
        error: null,
        refresh: expect.any(Function),
      });
    });
  });

  describe('empty state', () => {
    it('EMPTY: {no sessions} => returns empty array after loading', async () => {
      const proxy = useSessionListBindingProxy();
      proxy.setupSessions({ sessions: [] });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useSessionListBinding({ guildId }),
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
      const proxy = useSessionListBindingProxy();
      proxy.setupError();

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useSessionListBinding({ guildId }),
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
    it('VALID: {refresh called} => re-fetches sessions', async () => {
      const proxy = useSessionListBindingProxy();
      proxy.setupSessions({ sessions: [SessionListItemStub({ sessionId: 'session-1' })] });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useSessionListBinding({ guildId }),
      });

      await testingLibraryWaitForAdapter({
        callback: () => {
          expect(result.current.loading).toBe(false);
        },
      });

      proxy.setupSessions({
        sessions: [
          SessionListItemStub({ sessionId: 'session-1' }),
          SessionListItemStub({ sessionId: 'session-2' }),
        ],
      });

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
        data: [
          SessionListItemStub({ sessionId: 'session-1' }),
          SessionListItemStub({ sessionId: 'session-2' }),
        ],
        loading: false,
        error: null,
        refresh: expect.any(Function),
      });
    });
  });

  describe('null guildId', () => {
    it('EMPTY: {guildId: null} => returns empty data without loading', () => {
      useSessionListBindingProxy();

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useSessionListBinding({ guildId: null }),
      });

      expect(result.current).toStrictEqual({
        data: [],
        loading: false,
        error: null,
        refresh: expect.any(Function),
      });
    });
  });
});
