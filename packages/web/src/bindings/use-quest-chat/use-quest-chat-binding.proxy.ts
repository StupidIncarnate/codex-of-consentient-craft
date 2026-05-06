import { registerSpyOn } from '@dungeonmaster/testing/register-mock';
import type { SpyOnHandle } from '@dungeonmaster/testing/register-mock';
import type { ProcessId, QuestStatus } from '@dungeonmaster/shared/contracts';
import type { RequestCount } from '@dungeonmaster/testing';

import { questChatBrokerProxy } from '../../brokers/quest/chat/quest-chat-broker.proxy';
import { questClarifyBrokerProxy } from '../../brokers/quest/clarify/quest-clarify-broker.proxy';
import { questPauseBrokerProxy } from '../../brokers/quest/pause/quest-pause-broker.proxy';
import { questResumeBrokerProxy } from '../../brokers/quest/resume/quest-resume-broker.proxy';
import { rxjsFilterAdapterProxy } from '../../adapters/rxjs/filter/rxjs-filter-adapter.proxy';
import { webSocketChannelStateProxy } from '../../state/web-socket-channel/web-socket-channel-state.proxy';

export const useQuestChatBindingProxy = (): {
  setupConnectedChannel: () => void;
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
  getClarifyRequestCount: () => RequestCount;
  getPauseRequestCount: () => RequestCount;
  getResumeRequestCount: () => RequestCount;
  deliverWsMessage: (params: { data: string }) => void;
  getSentWsMessages: () => unknown[];
  triggerWsClose: () => void;
  triggerWsReconnect: () => void;
} => {
  const chatProxy = questChatBrokerProxy();
  const clarifyProxy = questClarifyBrokerProxy();
  const pauseProxy = questPauseBrokerProxy();
  const resumeProxy = questResumeBrokerProxy();
  rxjsFilterAdapterProxy();
  const channel = webSocketChannelStateProxy();
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
    setupConnectedChannel: () => {
      channel.setupEmpty();
      channel.connect();
      channel.triggerOpen();
    },
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
      for (const u of uuids) uuidMock.mockReturnValueOnce(u);
    },
    setupTimestamps: ({ timestamps }) => {
      for (const t of timestamps) dateProtoMock.mockReturnValueOnce(t);
    },
    getChatRequestCount: () => chatProxy.getRequestCount(),
    getClarifyRequestCount: () => clarifyProxy.getRequestCount(),
    getPauseRequestCount: () => pauseProxy.getRequestCount(),
    getResumeRequestCount: () => resumeProxy.getRequestCount(),
    deliverWsMessage: ({ data }) => {
      channel.deliverMessage({ data });
    },
    getSentWsMessages: () => channel.getSentMessages(),
    triggerWsClose: () => {
      channel.triggerClose();
    },
    triggerWsReconnect: () => {
      channel.triggerReconnect();
    },
  };
};
