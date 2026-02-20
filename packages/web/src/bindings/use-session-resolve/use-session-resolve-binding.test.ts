import { GuildIdStub, QuestIdStub, SessionIdStub } from '@dungeonmaster/shared/contracts';

import { testingLibraryRenderHookAdapter } from '../../adapters/testing-library/render-hook/testing-library-render-hook-adapter';
import { testingLibraryWaitForAdapter } from '../../adapters/testing-library/wait-for/testing-library-wait-for-adapter';

import { useSessionResolveBinding } from './use-session-resolve-binding';
import { useSessionResolveBindingProxy } from './use-session-resolve-binding.proxy';

describe('useSessionResolveBinding', () => {
  describe('with both ids', () => {
    it('VALID: {guildId, sessionId} => returns quest id after loading', async () => {
      const proxy = useSessionResolveBindingProxy();
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const sessionId = SessionIdStub({ value: '9c4d8f1c-3e38-48c9-bdec-22b61883b473' });
      const questId = QuestIdStub({ value: 'add-auth' });

      proxy.setupResponse({ response: { questId } });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useSessionResolveBinding({ guildId, sessionId }),
      });

      await testingLibraryWaitForAdapter({
        callback: () => {
          expect(result.current.loading).toBe(false);
        },
      });

      expect(result.current).toStrictEqual({
        data: { questId },
        loading: false,
        error: null,
        refresh: expect.any(Function),
      });
    });

    it('VALID: {guildId, sessionId, no quest} => returns null quest id', async () => {
      const proxy = useSessionResolveBindingProxy();
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const sessionId = SessionIdStub({ value: '9c4d8f1c-3e38-48c9-bdec-22b61883b473' });

      proxy.setupResponse({ response: { questId: null } });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useSessionResolveBinding({ guildId, sessionId }),
      });

      await testingLibraryWaitForAdapter({
        callback: () => {
          expect(result.current.loading).toBe(false);
        },
      });

      expect(result.current).toStrictEqual({
        data: { questId: null },
        loading: false,
        error: null,
        refresh: expect.any(Function),
      });
    });
  });

  describe('without ids', () => {
    it('EMPTY: {guildId: null, sessionId: null} => returns null data without loading', () => {
      useSessionResolveBindingProxy();

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useSessionResolveBinding({ guildId: null, sessionId: null }),
      });

      expect(result.current).toStrictEqual({
        data: null,
        loading: false,
        error: null,
        refresh: expect.any(Function),
      });
    });

    it('EMPTY: {guildId present, sessionId: null} => returns null data without loading', () => {
      useSessionResolveBindingProxy();
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useSessionResolveBinding({ guildId, sessionId: null }),
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
      const proxy = useSessionResolveBindingProxy();
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const sessionId = SessionIdStub({ value: '9c4d8f1c-3e38-48c9-bdec-22b61883b473' });

      proxy.setupError();

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useSessionResolveBinding({ guildId, sessionId }),
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
