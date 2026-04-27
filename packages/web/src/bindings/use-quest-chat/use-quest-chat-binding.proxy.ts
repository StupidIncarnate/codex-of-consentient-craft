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
