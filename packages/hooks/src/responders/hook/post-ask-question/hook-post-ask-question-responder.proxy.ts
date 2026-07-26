/**
 * PURPOSE: Proxy for hook-post-ask-question-responder that mocks fetch calls, port resolution,
 * and Date.now so tests can assert design decision extraction and HTTP dispatch
 *
 * USAGE:
 * const proxy = HookPostAskQuestionResponderProxy();
 * proxy.setupHappyPath({ sessionId: 'session-abc', questId: 'quest-abc-123' });
 * // ... call responder ...
 * proxy.getPatchedBody();
 */
import { environmentStatics } from '@dungeonmaster/shared/statics';
import { portResolveBrokerProxy } from '@dungeonmaster/shared/testing';
import { registerSpyOn } from '@dungeonmaster/testing/register-mock';

import { fetchGetWithStatusAdapterProxy } from '../../../adapters/fetch/get-with-status/fetch-get-with-status-adapter.proxy';
import { fetchPatchAdapterProxy } from '../../../adapters/fetch/patch/fetch-patch-adapter.proxy';

const DEFAULT_NOW_MS = 0;
const MOCK_PORT = '3737';
const MOCK_BASE_URL = `http://${environmentStatics.hostname}:${MOCK_PORT}`;

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
  setupHappyPath: (params: { sessionId: string; questId: string }) => void;
  setupQuestNotFound: (params: { sessionId: string }) => void;
  setupServerUnreachable: (params: { sessionId: string }) => void;
  setupServer5xx: (params: { sessionId: string; status: number; bodyText: string }) => void;
  setupInvalidResponseShape: (params: { sessionId: string }) => void;
  setupPatchFails: (params: { sessionId: string; questId: string; error: Error }) => void;
  getPatchedBody: () => unknown;
  getPatchUrl: () => unknown;
  setNowMs: (params: { value: number }) => void;
} => {
  const portProxy = portResolveBrokerProxy();
  portProxy.setEnvPort({ value: MOCK_PORT });

  // Child proxies required by enforce-proxy-child-creation; they no longer stage any behaviour
  // of their own (each mocked call must now be described explicitly), so they contribute nothing
  // to the shared fetch spy below — only the direct registration in this file stages responses.
  fetchGetWithStatusAdapterProxy();
  fetchPatchAdapterProxy();

  const fetchHandle = registerSpyOn({ object: globalThis, method: 'fetch' });

  const nowHandle = registerSpyOn({ object: Date, method: 'now' });
  // Date.now() takes no arguments to key on, so a bare calledWith([]) is the honest
  // description, not a lazy fallback.
  nowHandle.calledWith([]).returns(DEFAULT_NOW_MS);

  return {
    // The URL is the address — GET (lookup) and PATCH (persist) share one fetch spy, so staging
    // by call order would silently answer the PATCH with the GET's response (or vice versa) the
    // moment either test shape changed. Each URL is built the same way the responder itself
    // builds it (see hook-post-ask-question-responder.ts), so staging always describes the exact
    // call production makes.
    setupHappyPath: ({ sessionId, questId }: { sessionId: string; questId: string }): void => {
      const lookupUrl = `${MOCK_BASE_URL}/api/quests/by-session/${sessionId}`;
      const patchUrl = `${MOCK_BASE_URL}/api/quests/${questId}`;

      fetchHandle
        .calledWith([lookupUrl])
        .resolves(buildResponse({ ok: true, status: 200, bodyText: JSON.stringify({ questId }) }));
      fetchHandle
        .calledWith([patchUrl])
        .resolves(buildResponse({ ok: true, status: 200, bodyText: '' }));
    },
    setupQuestNotFound: ({ sessionId }: { sessionId: string }): void => {
      const lookupUrl = `${MOCK_BASE_URL}/api/quests/by-session/${sessionId}`;

      fetchHandle.calledWith([lookupUrl]).resolves(
        buildResponse({
          ok: false,
          status: 404,
          bodyText: JSON.stringify({ error: 'No quest found for session' }),
        }),
      );
    },
    setupServerUnreachable: ({ sessionId }: { sessionId: string }): void => {
      const lookupUrl = `${MOCK_BASE_URL}/api/quests/by-session/${sessionId}`;

      fetchHandle.calledWith([lookupUrl]).rejects(new TypeError('fetch failed'));
    },
    setupServer5xx: ({
      sessionId,
      status,
      bodyText,
    }: {
      sessionId: string;
      status: number;
      bodyText: string;
    }): void => {
      const lookupUrl = `${MOCK_BASE_URL}/api/quests/by-session/${sessionId}`;

      fetchHandle.calledWith([lookupUrl]).resolves(buildResponse({ ok: false, status, bodyText }));
    },
    setupInvalidResponseShape: ({ sessionId }: { sessionId: string }): void => {
      const lookupUrl = `${MOCK_BASE_URL}/api/quests/by-session/${sessionId}`;

      fetchHandle.calledWith([lookupUrl]).resolves(
        buildResponse({
          ok: true,
          status: 200,
          bodyText: JSON.stringify({ wrongField: 'no questId here' }),
        }),
      );
    },
    setupPatchFails: ({
      sessionId,
      questId,
      error,
    }: {
      sessionId: string;
      questId: string;
      error: Error;
    }): void => {
      const lookupUrl = `${MOCK_BASE_URL}/api/quests/by-session/${sessionId}`;
      const patchUrl = `${MOCK_BASE_URL}/api/quests/${questId}`;

      fetchHandle
        .calledWith([lookupUrl])
        .resolves(buildResponse({ ok: true, status: 200, bodyText: JSON.stringify({ questId }) }));
      fetchHandle.calledWith([patchUrl]).rejects(error);
    },
    // A test asserting "no PATCH happened" doesn't know a questId to build the PATCH URL from —
    // there may be no PATCH call at all. `method: 'PATCH'` is a structural property of the call
    // itself (GET calls never carry it), so it identifies the PATCH call among this spy's calls
    // without depending on knowing the URL or on call order.
    getPatchedBody: (): unknown => {
      const patchCalls = fetchHandle.callsMatching([(): boolean => true, { method: 'PATCH' }]);
      const lastPatchCall = patchCalls.at(-1);
      if (!lastPatchCall) return undefined;
      const init = lastPatchCall[1] as { body?: unknown } | undefined;
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
      const patchCalls = fetchHandle.callsMatching([(): boolean => true, { method: 'PATCH' }]);
      return patchCalls.at(-1)?.[0];
    },
    setNowMs: ({ value }: { value: number }): void => {
      nowHandle.calledWith([]).returns(value);
    },
  };
};
