import { registerSpyOn } from '@dungeonmaster/testing/register-mock';
import type { SpyOnHandle } from '@dungeonmaster/testing/register-mock';
import type { ProcessId, QuestStatus } from '@dungeonmaster/shared/contracts';
import type { RequestCount } from '@dungeonmaster/testing';

import { questChatBrokerProxy } from '../../brokers/quest/chat/quest-chat-broker.proxy';
import { questClarifyBrokerProxy } from '../../brokers/quest/clarify/quest-clarify-broker.proxy';
import { questCommentBatchBrokerProxy } from '../../brokers/quest/comment-batch/quest-comment-batch-broker.proxy';
import { questFollowupBrokerProxy } from '../../brokers/quest/followup/quest-followup-broker.proxy';
import { questFollowupStopBrokerProxy } from '../../brokers/quest/followup-stop/quest-followup-stop-broker.proxy';
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
  setupCommentBatchSent: (params: { chatProcessId: ProcessId; deliveredMessage: string }) => void;
  setupCommentBatchSentWithoutDeliveredMessage: (params: { chatProcessId: ProcessId }) => void;
  setupCommentBatchStale: (params: { staleAnchors: unknown[] }) => void;
  setupCommentBatchFailed: (params: { error: string }) => void;
  setupFollowup: (params: { chatProcessId: ProcessId }) => void;
  setupFollowupRejected: (params: { error: string }) => void;
  setupFollowupError: () => void;
  setupPause: () => void;
  setupFollowupStop: (params: { stopped: boolean }) => void;
  setupFollowupStopError: () => void;
  getFollowupStopRequestCount: () => RequestCount;
  setupResume: (params: { restoredStatus: QuestStatus }) => void;
  setupUuids: (params: {
    uuids: readonly `${string}-${string}-${string}-${string}-${string}`[];
  }) => void;
  setupTimestamps: (params: { timestamps: readonly string[] }) => void;
  getChatRequestCount: () => RequestCount;
  getClarifyRequestCount: () => RequestCount;
  getCommentBatchRequestCount: () => RequestCount;
  getFollowupRequestBody: () => unknown;
  getFollowupRequestCount: () => RequestCount;
  getPauseRequestCount: () => RequestCount;
  getResumeRequestCount: () => RequestCount;
  deliverWsMessage: (params: { data: string }) => void;
  getSentWsMessages: () => unknown[];
  triggerWsClose: () => void;
  triggerWsReconnect: () => void;
} => {
  const chatProxy = questChatBrokerProxy();
  const clarifyProxy = questClarifyBrokerProxy();
  const commentBatchProxy = questCommentBatchBrokerProxy();
  const followupProxy = questFollowupBrokerProxy();
  const followupStopProxy = questFollowupStopBrokerProxy();
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
    setupCommentBatchSent: ({ chatProcessId, deliveredMessage }) => {
      commentBatchProxy.setupSentWithDeliveredMessage({ chatProcessId, deliveredMessage });
    },
    setupCommentBatchSentWithoutDeliveredMessage: ({ chatProcessId }) => {
      commentBatchProxy.setupSent({ chatProcessId });
    },
    setupCommentBatchStale: ({ staleAnchors }) => {
      commentBatchProxy.setupStaleAnchors({ staleAnchors });
    },
    setupCommentBatchFailed: ({ error }) => {
      commentBatchProxy.setupServerError({ error });
    },
    setupFollowup: ({ chatProcessId }) => {
      followupProxy.setupFollowup({ chatProcessId });
    },
    setupFollowupRejected: ({ error }) => {
      followupProxy.setupRejected({ error });
    },
    setupFollowupError: () => {
      followupProxy.setupError();
    },
    setupPause: () => {
      pauseProxy.setupPause();
    },
    setupFollowupStop: ({ stopped }) => {
      if (stopped) {
        followupStopProxy.setupStopped();
        return;
      }
      followupStopProxy.setupNothingRunning();
    },
    setupFollowupStopError: () => {
      followupStopProxy.setupError();
    },
    getFollowupStopRequestCount: () => followupStopProxy.getRequestCount(),
    setupResume: ({ restoredStatus }) => {
      resumeProxy.setupResume({ restoredStatus });
    },
    setupUuids: ({ uuids }) => {
      // randomUUID takes no arguments, so there is no address beyond "the next call" — onceFor
      // staged in order is consumed FIFO, one entry per call, matching the original queued-value
      // semantics.
      for (const u of uuids) uuidMock.onceFor([]).returns(u);
    },
    setupTimestamps: ({ timestamps }) => {
      // toISOString's address would be the receiver (`this`), which a spy cannot see — same
      // "next call" queueing as setupUuids above.
      for (const t of timestamps) dateProtoMock.onceFor([]).returns(t);
    },
    getChatRequestCount: () => chatProxy.getRequestCount(),
    getClarifyRequestCount: () => clarifyProxy.getRequestCount(),
    getCommentBatchRequestCount: () => commentBatchProxy.getRequestCount(),
    getFollowupRequestBody: () => followupProxy.getRequestBody(),
    getFollowupRequestCount: () => followupProxy.getRequestCount(),
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
