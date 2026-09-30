/**
 * PURPOSE: Proxy for hook-post-ask-question-responder that stages the gateway fetch, clock and
 * stderr proxies plus port resolution, so tests can assert design decision extraction and HTTP
 * dispatch
 *
 * USAGE:
 * const proxy = HookPostAskQuestionResponderProxy();
 * proxy.setupHappyPath({ sessionId: 'session-abc', questId: 'quest-abc-123' });
 * // ... call responder ...
 * proxy.getPatchedBody({ questId: 'quest-abc-123' });
 */
import type { Quest } from '@dungeonmaster/shared/contracts';
import { environmentStatics } from '@dungeonmaster/shared/statics';
import { portResolveBrokerProxy } from '@dungeonmaster/shared/brokers/port/resolve/port-resolve-broker.proxy';

import { nowProxy } from '#gateway/node/Date/now/now.proxy';
import { fetchWithStatusProxy } from '#gateway/node/fetch/fetch-with-status/fetch-with-status.proxy';
import { fetchJsonProxy } from '#gateway/node/fetch/fetch-json/fetch-json.proxy';
import { ConnectionRefusedRecordedErrorStub } from '#gateway/node/net/connection-refused-recorded-error/connection-refused-recorded-error.stub';
import { stderrProxy } from '#gateway/node/process/stderr/stderr.proxy';

const MOCK_PORT = '3737';
const MOCK_BASE_URL = `http://${environmentStatics.hostname}:${MOCK_PORT}`;

export const HookPostAskQuestionResponderProxy = (): {
  setupHappyPath: (params: { sessionId: string; questId: Quest['id'] }) => void;
  setupQuestNotFound: (params: { sessionId: string }) => void;
  setupServerUnreachable: (params: { sessionId: string }) => void;
  setupServer5xx: (params: { sessionId: string; status: number; bodyText: string }) => void;
  setupInvalidResponseShape: (params: { sessionId: string }) => void;
  setupPatchFails: (params: { sessionId: string; questId: Quest['id'] }) => void;
  getPatchedBody: (params: { questId: Quest['id'] }) => unknown;
  getPatchUrl: (params: { questId: Quest['id'] }) => unknown;
  getLookupUrls: (params: { sessionId: string }) => readonly unknown[];
  getStderrText: ReturnType<typeof stderrProxy>['getWrittenText'];
  setNowMs: (params: { value: number }) => void;
} => {
  const portProxy = portResolveBrokerProxy();
  portProxy.setEnvPort({ value: MOCK_PORT });

  // Every fetch proxy shares the one spy on the global fetch; each stage is keyed on a URL, so a
  // GET lookup and the PATCH that follows it are answered independently of call order.
  const fetchWithStatus = fetchWithStatusProxy();
  const fetchJson = fetchJsonProxy();
  const stderrGateway = stderrProxy();
  const clock = nowProxy();

  return {
    setupHappyPath: ({ sessionId, questId }: { sessionId: string; questId: Quest['id'] }): void => {
      fetchWithStatus.setupResponse({
        url: `${MOCK_BASE_URL}/api/quests/by-session/${sessionId}`,
        status: 200,
        bodyText: JSON.stringify({ questId }),
      });
      fetchJson.setupSuccess({ url: `${MOCK_BASE_URL}/api/quests/${questId}`, body: {} });
    },
    setupQuestNotFound: ({ sessionId }: { sessionId: string }): void => {
      fetchWithStatus.setupResponse({
        url: `${MOCK_BASE_URL}/api/quests/by-session/${sessionId}`,
        status: 404,
        bodyText: JSON.stringify({ error: 'No quest found for session' }),
      });
    },
    setupServerUnreachable: ({ sessionId }: { sessionId: string }): void => {
      fetchWithStatus.setupRefused({
        url: `${MOCK_BASE_URL}/api/quests/by-session/${sessionId}`,
        cause: ConnectionRefusedRecordedErrorStub({ port: Number(MOCK_PORT) }),
      });
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
      fetchWithStatus.setupResponse({
        url: `${MOCK_BASE_URL}/api/quests/by-session/${sessionId}`,
        status,
        bodyText,
      });
    },
    setupInvalidResponseShape: ({ sessionId }: { sessionId: string }): void => {
      fetchWithStatus.setupResponse({
        url: `${MOCK_BASE_URL}/api/quests/by-session/${sessionId}`,
        status: 200,
        bodyText: JSON.stringify({ wrongField: 'no questId here' }),
      });
    },
    setupPatchFails: ({ sessionId, questId }: { sessionId: string; questId: Quest['id'] }): void => {
      fetchWithStatus.setupResponse({
        url: `${MOCK_BASE_URL}/api/quests/by-session/${sessionId}`,
        status: 200,
        bodyText: JSON.stringify({ questId }),
      });
      fetchJson.setupConnectionRefused({ url: `${MOCK_BASE_URL}/api/quests/${questId}` });
    },
    getPatchedBody: ({ questId }: { questId: Quest['id'] }): unknown => {
      const lastPatchCall = fetchJson
        .getCallsFor({ url: `${MOCK_BASE_URL}/api/quests/${questId}` })
        .at(-1);
      const init = lastPatchCall?.[1] as { body?: unknown } | undefined;
      if (typeof init?.body !== 'string') return init?.body;
      return JSON.parse(init.body) as unknown;
    },
    getPatchUrl: ({ questId }: { questId: Quest['id'] }): unknown =>
      fetchJson.getCallsFor({ url: `${MOCK_BASE_URL}/api/quests/${questId}` }).at(-1)?.[0],
    getLookupUrls: ({ sessionId }: { sessionId: string }): readonly unknown[] =>
      fetchWithStatus
        .getCallsFor({ url: `${MOCK_BASE_URL}/api/quests/by-session/${sessionId}` })
        .map((call) => call[0]),
    getStderrText: stderrGateway.getWrittenText,
    setNowMs: ({ value }: { value: number }): void => {
      clock.setupNow({ ms: value });
    },
  };
};
