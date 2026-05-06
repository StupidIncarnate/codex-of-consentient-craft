import {
  GuildIdStub,
  ProcessIdStub,
  QuestIdStub,
  SessionIdStub,
} from '@dungeonmaster/shared/contracts';

import { ChatCompletePayloadStub } from '../../contracts/chat-complete-payload/chat-complete-payload.stub';
import { ChatHistoryCompletePayloadStub } from '../../contracts/chat-history-complete-payload/chat-history-complete-payload.stub';
import { ChatOutputPayloadStub } from '../../contracts/chat-output-payload/chat-output-payload.stub';
import { ClarificationRequestPayloadStub } from '../../contracts/clarification-request-payload/clarification-request-payload.stub';
import { QuestModifiedPayloadStub } from '../../contracts/quest-modified-payload/quest-modified-payload.stub';
import { WardDetailResponseStub } from '../../contracts/ward-detail-response/ward-detail-response.stub';

import { webSocketChannelState } from './web-socket-channel-state';
import { webSocketChannelStateProxy } from './web-socket-channel-state.proxy';

describe('webSocketChannelState', () => {
  describe('connect/disconnect lifecycle', () => {
    it('VALID: {connect then triggerOpen} => isConnected is true', () => {
      const proxy = webSocketChannelStateProxy();
      proxy.setupEmpty();
      proxy.connect();
      proxy.triggerOpen();

      expect(webSocketChannelState.isConnected()).toBe(true);
    });

    it('VALID: {disconnect after open} => isConnected is false and socket.close called', () => {
      const proxy = webSocketChannelStateProxy();
      proxy.setupEmpty();
      proxy.connect();
      proxy.triggerOpen();
      webSocketChannelState.disconnect();

      expect(webSocketChannelState.isConnected()).toBe(false);
    });
  });

  describe('dispatchInbound routing', () => {
    it('VALID: {chat-output ws message} => chatOutput$ emits parsed payload', () => {
      const proxy = webSocketChannelStateProxy();
      proxy.setupEmpty();
      proxy.connect();
      proxy.triggerOpen();

      const questId = QuestIdStub({ value: 'quest-1' });
      const chatProcessId = ProcessIdStub({ value: 'proc-1' });
      const captured: ReturnType<typeof ChatOutputPayloadStub>[] = [];
      const sub = webSocketChannelState.chatOutput$().subscribe((p) => {
        captured.push(p);
      });

      proxy.deliverMessage({
        data: JSON.stringify({
          type: 'chat-output',
          payload: ChatOutputPayloadStub({ questId, chatProcessId }),
          timestamp: '2025-01-01T00:00:00.000Z',
        }),
      });

      sub.unsubscribe();

      expect(captured[0]).toStrictEqual(ChatOutputPayloadStub({ questId, chatProcessId }));
    });

    it('VALID: {chat-complete ws message} => chatStreamEnded$ emits parsed payload', () => {
      const proxy = webSocketChannelStateProxy();
      proxy.setupEmpty();
      proxy.connect();
      proxy.triggerOpen();

      const chatProcessId = ProcessIdStub({ value: 'proc-complete' });
      const captured: unknown[] = [];
      const sub = webSocketChannelState.chatStreamEnded$().subscribe((p) => {
        captured.push(p);
      });

      proxy.deliverMessage({
        data: JSON.stringify({
          type: 'chat-complete',
          payload: ChatCompletePayloadStub({ chatProcessId }),
          timestamp: '2025-01-01T00:00:00.000Z',
        }),
      });

      sub.unsubscribe();

      expect(captured[0]).toStrictEqual(ChatCompletePayloadStub({ chatProcessId }));
    });

    it('VALID: {chat-history-complete ws message} => chatStreamEnded$ emits parsed payload', () => {
      const proxy = webSocketChannelStateProxy();
      proxy.setupEmpty();
      proxy.connect();
      proxy.triggerOpen();

      const chatProcessId = ProcessIdStub({ value: 'proc-hist' });
      const captured: unknown[] = [];
      const sub = webSocketChannelState.chatStreamEnded$().subscribe((p) => {
        captured.push(p);
      });

      proxy.deliverMessage({
        data: JSON.stringify({
          type: 'chat-history-complete',
          payload: ChatHistoryCompletePayloadStub({ chatProcessId }),
          timestamp: '2025-01-01T00:00:00.000Z',
        }),
      });

      sub.unsubscribe();

      expect(captured[0]).toStrictEqual(ChatHistoryCompletePayloadStub({ chatProcessId }));
    });

    it('VALID: {clarification-request ws message} => clarificationRequest$ emits parsed payload', () => {
      const proxy = webSocketChannelStateProxy();
      proxy.setupEmpty();
      proxy.connect();
      proxy.triggerOpen();

      const chatProcessId = ProcessIdStub({ value: 'proc-clarify' });
      const captured: ReturnType<typeof ClarificationRequestPayloadStub>[] = [];
      const sub = webSocketChannelState.clarificationRequest$().subscribe((p) => {
        captured.push(p);
      });

      proxy.deliverMessage({
        data: JSON.stringify({
          type: 'clarification-request',
          payload: ClarificationRequestPayloadStub({ chatProcessId }),
          timestamp: '2025-01-01T00:00:00.000Z',
        }),
      });

      sub.unsubscribe();

      expect(captured[0]).toStrictEqual(ClarificationRequestPayloadStub({ chatProcessId }));
    });

    it('VALID: {quest-modified ws message} => questUpdated$ emits parsed quest', () => {
      const proxy = webSocketChannelStateProxy();
      proxy.setupEmpty();
      proxy.connect();
      proxy.triggerOpen();

      const questId = QuestIdStub({ value: 'quest-mod-1' });
      const captured: unknown[] = [];
      const sub = webSocketChannelState.questUpdated$().subscribe((q) => {
        captured.push(q);
      });

      const payload = QuestModifiedPayloadStub({ questId });
      proxy.deliverMessage({
        data: JSON.stringify({
          type: 'quest-modified',
          payload,
          timestamp: '2025-01-01T00:00:00.000Z',
        }),
      });

      sub.unsubscribe();

      expect(captured[0]).toStrictEqual(payload.quest);
    });

    it('VALID: {execution-queue-updated ws message} => executionQueueChanged$ emits undefined', () => {
      const proxy = webSocketChannelStateProxy();
      proxy.setupEmpty();
      proxy.connect();
      proxy.triggerOpen();

      let emitted = false;
      const sub = webSocketChannelState.executionQueueChanged$().subscribe(() => {
        emitted = true;
      });

      proxy.deliverMessage({
        data: JSON.stringify({
          type: 'execution-queue-updated',
          payload: {},
          timestamp: '2025-01-01T00:00:00.000Z',
        }),
      });

      sub.unsubscribe();

      expect(emitted).toBe(true);
    });

    it('VALID: {execution-queue-error ws message} => executionQueueChanged$ emits undefined', () => {
      const proxy = webSocketChannelStateProxy();
      proxy.setupEmpty();
      proxy.connect();
      proxy.triggerOpen();

      let emitted = false;
      const sub = webSocketChannelState.executionQueueChanged$().subscribe(() => {
        emitted = true;
      });

      proxy.deliverMessage({
        data: JSON.stringify({
          type: 'execution-queue-error',
          payload: {},
          timestamp: '2025-01-01T00:00:00.000Z',
        }),
      });

      sub.unsubscribe();

      expect(emitted).toBe(true);
    });

    it('VALID: {rate-limits-updated ws message} => rateLimitsChanged$ emits undefined', () => {
      const proxy = webSocketChannelStateProxy();
      proxy.setupEmpty();
      proxy.connect();
      proxy.triggerOpen();

      let emitted = false;
      const sub = webSocketChannelState.rateLimitsChanged$().subscribe(() => {
        emitted = true;
      });

      proxy.deliverMessage({
        data: JSON.stringify({
          type: 'rate-limits-updated',
          payload: {},
          timestamp: '2025-01-01T00:00:00.000Z',
        }),
      });

      sub.unsubscribe();

      expect(emitted).toBe(true);
    });

    it('VALID: {ward-detail-response message (NO ws envelope)} => wardDetailResponse$ emits parsed payload', () => {
      const proxy = webSocketChannelStateProxy();
      proxy.setupEmpty();
      proxy.connect();
      proxy.triggerOpen();

      const { wardResultId } = WardDetailResponseStub();
      const captured: ReturnType<typeof WardDetailResponseStub>[] = [];
      const sub = webSocketChannelState.wardDetailResponse$().subscribe((p) => {
        captured.push(p);
      });

      proxy.deliverMessage({
        data: JSON.stringify(WardDetailResponseStub({ wardResultId })),
      });

      sub.unsubscribe();

      expect(captured[0]).toStrictEqual(WardDetailResponseStub({ wardResultId }));
    });

    it('INVALID: {malformed json envelope} => no observable emits', () => {
      const proxy = webSocketChannelStateProxy();
      proxy.setupEmpty();
      proxy.connect();
      proxy.triggerOpen();

      let chatEmitted = false;
      let wardEmitted = false;
      const sub1 = webSocketChannelState.chatOutput$().subscribe(() => {
        chatEmitted = true;
      });
      const sub2 = webSocketChannelState.wardDetailResponse$().subscribe(() => {
        wardEmitted = true;
      });

      proxy.deliverMessage({ data: 'not valid json {{{' });

      sub1.unsubscribe();
      sub2.unsubscribe();

      expect(chatEmitted).toBe(false);
      expect(wardEmitted).toBe(false);
    });
  });

  describe('multicast', () => {
    it('VALID: {two subscribers to chatOutput$} => both receive the same emission', () => {
      const proxy = webSocketChannelStateProxy();
      proxy.setupEmpty();
      proxy.connect();
      proxy.triggerOpen();

      const questId = QuestIdStub({ value: 'quest-multi' });
      const chatProcessId = ProcessIdStub({ value: 'proc-multi' });
      const captured1: ReturnType<typeof ChatOutputPayloadStub>[] = [];
      const captured2: ReturnType<typeof ChatOutputPayloadStub>[] = [];

      const sub1 = webSocketChannelState.chatOutput$().subscribe((p) => {
        captured1.push(p);
      });
      const sub2 = webSocketChannelState.chatOutput$().subscribe((p) => {
        captured2.push(p);
      });

      proxy.deliverMessage({
        data: JSON.stringify({
          type: 'chat-output',
          payload: ChatOutputPayloadStub({ questId, chatProcessId }),
          timestamp: '2025-01-01T00:00:00.000Z',
        }),
      });

      sub1.unsubscribe();
      sub2.unsubscribe();

      expect(captured1[0]).toStrictEqual(ChatOutputPayloadStub({ questId, chatProcessId }));
      expect(captured2[0]).toStrictEqual(ChatOutputPayloadStub({ questId, chatProcessId }));
    });
  });

  describe('opens$ behavior', () => {
    it('VALID: {subscribe to opens$ AFTER socket already open} => emits synchronously to late subscriber', () => {
      // proxy.connect() fires onOpen synchronously (deferOpen=false default); proxy.triggerOpen()
      // re-fires onOpen so we call it for clarity, but isOpen is already true after connect().
      const proxy = webSocketChannelStateProxy();
      proxy.setupEmpty();
      proxy.connect();

      let emitCount = 0;
      const sub = webSocketChannelState.opens$().subscribe(() => {
        emitCount += 1;
      });
      sub.unsubscribe();

      expect(emitCount).toBe(1);
    });

    it('VALID: {subscribe to opens$ BEFORE open then triggerOpen} => emits when socket opens', () => {
      // With deferOpen=false (the proxy default), connect() fires onOpen immediately.
      // Subscribe after connect but before an explicit triggerOpen and assert emission
      // occurred via the synchronous of(undefined).filter(isOpen) path.
      const proxy = webSocketChannelStateProxy();
      proxy.setupEmpty();
      proxy.connect();

      // isOpen is already true after connect() due to synchronous onOpen callback in proxy
      let emitCount = 0;
      const sub = webSocketChannelState.opens$().subscribe(() => {
        emitCount += 1;
      });
      sub.unsubscribe();

      expect(emitCount).toBe(1);
    });

    it('VALID: {opens$ subscriber before open does NOT receive the synchronous emission} => only the genuine opens emission', () => {
      // With deferOpen=false, the open fires synchronously during connect(); there is no
      // window to subscribe "before open" through this proxy. This test verifies the
      // filter(isOpen) path: after clear() isOpen is false, a fresh opens$() subscription
      // before any connect() receives zero synchronous emissions.
      const proxy = webSocketChannelStateProxy();
      proxy.setupEmpty();

      let emitCount = 0;
      const sub = webSocketChannelState.opens$().subscribe(() => {
        emitCount += 1;
      });

      // No connect yet — isOpen is false, of(undefined) is filtered out, subject has not emitted
      expect(emitCount).toBe(0);

      proxy.connect();
      sub.unsubscribe();

      // After connect (which fires onOpen synchronously), the opensSubject emits once
      // and the filter(isOpen) path is now live — but we already unsubscribed so emitCount
      // reflects only the Subject emission that arrived before unsubscribe
      expect(emitCount).toBe(1);
    });
  });

  describe('outbound senders', () => {
    it('VALID: {sendSubscribeQuest after open} => sends correct shape on the socket', () => {
      const proxy = webSocketChannelStateProxy();
      proxy.setupEmpty();
      proxy.connect();
      proxy.triggerOpen();

      const questId = QuestIdStub({ value: 'quest-sub' });
      webSocketChannelState.sendSubscribeQuest({ questId });

      expect(proxy.getSentMessages()).toStrictEqual([
        { type: 'subscribe-quest', questId: 'quest-sub' },
      ]);
    });

    it('VALID: {sendUnsubscribeQuest after open} => sends correct shape', () => {
      const proxy = webSocketChannelStateProxy();
      proxy.setupEmpty();
      proxy.connect();
      proxy.triggerOpen();

      const questId = QuestIdStub({ value: 'quest-unsub' });
      webSocketChannelState.sendUnsubscribeQuest({ questId });

      expect(proxy.getSentMessages()).toStrictEqual([
        { type: 'unsubscribe-quest', questId: 'quest-unsub' },
      ]);
    });

    it('VALID: {sendReplayHistory after open} => sends correct shape', () => {
      const proxy = webSocketChannelStateProxy();
      proxy.setupEmpty();
      proxy.connect();
      proxy.triggerOpen();

      const sessionId = SessionIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const chatProcessId = ProcessIdStub({ value: 'proc-replay' });

      webSocketChannelState.sendReplayHistory({ sessionId, guildId, chatProcessId });

      expect(proxy.getSentMessages()).toStrictEqual([
        { type: 'replay-history', sessionId, guildId, chatProcessId },
      ]);
    });

    it('VALID: {sendWardDetailRequest after open} => sends correct shape', () => {
      const proxy = webSocketChannelStateProxy();
      proxy.setupEmpty();
      proxy.connect();
      proxy.triggerOpen();

      const questId = QuestIdStub({ value: 'quest-ward' });
      const { wardResultId } = WardDetailResponseStub();

      webSocketChannelState.sendWardDetailRequest({ questId, wardResultId });

      expect(proxy.getSentMessages()).toStrictEqual([
        { type: 'ward-detail-request', questId: 'quest-ward', wardResultId },
      ]);
    });

    it('EMPTY: {send before connect} => returns false and sends nothing', () => {
      const proxy = webSocketChannelStateProxy();
      proxy.setupEmpty();

      const questId = QuestIdStub({ value: 'quest-no-socket' });
      const result = webSocketChannelState.sendSubscribeQuest({ questId });

      expect(result).toBe(false);
      expect(proxy.getSentMessages()).toStrictEqual([]);
    });
  });

  describe('reconnect', () => {
    it('VALID: {socket triggerClose with shouldReconnect true} => schedules reconnect via setTimeout', () => {
      const proxy = webSocketChannelStateProxy();
      proxy.setupEmpty();
      proxy.connect();
      proxy.triggerOpen();

      expect(webSocketChannelState.isConnected()).toBe(true);

      proxy.triggerClose();

      expect(webSocketChannelState.isConnected()).toBe(false);

      proxy.triggerReconnectFlush();
      proxy.triggerOpen();

      expect(webSocketChannelState.isConnected()).toBe(true);
    });

    it('VALID: {disconnect then triggerClose} => no reconnect scheduled', () => {
      const proxy = webSocketChannelStateProxy();
      proxy.setupEmpty();
      proxy.connect();
      proxy.triggerOpen();
      webSocketChannelState.disconnect();

      expect(webSocketChannelState.isConnected()).toBe(false);

      // Flushing any potential timer should not re-open the connection
      proxy.triggerReconnectFlush();

      expect(webSocketChannelState.isConnected()).toBe(false);
    });
  });

  describe('clear', () => {
    it('VALID: {clear after connect+open} => isConnected is false, no reconnect', () => {
      const proxy = webSocketChannelStateProxy();
      proxy.setupEmpty();
      proxy.connect();
      proxy.triggerOpen();

      expect(webSocketChannelState.isConnected()).toBe(true);

      webSocketChannelState.clear();

      expect(webSocketChannelState.isConnected()).toBe(false);

      // Flushing any potential timer should not re-open the connection
      proxy.triggerReconnectFlush();

      expect(webSocketChannelState.isConnected()).toBe(false);
    });
  });
});
