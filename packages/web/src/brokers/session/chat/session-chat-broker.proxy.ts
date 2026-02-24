// PURPOSE: Proxy for session-chat-broker providing test control over HTTP responses
// USAGE: Create proxy in test, use setup methods to configure endpoint behavior

import type { ProcessId } from '@dungeonmaster/shared/contracts';
import { StartEndpointMock } from '@dungeonmaster/testing';

import { fetchPostAdapterProxy } from '../../../adapters/fetch/post/fetch-post-adapter.proxy';
import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

export const sessionChatBrokerProxy = (): {
  setupSessionChat: (params: { chatProcessId: ProcessId }) => void;
  setupSessionNew: (params: { chatProcessId: ProcessId }) => void;
  setupError: () => void;
} => {
  fetchPostAdapterProxy();

  const sessionEndpoint = StartEndpointMock.listen({
    method: 'post',
    url: webConfigStatics.api.routes.sessionChat,
  });

  const newSessionEndpoint = StartEndpointMock.listen({
    method: 'post',
    url: webConfigStatics.api.routes.sessionNew,
  });

  return {
    setupSessionChat: ({ chatProcessId }) => {
      sessionEndpoint.resolves({ data: { chatProcessId } });
    },
    setupSessionNew: ({ chatProcessId }) => {
      newSessionEndpoint.resolves({ data: { chatProcessId } });
    },
    setupError: () => {
      sessionEndpoint.networkError();
      newSessionEndpoint.networkError();
    },
  };
};
