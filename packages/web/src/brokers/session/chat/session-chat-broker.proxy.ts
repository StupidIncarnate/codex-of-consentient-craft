// PURPOSE: Proxy for session-chat-broker providing test control over HTTP responses
// USAGE: Create proxy in test, use setup methods to configure endpoint behavior

import type { ProcessId, QuestStatus } from '@dungeonmaster/shared/contracts';
import { StartEndpointMock } from '@dungeonmaster/testing';

import { fetchPostAdapterProxy } from '../../../adapters/fetch/post/fetch-post-adapter.proxy';
import { questResumeBrokerProxy } from '../../quest/resume/quest-resume-broker.proxy';
import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

type EndpointCall = 'sessionChat' | 'sessionNew' | 'questResume';

export const sessionChatBrokerProxy = (): {
  setupSessionChat: (params: { chatProcessId: ProcessId }) => void;
  setupSessionNew: (params: { chatProcessId: ProcessId }) => void;
  setupQuestResume: (params: { restoredStatus: QuestStatus }) => void;
  setupError: () => void;
  getOrderedEndpointCalls: () => EndpointCall[];
} => {
  fetchPostAdapterProxy();
  const resumeProxy = questResumeBrokerProxy();

  const sessionEndpoint = StartEndpointMock.listen({
    method: 'post',
    url: webConfigStatics.api.routes.sessionChat,
  });

  const newSessionEndpoint = StartEndpointMock.listen({
    method: 'post',
    url: webConfigStatics.api.routes.sessionNew,
  });

  // Cursor tracks per-endpoint request counts already observed so subsequent
  // reads emit only the new calls. Wrapped in a const object so the proxy body
  // contains no `let` bindings (enforced by proxy lint rules).
  const cursor = {
    sessionCount: 0,
    newSessionCount: 0,
    resumeCount: 0,
    orderedCalls: [] as EndpointCall[],
  };

  const pushN = ({ tag, count }: { tag: EndpointCall; count: number }): void => {
    const toAdd = Array.from({ length: count }, () => tag);
    cursor.orderedCalls.push(...toAdd);
  };

  const snapshotOrder = (): void => {
    const newSessionCount = Number(newSessionEndpoint.getRequestCount());
    const sessionCount = Number(sessionEndpoint.getRequestCount());
    const resumeCount = Number(resumeProxy.getRequestCount());
    pushN({ tag: 'questResume', count: resumeCount - cursor.resumeCount });
    pushN({ tag: 'sessionChat', count: sessionCount - cursor.sessionCount });
    pushN({ tag: 'sessionNew', count: newSessionCount - cursor.newSessionCount });
    cursor.resumeCount = resumeCount;
    cursor.sessionCount = sessionCount;
    cursor.newSessionCount = newSessionCount;
  };

  return {
    setupSessionChat: ({ chatProcessId }) => {
      sessionEndpoint.resolves({ data: { chatProcessId } });
    },
    setupSessionNew: ({ chatProcessId }) => {
      newSessionEndpoint.resolves({ data: { chatProcessId } });
    },
    setupQuestResume: ({ restoredStatus }) => {
      resumeProxy.setupResume({ restoredStatus });
    },
    setupError: () => {
      sessionEndpoint.networkError();
      newSessionEndpoint.networkError();
    },
    getOrderedEndpointCalls: (): EndpointCall[] => {
      snapshotOrder();
      return [...cursor.orderedCalls];
    },
  };
};
