import { registerSpyOn } from '@dungeonmaster/testing/register-mock';
import type { SpyOnHandle } from '@dungeonmaster/testing/register-mock';
import type { ProcessId, QuestStatus } from '@dungeonmaster/shared/contracts';
import type { RequestCount } from '@dungeonmaster/testing';

import { websocketConnectAdapterProxy } from '../../adapters/websocket/connect/websocket-connect-adapter.proxy';
import { questChatBrokerProxy } from '../../brokers/quest/chat/quest-chat-broker.proxy';
import { questClarifyBrokerProxy } from '../../brokers/quest/clarify/quest-clarify-broker.proxy';
import { questPauseBrokerProxy } from '../../brokers/quest/pause/quest-pause-broker.proxy';
import { questResumeBrokerProxy } from '../../brokers/quest/resume/quest-resume-broker.proxy';

export const useQuestChatBindingProxy = ({ deferOpen = false }: { deferOpen?: boolean } = {}): {
  setupChat: (params: { chatProcessId: ProcessId }) => void;
  setupChatError: () => void;
  setupClarify: (params: { chatProcessId: ProcessId }) => void;
  setupClarifyError: () => void;
  setupPause: () => void;
  setupResume: (params: { restoredStatus: QuestStatus }) => void;
  setupUuids: (params: {
    uuids: readonly `${string}-${string}-${string}-${string}-${string}`[];
  }) => void;
  setupTimestamps: (params: { timestamps: readonly string[] }) => void;
  getChatRequestCount: () => RequestCount;
  getPauseRequestCount: () => RequestCount;
  getResumeRequestCount: () => RequestCount;
  receiveWsMessage: (params: { data: string }) => void;
  getSentWsMessages: () => unknown[];
  triggerWsOpen: () => void;
  getSocketClose: () => jest.Mock;
} => {
  const chatProxy = questChatBrokerProxy();
  const clarifyProxy = questClarifyBrokerProxy();
  const pauseProxy = questPauseBrokerProxy();
  const resumeProxy = questResumeBrokerProxy();
  const wsProxy = websocketConnectAdapterProxy({ deferOpen });
  const uuidMock: SpyOnHandle = registerSpyOn({
    object: crypto,
    method: 'randomUUID',
    passthrough: true,
  });
  const dateProtoMock: SpyOnHandle = registerSpyOn({
    object: Date.prototype,
    method: 'toISOString',
    passthrough: true,
  });

  return {
    setupChat: ({ chatProcessId }) => {
      chatProxy.setupChat({ chatProcessId });
    },
    setupChatError: () => {
      chatProxy.setupError();
    },
    setupClarify: ({ chatProcessId }) => {
      clarifyProxy.setupClarify({ chatProcessId });
    },
    setupClarifyError: () => {
      clarifyProxy.setupError();
    },
    setupPause: () => {
      pauseProxy.setupPause();
    },
    setupResume: ({ restoredStatus }) => {
      resumeProxy.setupResume({ restoredStatus });
    },
    setupUuids: ({ uuids }) => {
      for (const uuid of uuids) {
        uuidMock.mockReturnValueOnce(uuid);
      }
    },
    setupTimestamps: ({ timestamps }) => {
      for (const ts of timestamps) {
        dateProtoMock.mockReturnValueOnce(ts);
      }
    },
    getChatRequestCount: () => chatProxy.getRequestCount(),
    getPauseRequestCount: () => pauseProxy.getRequestCount(),
    getResumeRequestCount: () => resumeProxy.getRequestCount(),
    receiveWsMessage: ({ data }) => {
      wsProxy.receiveMessage({ data });
    },
    getSentWsMessages: () => wsProxy.getSentMessages(),
    triggerWsOpen: () => {
      wsProxy.triggerOpen();
    },
    getSocketClose: () => wsProxy.getSocket().close,
  };
};
