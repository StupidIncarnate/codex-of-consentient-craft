/**
 * PURPOSE: Single shared WebSocket connection per browser tab. All five WS-consuming bindings (chat, queue, rate-limits, session-replay, ward-detail) subscribe to typed observables on this state instead of opening their own sockets. Inbound frames are parsed once at the channel boundary and routed to per-concern Subjects so consumers never see event-type discriminator strings. Owns the connection lifecycle and reconnect.
 *
 * USAGE:
 * webSocketChannelState.connect({ url: WsUrlStub({ value: 'ws://host/ws' }) });
 * const sub = webSocketChannelState.chatOutput$().subscribe((p) => ...);
 * webSocketChannelState.sendSubscribeQuest({ questId });
 * sub.unsubscribe();
 */

import type {
  GuildId,
  ProcessId,
  Quest,
  QuestId,
  SessionId,
  WardResult,
} from '@dungeonmaster/shared/contracts';
import { wsMessageContract } from '@dungeonmaster/shared/contracts';

import { rxjsFilterAdapter } from '../../adapters/rxjs/filter/rxjs-filter-adapter';
import { rxjsMergeAdapter } from '../../adapters/rxjs/merge/rxjs-merge-adapter';
import { rxjsOfAdapter } from '../../adapters/rxjs/of/rxjs-of-adapter';
import { rxjsSubjectAdapter } from '../../adapters/rxjs/subject/rxjs-subject-adapter';
import { websocketConnectAdapter } from '../../adapters/websocket/connect/websocket-connect-adapter';
import { chatCompletePayloadContract } from '../../contracts/chat-complete-payload/chat-complete-payload-contract';
import { chatHistoryCompletePayloadContract } from '../../contracts/chat-history-complete-payload/chat-history-complete-payload-contract';
import { chatOutputPayloadContract } from '../../contracts/chat-output-payload/chat-output-payload-contract';
import type { ChatOutputPayload } from '../../contracts/chat-output-payload/chat-output-payload-contract';
import type { ChatStreamEndedPayload } from '../../contracts/chat-stream-ended-payload/chat-stream-ended-payload-contract';
import { clarificationRequestPayloadContract } from '../../contracts/clarification-request-payload/clarification-request-payload-contract';
import type { ClarificationRequestPayload } from '../../contracts/clarification-request-payload/clarification-request-payload-contract';
import { questModifiedPayloadContract } from '../../contracts/quest-modified-payload/quest-modified-payload-contract';
import { wardDetailResponseContract } from '../../contracts/ward-detail-response/ward-detail-response-contract';
import type { WardDetailResponse } from '../../contracts/ward-detail-response/ward-detail-response-contract';
import type { WsUrl } from '../../contracts/ws-url/ws-url-contract';

type WardResultId = WardResult['id'];

type WsConnection = ReturnType<typeof websocketConnectAdapter>;

type SubjectAdapter<T> = ReturnType<typeof rxjsSubjectAdapter<T>>;
type ChannelObservable<T> = SubjectAdapter<T>['observable'];

const RECONNECT_DELAY_MS_VALUE = 3000;

const internalState: {
  socket: WsConnection | null;
  url: WsUrl | null;
  isOpen: boolean;
  reconnectTimer: ReturnType<typeof setTimeout> | null;
  shouldReconnect: boolean;
  chatOutputSubject: SubjectAdapter<ChatOutputPayload>;
  chatStreamEndedSubject: SubjectAdapter<ChatStreamEndedPayload>;
  clarificationRequestSubject: SubjectAdapter<ClarificationRequestPayload>;
  questUpdatedSubject: SubjectAdapter<Quest>;
  executionQueueChangedSubject: SubjectAdapter<undefined>;
  rateLimitsChangedSubject: SubjectAdapter<undefined>;
  wardDetailResponseSubject: SubjectAdapter<WardDetailResponse>;
  opensSubject: SubjectAdapter<undefined>;
} = {
  socket: null,
  url: null,
  isOpen: false,
  reconnectTimer: null,
  shouldReconnect: false,
  chatOutputSubject: rxjsSubjectAdapter<ChatOutputPayload>(),
  chatStreamEndedSubject: rxjsSubjectAdapter<ChatStreamEndedPayload>(),
  clarificationRequestSubject: rxjsSubjectAdapter<ClarificationRequestPayload>(),
  questUpdatedSubject: rxjsSubjectAdapter<Quest>(),
  executionQueueChangedSubject: rxjsSubjectAdapter<undefined>(),
  rateLimitsChangedSubject: rxjsSubjectAdapter<undefined>(),
  wardDetailResponseSubject: rxjsSubjectAdapter<WardDetailResponse>(),
  opensSubject: rxjsSubjectAdapter<undefined>(),
};

export const webSocketChannelState = {
  connect: ({ url }: { url: WsUrl }): void => {
    internalState.url = url;
    internalState.shouldReconnect = true;
    webSocketChannelState.openConnection();
  },

  disconnect: (): void => {
    internalState.shouldReconnect = false;
    if (internalState.reconnectTimer !== null) {
      globalThis.clearTimeout(internalState.reconnectTimer);
      internalState.reconnectTimer = null;
    }
    if (internalState.socket !== null) {
      internalState.socket.close();
    }
    internalState.socket = null;
    internalState.isOpen = false;
    internalState.url = null;
  },

  openConnection: (): void => {
    if (internalState.url === null) return;
    if (internalState.socket !== null) return;

    internalState.socket = websocketConnectAdapter({
      url: internalState.url,
      onMessage: webSocketChannelState.dispatchInbound,
      onOpen: (): void => {
        internalState.isOpen = true;
        internalState.opensSubject.next(undefined);
      },
      onClose: (): void => {
        internalState.isOpen = false;
        internalState.socket = null;
        if (!internalState.shouldReconnect) return;
        internalState.reconnectTimer = globalThis.setTimeout(() => {
          internalState.reconnectTimer = null;
          webSocketChannelState.openConnection();
        }, RECONNECT_DELAY_MS_VALUE);
      },
    });
  },

  dispatchInbound: (message: unknown): void => {
    const wardResponse = wardDetailResponseContract.safeParse(message);
    if (wardResponse.success) {
      internalState.wardDetailResponseSubject.next(wardResponse.data);
      return;
    }

    const envelope = wsMessageContract.safeParse(message);
    if (!envelope.success) return;

    if (envelope.data.type === 'chat-output') {
      const payload = chatOutputPayloadContract.safeParse(envelope.data.payload);
      if (payload.success) internalState.chatOutputSubject.next(payload.data);
      return;
    }
    if (envelope.data.type === 'chat-complete') {
      const payload = chatCompletePayloadContract.safeParse(envelope.data.payload);
      if (payload.success) internalState.chatStreamEndedSubject.next(payload.data);
      return;
    }
    if (envelope.data.type === 'chat-history-complete') {
      const payload = chatHistoryCompletePayloadContract.safeParse(envelope.data.payload);
      if (payload.success) internalState.chatStreamEndedSubject.next(payload.data);
      return;
    }
    if (envelope.data.type === 'clarification-request') {
      const payload = clarificationRequestPayloadContract.safeParse(envelope.data.payload);
      if (payload.success) internalState.clarificationRequestSubject.next(payload.data);
      return;
    }
    if (envelope.data.type === 'quest-modified') {
      const payload = questModifiedPayloadContract.safeParse(envelope.data.payload);
      if (payload.success) internalState.questUpdatedSubject.next(payload.data.quest as Quest);
      return;
    }
    if (envelope.data.type === 'execution-queue-updated') {
      internalState.executionQueueChangedSubject.next(undefined);
      return;
    }
    if (envelope.data.type === 'execution-queue-error') {
      internalState.executionQueueChangedSubject.next(undefined);
      return;
    }
    if (envelope.data.type === 'rate-limits-updated') {
      internalState.rateLimitsChangedSubject.next(undefined);
    }
  },

  isConnected: (): boolean => internalState.isOpen,

  chatOutput$: (): ChannelObservable<ChatOutputPayload> =>
    internalState.chatOutputSubject.observable,
  chatStreamEnded$: (): ChannelObservable<ChatStreamEndedPayload> =>
    internalState.chatStreamEndedSubject.observable,
  clarificationRequest$: (): ChannelObservable<ClarificationRequestPayload> =>
    internalState.clarificationRequestSubject.observable,
  questUpdated$: (): ChannelObservable<Quest> => internalState.questUpdatedSubject.observable,
  executionQueueChanged$: (): ChannelObservable<undefined> =>
    internalState.executionQueueChangedSubject.observable,
  rateLimitsChanged$: (): ChannelObservable<undefined> =>
    internalState.rateLimitsChangedSubject.observable,
  wardDetailResponse$: (): ChannelObservable<WardDetailResponse> =>
    internalState.wardDetailResponseSubject.observable,

  opens$: (): ChannelObservable<undefined> =>
    rxjsMergeAdapter<undefined>({
      sources: [
        rxjsFilterAdapter<undefined>({
          source: rxjsOfAdapter<undefined>({ value: undefined }),
          predicate: (): boolean => internalState.isOpen,
        }),
        internalState.opensSubject.observable,
      ],
    }),

  sendSubscribeQuest: ({ questId }: { questId: QuestId }): boolean => {
    if (internalState.socket === null) return false;
    return internalState.socket.send({ type: 'subscribe-quest', questId });
  },

  sendUnsubscribeQuest: ({ questId }: { questId: QuestId }): boolean => {
    if (internalState.socket === null) return false;
    return internalState.socket.send({ type: 'unsubscribe-quest', questId });
  },

  sendReplayHistory: ({
    sessionId,
    guildId,
    chatProcessId,
  }: {
    sessionId: SessionId;
    guildId: GuildId;
    chatProcessId: ProcessId;
  }): boolean => {
    if (internalState.socket === null) return false;
    return internalState.socket.send({
      type: 'replay-history',
      sessionId,
      guildId,
      chatProcessId,
    });
  },

  sendWardDetailRequest: ({
    questId,
    wardResultId,
  }: {
    questId: QuestId;
    wardResultId: WardResultId;
  }): boolean => {
    if (internalState.socket === null) return false;
    return internalState.socket.send({ type: 'ward-detail-request', questId, wardResultId });
  },

  clear: (): void => {
    internalState.shouldReconnect = false;
    if (internalState.reconnectTimer !== null) {
      globalThis.clearTimeout(internalState.reconnectTimer);
      internalState.reconnectTimer = null;
    }
    if (internalState.socket !== null) {
      internalState.socket.close();
    }
    internalState.socket = null;
    internalState.isOpen = false;
    internalState.url = null;
  },
} as const;
