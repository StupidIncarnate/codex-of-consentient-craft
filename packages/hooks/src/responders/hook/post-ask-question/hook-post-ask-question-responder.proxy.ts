/**
 * PURPOSE: Proxy for hook-post-ask-question-responder that mocks fetch calls, port resolution,
 * and Date.now so tests can assert design decision extraction and HTTP dispatch
 *
 * USAGE:
 * const proxy = HookPostAskQuestionResponderProxy();
 * proxy.setupHappyPath({ questId: 'quest-abc-123' });
 * // ... call responder ...
 * proxy.getPatchedBody();
 */
import { portResolveBrokerProxy } from '@dungeonmaster/shared/testing';
import { registerSpyOn } from '@dungeonmaster/testing/register-mock';

import { fetchGetWithStatusAdapterProxy } from '../../../adapters/fetch/get-with-status/fetch-get-with-status-adapter.proxy';
import { fetchPatchAdapterProxy } from '../../../adapters/fetch/patch/fetch-patch-adapter.proxy';

const DEFAULT_NOW_MS = 0;

const buildResponse = ({
  ok,
  status,
  bodyText,
}: {
  ok: boolean;
  status: number;
  bodyText: string;
}): Response =>
  ({
    ok,
    status,
    text: async () => Promise.resolve(bodyText),
  }) as never;

export const HookPostAskQuestionResponderProxy = (): {
  setupHappyPath: (params: { questId: unknown }) => void;
  setupQuestNotFound: () => void;
  setupServerUnreachable: () => void;
  setupServer5xx: (params: { status: number; bodyText: string }) => void;
  setupInvalidResponseShape: () => void;
  setupPatchFails: (params: { error: Error }) => void;
  getPatchedBody: () => unknown;
  getPatchUrl: () => unknown;
  setNowMs: (params: { value: number }) => void;
} => {
  const portProxy = portResolveBrokerProxy();
  portProxy.setEnvPort({ value: '3737' });

  // Child proxies required by enforce-proxy-child-creation; instantiated before the direct
  // spy so the direct spy registration below wins and controls both fetch calls.
  fetchGetWithStatusAdapterProxy();
  fetchPatchAdapterProxy();

  const fetchHandle = registerSpyOn({ object: globalThis, method: 'fetch' });
  fetchHandle.mockResolvedValue(buildResponse({ ok: true, status: 200, bodyText: '{}' }));

  const nowHandle = registerSpyOn({ object: Date, method: 'now' });
  nowHandle.mockReturnValue(DEFAULT_NOW_MS);

  return {
    setupHappyPath: ({ questId }: { questId: unknown }): void => {
      // First call: GET /api/quests/by-session/:sessionId
      fetchHandle.mockResolvedValueOnce(
        buildResponse({ ok: true, status: 200, bodyText: JSON.stringify({ questId }) }),
      );
      // Second call: PATCH /api/quests/:questId
      fetchHandle.mockResolvedValueOnce(buildResponse({ ok: true, status: 200, bodyText: '' }));
    },
    setupQuestNotFound: (): void => {
      fetchHandle.mockResolvedValueOnce(
        buildResponse({
          ok: false,
          status: 404,
          bodyText: JSON.stringify({ error: 'No quest found for session' }),
        }),
      );
    },
    setupServerUnreachable: (): void => {
      fetchHandle.mockRejectedValueOnce(new TypeError('fetch failed'));
    },
    setupServer5xx: ({ status, bodyText }: { status: number; bodyText: string }): void => {
      fetchHandle.mockResolvedValueOnce(buildResponse({ ok: false, status, bodyText }));
    },
    setupInvalidResponseShape: (): void => {
      fetchHandle.mockResolvedValueOnce(
        buildResponse({
          ok: true,
          status: 200,
          bodyText: JSON.stringify({ wrongField: 'no questId here' }),
        }),
      );
    },
    setupPatchFails: ({ error }: { error: Error }): void => {
      fetchHandle.mockResolvedValueOnce(
        buildResponse({ ok: true, status: 200, bodyText: JSON.stringify({ questId: 'q-1' }) }),
      );
      fetchHandle.mockRejectedValueOnce(error);
    },
    getPatchedBody: (): unknown => {
      const { calls } = fetchHandle.mock;
      // PATCH is the second fetch call
      const [, patchCall] = calls;
      if (!patchCall) return undefined;
      const [, patchInit] = patchCall;
      const init = patchInit as { body?: unknown } | undefined;
      if (!init?.body) return undefined;
      const rawBody = init.body;
      if (typeof rawBody !== 'string') return rawBody;
      try {
        return JSON.parse(rawBody) as unknown;
      } catch {
        return rawBody;
      }
    },
    getPatchUrl: (): unknown => {
      const { calls } = fetchHandle.mock;
      // PATCH is the second fetch call
      const [, patchCall] = calls;
      if (!patchCall) return undefined;
      const [patchUrl] = patchCall;
      return patchUrl;
    },
    setNowMs: ({ value }: { value: number }): void => {
      nowHandle.mockReturnValue(value);
    },
  };
};
