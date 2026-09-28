/**
 * PURPOSE: Single shared WebSocket connection per browser tab. All WS-consuming bindings (chat, queue, rate-limits, dispatch-state, session-replay, ward-detail) subscribe to typed observables on this state instead of opening their own sockets. Inbound frames are parsed once at the channel boundary and routed to per-concern Subjects so consumers never see event-type discriminator strings. Owns the connection lifecycle and reconnect.
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

import { connect } from '#gateway/browser/WebSocket';
import type { Observable } from '#gateway/npm/rxjs';
import { merge, of, Subject } from '#gateway/npm/rxjs';
import { filter } from '#gateway/npm/rxjs__operators';

import { chatCompletePayloadContract } from '../../contracts/chat-complete-payload/chat-complete-payload-contract';
import { chatHistoryCompletePayloadContract } from '../../contracts/chat-history-complete-payload/chat-history-complete-payload-contract';
import { chatOutputPayloadContract } from '../../contracts/chat-output-payload/chat-output-payload-contract';
import type { ChatOutputPayload } from '../../contracts/chat-output-payload/chat-output-payload-contract';
import type { ChatStreamEndedPayload } from '../../contracts/chat-stream-ended-payload/chat-stream-ended-payload-contract';
import { clarificationRequestPayloadContract } from '../../contracts/clarification-request-payload/clarification-request-payload-contract';
import type { ClarificationRequestPayload } from '../../contracts/clarification-request-payload/clarification-request-payload-contract';
import { questLoadFailedPayloadContract } from '../../contracts/quest-load-failed-payload/quest-load-failed-payload-contract';
import type { QuestLoadFailedPayload } from '../../contracts/quest-load-failed-payload/quest-load-failed-payload-contract';
import { questModifiedPayloadContract } from '../../contracts/quest-modified-payload/quest-modified-payload-contract';
import { wardDetailResponseContract } from '../../contracts/ward-detail-response/ward-detail-response-contract';
import type { WardDetailResponse } from '../../contracts/ward-detail-response/ward-detail-response-contract';
import type { WsUrl } from '../../contracts/ws-url/ws-url-contract';

type WardResultId = WardResult['id'];

type WsConnection = ReturnType<typeof connect>;

type ChannelObservable<T> = Observable<T>;

const RECONNECT_DELAY_MS_VALUE = 3000;

const internalState: {
  socket: WsConnection | null;
  url: WsUrl | null;
  isOpen: boolean;
  reconnectTimer: ReturnType<typeof setTimeout> | null;
  shouldReconnect: boolean;
  chatOutputSubject: Subject<ChatOutputPayload>;
  chatStreamEndedSubject: Subject<ChatStreamEndedPayload>;
  clarificationRequestSubject: Subject<ClarificationRequestPayload>;
  questUpdatedSubject: Subject<Quest>;
  questLoadFailedSubject: Subject<QuestLoadFailedPayload>;
  executionQueueChangedSubject: Subject<undefined>;
  rateLimitsChangedSubject: Subject<undefined>;
  dispatchStateChangedSubject: Subject<undefined>;
  wardDetailResponseSubject: Subject<WardDetailResponse>;
  opensSubject: Subject<undefined>;
} = {
  socket: null,
  url: null,
  isOpen: false,
  reconnectTimer: null,
  shouldReconnect: false,
  chatOutputSubject: new Subject<ChatOutputPayload>(),
  chatStreamEndedSubject: new Subject<ChatStreamEndedPayload>(),
  clarificationRequestSubject: new Subject<ClarificationRequestPayload>(),
  questUpdatedSubject: new Subject<Quest>(),
  questLoadFailedSubject: new Subject<QuestLoadFailedPayload>(),
  executionQueueChangedSubject: new Subject<undefined>(),
  rateLimitsChangedSubject: new Subject<undefined>(),
  dispatchStateChangedSubject: new Subject<undefined>(),
  wardDetailResponseSubject: new Subject<WardDetailResponse>(),
  opensSubject: new Subject<undefined>(),
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
    // A caller reaching here — connect(), the reconnect timer firing for real, or a caller that
    // bypasses the timer to force an immediate reconnect (the state proxy's `triggerReconnect`,
    // which tests use to simulate the delay elapsing without waiting it out) — means any
    // previously scheduled reconnect is no longer wanted. Clearing it HERE, not only in
    // disconnect()/clear(), is what stops the real timer surviving a bypassed reconnect: once a
    // fresh connection attempt starts, `reconnectTimer` is never revisited again on this cycle,
    // so anywhere else is too late.
    if (internalState.reconnectTimer !== null) {
      globalThis.clearTimeout(internalState.reconnectTimer);
      internalState.reconnectTimer = null;
    }

    internalState.socket = connect({
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
        // Left unset here on purpose — see the clear at the top of this function. Nulling it in
        // this callback (the shape this replaced) discards the only reference to the still-real,
        // still-scheduled timer the instant a test replays this callback early instead of waiting
        // out RECONNECT_DELAY_MS_VALUE, which is exactly what left it armed after the test ended.
        internalState.reconnectTimer = globalThis.setTimeout(() => {
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
    // Both wire events feed one observable, so `reason` is stamped HERE — the only place that still
    // knows which frame arrived. Downstream, a turn ending and a replay draining are not
    // interchangeable: see chat-stream-ended-payload-contract.
    if (envelope.data.type === 'chat-complete') {
      const payload = chatCompletePayloadContract.safeParse(envelope.data.payload);
      if (payload.success) {
        internalState.chatStreamEndedSubject.next({ ...payload.data, reason: 'turn-ended' });
      }
      return;
    }
    if (envelope.data.type === 'chat-history-complete') {
      const payload = chatHistoryCompletePayloadContract.safeParse(envelope.data.payload);
      if (payload.success) {
        internalState.chatStreamEndedSubject.next({ ...payload.data, reason: 'history-replayed' });
      }
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
    if (envelope.data.type === 'quest-load-failed') {
      const payload = questLoadFailedPayloadContract.safeParse(envelope.data.payload);
      if (payload.success) internalState.questLoadFailedSubject.next(payload.data);
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
      return;
    }
    if (envelope.data.type === 'dispatch-state-changed') {
      internalState.dispatchStateChangedSubject.next(undefined);
    }
  },

  isConnected: (): boolean => internalState.isOpen,

  chatOutput$: (): ChannelObservable<ChatOutputPayload> =>
    internalState.chatOutputSubject.asObservable(),
  chatStreamEnded$: (): ChannelObservable<ChatStreamEndedPayload> =>
    internalState.chatStreamEndedSubject.asObservable(),
  clarificationRequest$: (): ChannelObservable<ClarificationRequestPayload> =>
    internalState.clarificationRequestSubject.asObservable(),
  questUpdated$: (): ChannelObservable<Quest> => internalState.questUpdatedSubject.asObservable(),
  questLoadFailed$: (): ChannelObservable<QuestLoadFailedPayload> =>
    internalState.questLoadFailedSubject.asObservable(),
  executionQueueChanged$: (): ChannelObservable<undefined> =>
    internalState.executionQueueChangedSubject.asObservable(),
  rateLimitsChanged$: (): ChannelObservable<undefined> =>
    internalState.rateLimitsChangedSubject.asObservable(),
  dispatchStateChanged$: (): ChannelObservable<undefined> =>
    internalState.dispatchStateChangedSubject.asObservable(),
  wardDetailResponse$: (): ChannelObservable<WardDetailResponse> =>
    internalState.wardDetailResponseSubject.asObservable(),

  opens$: (): ChannelObservable<undefined> =>
    merge(
      of<undefined>(undefined).pipe(filter((): boolean => internalState.isOpen)),
      internalState.opensSubject.asObservable(),
    ),

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
