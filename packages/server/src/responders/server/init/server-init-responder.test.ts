import {
  AbsoluteFilePathStub,
  GuildIdStub,
  ProcessIdStub,
  QuestIdStub,
  QuestStub,
  QuestWorkItemIdStub,
  SessionIdStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';

import { WsClientStub } from '../../../contracts/ws-client/ws-client.stub';
import { ServerInitResponderProxy } from './server-init-responder.proxy';

describe('ServerInitResponder', () => {
  describe('websocket onMessage replay-history', () => {
    it('VALID: {type: replay-history} => calls orchestratorReplayChatHistoryAdapter', async () => {
      const proxy = ServerInitResponderProxy();
      proxy.callResponder();

      const sendMock = jest.fn();
      const client = WsClientStub({ send: sendMock });
      proxy.simulateConnection({ client });
      proxy.simulateMessage({
        data: JSON.stringify({
          type: 'replay-history',
          sessionId: SessionIdStub(),
          guildId: GuildIdStub(),
          chatProcessId: ProcessIdStub(),
        }),
        ws: client,
      });

      await new Promise((resolve) => {
        setTimeout(resolve, 10);
      });

      expect(sendMock.mock.calls).toStrictEqual([]);
    });
  });

  describe('websocket onMessage parse error', () => {
    it('ERROR: {unparseable data} => does not throw', () => {
      const proxy = ServerInitResponderProxy();
      proxy.callResponder();

      const sendMock = jest.fn();
      const client = WsClientStub({ send: sendMock });
      proxy.simulateConnection({ client });

      proxy.simulateMessage({ data: 'not-json{{{', ws: client });

      expect(sendMock.mock.calls).toStrictEqual([]);
    });
  });

  describe('event subscription', () => {
    it('VALID: {chat-output with slotIndex} => buffers event, does not broadcast immediately', () => {
      const proxy = ServerInitResponderProxy();
      proxy.callResponder();

      const sendMock = jest.fn();
      const client = WsClientStub({ send: sendMock });
      proxy.simulateConnection({ client });

      const handler = proxy.getCapturedEventHandler({ type: 'chat-output' });
      handler!({
        processId: ProcessIdStub(),
        payload: { slotIndex: 0, text: 'buffered' },
      });

      expect(sendMock.mock.calls).toStrictEqual([]);
    });

    it('VALID: {chat-output without questId} => not delivered (per-quest only)', () => {
      const proxy = ServerInitResponderProxy();
      proxy.callResponder();

      const sendMock = jest.fn();
      const client = WsClientStub({ send: sendMock });
      proxy.simulateConnection({ client });

      const handler = proxy.getCapturedEventHandler({ type: 'chat-output' });
      handler!({
        processId: ProcessIdStub(),
        payload: { text: 'no-quest-id' },
      });

      expect(sendMock.mock.calls).toStrictEqual([]);
    });

    it('EDGE: {empty buffer at flush interval} => no broadcast occurs', () => {
      jest.useFakeTimers();

      const proxy = ServerInitResponderProxy();
      proxy.callResponder();

      const sendMock = jest.fn();
      const client = WsClientStub({ send: sendMock });
      proxy.simulateConnection({ client });

      jest.advanceTimersByTime(100);
      jest.useRealTimers();

      expect(sendMock.mock.calls).toStrictEqual([]);
    });

    it('VALID: {phase-change event} => broadcasts immediately to connected client', () => {
      const proxy = ServerInitResponderProxy();
      proxy.callResponder();

      const sendMock = jest.fn();
      const client = WsClientStub({ send: sendMock });
      proxy.simulateConnection({ client });

      const handler = proxy.getCapturedEventHandler({ type: 'phase-change' });
      handler!({
        processId: ProcessIdStub(),
        payload: { phase: 'codeweaver' },
      });

      const sendCallCount = sendMock.mock.calls.length;

      expect(sendCallCount).toBe(1);
    });
  });

  describe('websocket onClose', () => {
    it('VALID: {client disconnects} => removes client from set', () => {
      const proxy = ServerInitResponderProxy();
      proxy.callResponder();

      const sendMock = jest.fn();
      const client = WsClientStub({ send: sendMock });
      proxy.simulateConnection({ client });
      proxy.simulateDisconnect({ ws: client });

      expect(sendMock.mock.calls).toStrictEqual([]);
    });
  });

  describe('websocket onMessage subscribe-quest', () => {
    it('VALID: {subscribe-quest with workItems} => replays each workItem JSONL then emits chat-history-complete', async () => {
      const proxy = ServerInitResponderProxy();
      const questId = QuestIdStub({ value: 'quest-sub-1' });
      const workItemAId = QuestWorkItemIdStub({
        value: 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',
      });
      const workItemBId = QuestWorkItemIdStub({
        value: 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb',
      });
      const sessionA = SessionIdStub({ value: 'session-A' });
      const sessionB = SessionIdStub({ value: 'session-B' });
      const guildId = GuildIdStub();
      const quest = QuestStub({
        id: questId,
        workItems: [
          WorkItemStub({ id: workItemAId, sessionId: sessionA }),
          WorkItemStub({ id: workItemBId, sessionId: sessionB }),
        ],
      });
      proxy.setupLoadQuestSuccess({ quest });
      proxy.setupFindQuestPathSuccess({
        questPath: AbsoluteFilePathStub({ value: '/q/path' }),
        guildId,
      });
      proxy.callResponder();

      const sendMock = jest.fn();
      const client = WsClientStub({ send: sendMock });
      proxy.simulateConnection({ client });
      proxy.simulateMessage({
        data: JSON.stringify({ type: 'subscribe-quest', questId }),
        ws: client,
      });

      await new Promise((resolve) => {
        setTimeout(resolve, 10);
      });

      const replayCalls = proxy.getReplayChatHistoryCalls();
      const completeCalls = sendMock.mock.calls.filter((call) =>
        String(call[0]).includes('"type":"chat-history-complete"'),
      );

      expect({
        replayCalls,
        completeCallCount: completeCalls.length,
      }).toStrictEqual({
        replayCalls: [
          {
            sessionId: sessionA,
            guildId,
            chatProcessId: `quest-replay-${questId}-${workItemAId}-${sessionA}`,
          },
          {
            sessionId: sessionB,
            guildId,
            chatProcessId: `quest-replay-${questId}-${workItemBId}-${sessionB}`,
          },
        ],
        completeCallCount: 1,
      });
    });
  });

  describe('websocket onMessage subscribe-quest completed quest', () => {
    it('VALID: {subscribe-quest for completed quest} => first send is quest-modified with the quest', async () => {
      const proxy = ServerInitResponderProxy();
      const questId = QuestIdStub({ value: 'quest-completed-1' });
      const guildId = GuildIdStub();
      const quest = QuestStub({ id: questId, status: 'complete', workItems: [] });
      proxy.setupLoadQuestSuccess({ quest });
      proxy.setupFindQuestPathSuccess({
        questPath: AbsoluteFilePathStub({ value: '/q/path' }),
        guildId,
      });
      proxy.callResponder();

      const sendMock = jest.fn();
      const client = WsClientStub({ send: sendMock });
      proxy.simulateConnection({ client });
      proxy.simulateMessage({
        data: JSON.stringify({ type: 'subscribe-quest', questId }),
        ws: client,
      });

      await new Promise((resolve) => {
        setTimeout(resolve, 10);
      });

      const firstSendIsQuestModified = String(sendMock.mock.calls[0]?.[0]).startsWith(
        '{"type":"quest-modified"',
      );
      const firstSendCarriesQuestId = String(sendMock.mock.calls[0]?.[0]).includes(
        `"questId":"${questId}"`,
      );
      const firstSendCarriesQuestStatus = String(sendMock.mock.calls[0]?.[0]).includes(
        '"status":"complete"',
      );
      const completeIndex = sendMock.mock.calls.findIndex((c) =>
        String(c[0]).includes('"type":"chat-history-complete"'),
      );

      expect({
        firstSendIsQuestModified,
        firstSendCarriesQuestId,
        firstSendCarriesQuestStatus,
        questModifiedBeforeChatHistoryComplete: completeIndex > 0,
      }).toStrictEqual({
        firstSendIsQuestModified: true,
        firstSendCarriesQuestId: true,
        firstSendCarriesQuestStatus: true,
        questModifiedBeforeChatHistoryComplete: true,
      });
    });
  });

  describe('websocket onMessage subscribe-quest concurrent subscriptions', () => {
    it('VALID: {subscribe X then Y, unsubscribe X} => Y stays subscribed, X removed', async () => {
      const proxy = ServerInitResponderProxy();
      const questIdX = QuestIdStub({ value: 'quest-X' });
      const questIdY = QuestIdStub({ value: 'quest-Y' });
      const otherQuestId = QuestIdStub({ value: 'quest-Z' });
      proxy.setupLoadQuestSuccess({ quest: QuestStub({ id: questIdX, workItems: [] }) });
      proxy.setupLoadQuestSuccess({ quest: QuestStub({ id: questIdY, workItems: [] }) });
      proxy.callResponder();

      const sendMock = jest.fn();
      const client = WsClientStub({ send: sendMock });
      proxy.simulateConnection({ client });
      proxy.simulateMessage({
        data: JSON.stringify({ type: 'subscribe-quest', questId: questIdX }),
        ws: client,
      });
      proxy.simulateMessage({
        data: JSON.stringify({ type: 'subscribe-quest', questId: questIdY }),
        ws: client,
      });
      proxy.simulateMessage({
        data: JSON.stringify({ type: 'unsubscribe-quest', questId: questIdX }),
        ws: client,
      });

      await new Promise((resolve) => {
        setTimeout(resolve, 10);
      });

      sendMock.mockClear();

      const handler = proxy.getCapturedEventHandler({ type: 'chat-output' });
      // Event tagged with questIdY should reach the client (still subscribed).
      handler!({
        processId: ProcessIdStub({ value: 'p-Y' }),
        payload: { questId: questIdY, text: 'for-Y' },
      });
      // Event tagged with questIdX should NOT reach the client (unsubscribed).
      handler!({
        processId: ProcessIdStub({ value: 'p-X' }),
        payload: { questId: questIdX, text: 'for-X' },
      });
      // Event tagged with otherQuestId should NOT reach the client either.
      handler!({
        processId: ProcessIdStub({ value: 'p-Z' }),
        payload: { questId: otherQuestId, text: 'for-Z' },
      });

      const yCount = sendMock.mock.calls.filter((c) =>
        String(c[0]).includes('"text":"for-Y"'),
      ).length;
      const xCount = sendMock.mock.calls.filter((c) =>
        String(c[0]).includes('"text":"for-X"'),
      ).length;
      const zCount = sendMock.mock.calls.filter((c) =>
        String(c[0]).includes('"text":"for-Z"'),
      ).length;

      expect({ yCount, xCount, zCount }).toStrictEqual({ yCount: 1, xCount: 0, zCount: 0 });
    });
  });

  describe('event subscription per-quest filter', () => {
    it('VALID: {chat-output for quest X} => only client subscribed to X receives it', async () => {
      const proxy = ServerInitResponderProxy();
      const questIdX = QuestIdStub({ value: 'quest-filter-X' });
      const questIdY = QuestIdStub({ value: 'quest-filter-Y' });
      proxy.setupLoadQuestSuccess({ quest: QuestStub({ id: questIdX, workItems: [] }) });
      proxy.setupLoadQuestSuccess({ quest: QuestStub({ id: questIdY, workItems: [] }) });
      proxy.callResponder();

      const sendA = jest.fn();
      const sendB = jest.fn();
      const clientA = WsClientStub({ send: sendA });
      const clientB = WsClientStub({ send: sendB });
      proxy.simulateConnection({ client: clientA });
      proxy.simulateConnection({ client: clientB });
      proxy.simulateMessage({
        data: JSON.stringify({ type: 'subscribe-quest', questId: questIdX }),
        ws: clientA,
      });
      proxy.simulateMessage({
        data: JSON.stringify({ type: 'subscribe-quest', questId: questIdY }),
        ws: clientB,
      });

      await new Promise((resolve) => {
        setTimeout(resolve, 10);
      });

      sendA.mockClear();
      sendB.mockClear();

      const handler = proxy.getCapturedEventHandler({ type: 'chat-output' });
      handler!({
        processId: ProcessIdStub({ value: 'p-1' }),
        payload: { questId: questIdX, text: 'X-only' },
      });

      const aGotIt = sendA.mock.calls.some((c) => String(c[0]).includes('"text":"X-only"'));
      const bGotIt = sendB.mock.calls.some((c) => String(c[0]).includes('"text":"X-only"'));

      expect({ aGotIt, bGotIt }).toStrictEqual({ aGotIt: true, bGotIt: false });
    });
  });

  describe('global event broadcast', () => {
    it('VALID: {phase-change event} => fans out to every connected client (subscribed or not)', async () => {
      const proxy = ServerInitResponderProxy();
      const questIdX = QuestIdStub({ value: 'quest-global' });
      proxy.setupLoadQuestSuccess({ quest: QuestStub({ id: questIdX, workItems: [] }) });
      proxy.callResponder();

      const sendA = jest.fn();
      const sendB = jest.fn();
      const clientA = WsClientStub({ send: sendA });
      const clientB = WsClientStub({ send: sendB });
      proxy.simulateConnection({ client: clientA });
      proxy.simulateConnection({ client: clientB });
      proxy.simulateMessage({
        data: JSON.stringify({ type: 'subscribe-quest', questId: questIdX }),
        ws: clientA,
      });

      await new Promise((resolve) => {
        setTimeout(resolve, 10);
      });

      sendA.mockClear();
      sendB.mockClear();

      const handler = proxy.getCapturedEventHandler({ type: 'phase-change' });
      handler!({
        processId: ProcessIdStub({ value: 'p-broadcast' }),
        payload: { phase: 'codeweaver' },
      });

      const aCount = sendA.mock.calls.length;
      const bCount = sendB.mock.calls.length;

      expect({ aCount, bCount }).toStrictEqual({ aCount: 1, bCount: 1 });
    });
  });

  describe('pipeline buffer flush per-quest filter', () => {
    it('VALID: {buffered chat-output with questId} => only subscribed clients receive flushed batch', async () => {
      const proxy = ServerInitResponderProxy();
      const questIdX = QuestIdStub({ value: 'quest-flush-X' });
      const questIdY = QuestIdStub({ value: 'quest-flush-Y' });
      proxy.setupLoadQuestSuccess({ quest: QuestStub({ id: questIdX, workItems: [] }) });
      proxy.setupLoadQuestSuccess({ quest: QuestStub({ id: questIdY, workItems: [] }) });
      proxy.callResponder();

      const sendA = jest.fn();
      const sendB = jest.fn();
      const clientA = WsClientStub({ send: sendA });
      const clientB = WsClientStub({ send: sendB });
      proxy.simulateConnection({ client: clientA });
      proxy.simulateConnection({ client: clientB });
      proxy.simulateMessage({
        data: JSON.stringify({ type: 'subscribe-quest', questId: questIdX }),
        ws: clientA,
      });
      proxy.simulateMessage({
        data: JSON.stringify({ type: 'subscribe-quest', questId: questIdY }),
        ws: clientB,
      });

      await new Promise((resolve) => {
        setTimeout(resolve, 10);
      });

      sendA.mockClear();
      sendB.mockClear();

      const handler = proxy.getCapturedEventHandler({ type: 'chat-output' });
      handler!({
        processId: ProcessIdStub({ value: 'p-flush' }),
        payload: { questId: questIdX, slotIndex: 0, text: 'pipeline-X' },
      });

      // Real-timer wait spanning the 100ms flush interval. The responder's
      // setInterval was registered with real timers; switching to fake timers
      // here cannot retroactively wrap that handle.
      await new Promise((resolve) => {
        setTimeout(resolve, 150);
      });

      const aCount = sendA.mock.calls.filter((c) =>
        String(c[0]).includes('"text":"pipeline-X"'),
      ).length;
      const bCount = sendB.mock.calls.filter((c) =>
        String(c[0]).includes('"text":"pipeline-X"'),
      ).length;

      expect({ aCount, bCount }).toStrictEqual({ aCount: 1, bCount: 0 });
    });
  });

  describe('websocket onMessage replay-quest-history standalone', () => {
    it('VALID: {replay-quest-history} => walks workItems and replays each without subscribing', async () => {
      const proxy = ServerInitResponderProxy();
      const questId = QuestIdStub({ value: 'quest-replay-only' });
      const workItemAId = QuestWorkItemIdStub({
        value: 'cccccccc-cccc-4ccc-cccc-cccccccccccc',
      });
      const sessionA = SessionIdStub({ value: 'session-replay-A' });
      const guildId = GuildIdStub();
      const quest = QuestStub({
        id: questId,
        workItems: [WorkItemStub({ id: workItemAId, sessionId: sessionA })],
      });
      proxy.setupLoadQuestSuccess({ quest });
      proxy.setupFindQuestPathSuccess({
        questPath: AbsoluteFilePathStub({ value: '/q/path' }),
        guildId,
      });
      proxy.callResponder();

      const sendMock = jest.fn();
      const client = WsClientStub({ send: sendMock });
      proxy.simulateConnection({ client });
      proxy.simulateMessage({
        data: JSON.stringify({ type: 'replay-quest-history', questId }),
        ws: client,
      });

      await new Promise((resolve) => {
        setTimeout(resolve, 10);
      });

      sendMock.mockClear();

      // Verify NOT subscribed: a per-quest event tagged with this questId should NOT
      // reach the client (no subscription, no broadcast fallback for per-quest events).
      const handler = proxy.getCapturedEventHandler({ type: 'chat-output' });
      handler!({
        processId: ProcessIdStub({ value: 'p-after-replay' }),
        payload: { questId, text: 'post-replay' },
      });

      const replayCalls = proxy.getReplayChatHistoryCalls();
      const matchingSends = sendMock.mock.calls.filter((c) =>
        String(c[0]).includes('"text":"post-replay"'),
      );

      expect({
        replayCalls,
        matchingSendCount: matchingSends.length,
      }).toStrictEqual({
        replayCalls: [
          {
            sessionId: sessionA,
            guildId,
            chatProcessId: `quest-replay-${questId}-${workItemAId}-${sessionA}`,
          },
        ],
        matchingSendCount: 0,
      });
    });
  });

  describe('websocket onClose subscription cleanup', () => {
    it('VALID: {subscribed client disconnects} => subscription removed, no per-quest delivery after', async () => {
      const proxy = ServerInitResponderProxy();
      const questId = QuestIdStub({ value: 'quest-cleanup' });
      proxy.setupLoadQuestSuccess({ quest: QuestStub({ id: questId, workItems: [] }) });
      proxy.callResponder();

      const sendMock = jest.fn();
      const client = WsClientStub({ send: sendMock });
      proxy.simulateConnection({ client });
      proxy.simulateMessage({
        data: JSON.stringify({ type: 'subscribe-quest', questId }),
        ws: client,
      });

      await new Promise((resolve) => {
        setTimeout(resolve, 10);
      });

      proxy.simulateDisconnect({ ws: client });
      sendMock.mockClear();

      const handler = proxy.getCapturedEventHandler({ type: 'chat-output' });
      handler!({
        processId: ProcessIdStub({ value: 'p-after-disconnect' }),
        payload: { questId, text: 'after-disconnect' },
      });

      expect(sendMock.mock.calls).toStrictEqual([]);
    });
  });

  describe('websocket onMessage replay-history direct-send routing', () => {
    it('VALID: {replay-history then chat-output stamped with same chatProcessId and questId} => requesting client receives the event', () => {
      const proxy = ServerInitResponderProxy();
      proxy.callResponder();

      const sendMock = jest.fn();
      const client = WsClientStub({ send: sendMock });
      const replayProcessId = ProcessIdStub({ value: 'replay-direct-A' });
      const linkedQuestId = QuestIdStub({ value: 'quest-replay-link' });
      proxy.simulateConnection({ client });
      proxy.simulateMessage({
        data: JSON.stringify({
          type: 'replay-history',
          sessionId: SessionIdStub({ value: 'sess-A' }),
          guildId: GuildIdStub(),
          chatProcessId: replayProcessId,
        }),
        ws: client,
      });
      sendMock.mockClear();

      const handler = proxy.getCapturedEventHandler({ type: 'chat-output' });
      handler!({
        processId: ProcessIdStub({ value: 'p-replay-A' }),
        payload: {
          chatProcessId: replayProcessId,
          questId: linkedQuestId,
          text: 'replay-linked-frame',
        },
      });

      const matching = sendMock.mock.calls.filter((c) =>
        String(c[0]).includes('"text":"replay-linked-frame"'),
      ).length;

      expect(matching).toBe(1);
    });

    it('VALID: {replay-history then orphan chat-output (no questId)} => requesting client still receives it via replay-direct path', () => {
      const proxy = ServerInitResponderProxy();
      proxy.callResponder();

      const sendMock = jest.fn();
      const client = WsClientStub({ send: sendMock });
      const replayProcessId = ProcessIdStub({ value: 'replay-direct-orphan' });
      proxy.simulateConnection({ client });
      proxy.simulateMessage({
        data: JSON.stringify({
          type: 'replay-history',
          sessionId: SessionIdStub({ value: 'sess-orphan' }),
          guildId: GuildIdStub(),
          chatProcessId: replayProcessId,
        }),
        ws: client,
      });
      sendMock.mockClear();

      const chatOutputHandler = proxy.getCapturedEventHandler({ type: 'chat-output' });
      chatOutputHandler!({
        processId: ProcessIdStub({ value: 'p-orphan' }),
        payload: { chatProcessId: replayProcessId, text: 'orphan-frame' },
      });
      const completeHandler = proxy.getCapturedEventHandler({ type: 'chat-history-complete' });
      completeHandler!({
        processId: ProcessIdStub({ value: 'p-orphan' }),
        payload: { chatProcessId: replayProcessId, sessionId: 'sess-orphan' },
      });

      const orphanCount = sendMock.mock.calls.filter((c) =>
        String(c[0]).includes('"text":"orphan-frame"'),
      ).length;
      const completeCount = sendMock.mock.calls.filter((c) =>
        String(c[0]).includes('"type":"chat-history-complete"'),
      ).length;

      expect({ orphanCount, completeCount }).toStrictEqual({ orphanCount: 1, completeCount: 1 });
    });

    it('EDGE: {subscribe-quest internal replay chatProcessId} => is NOT double-sent via replay-direct path', async () => {
      const proxy = ServerInitResponderProxy();
      const questId = QuestIdStub({ value: 'quest-no-double' });
      proxy.setupLoadQuestSuccess({ quest: QuestStub({ id: questId, workItems: [] }) });
      proxy.callResponder();

      const sendMock = jest.fn();
      const client = WsClientStub({ send: sendMock });
      proxy.simulateConnection({ client });
      proxy.simulateMessage({
        data: JSON.stringify({ type: 'subscribe-quest', questId }),
        ws: client,
      });
      await new Promise((resolve) => {
        setTimeout(resolve, 10);
      });
      sendMock.mockClear();

      const internalReplayProcessId = `quest-replay-${questId}-wi-1-sess-1`;
      const handler = proxy.getCapturedEventHandler({ type: 'chat-output' });
      handler!({
        processId: ProcessIdStub({ value: 'p-internal' }),
        payload: {
          chatProcessId: internalReplayProcessId,
          questId,
          text: 'internal-replay-frame',
        },
      });

      const deliveryCount = sendMock.mock.calls.filter((c) =>
        String(c[0]).includes('"text":"internal-replay-frame"'),
      ).length;

      expect(deliveryCount).toBe(1);
    });
  });

  describe('web presence hooks', () => {
    it('VALID: {first connect} => invokes setWebPresence adapter with isPresent: true', () => {
      const proxy = ServerInitResponderProxy();
      proxy.callResponder();

      const client = WsClientStub();
      proxy.simulateConnection({ client });

      expect(proxy.getSetWebPresenceCalls()).toStrictEqual([{ isPresent: true }]);
    });

    it('VALID: {second connect while first still attached} => does NOT invoke setWebPresence again', () => {
      const proxy = ServerInitResponderProxy();
      proxy.callResponder();

      const clientA = WsClientStub();
      const clientB = WsClientStub();
      proxy.simulateConnection({ client: clientA });
      proxy.simulateConnection({ client: clientB });

      expect(proxy.getSetWebPresenceCalls()).toStrictEqual([{ isPresent: true }]);
    });

    it('VALID: {last disconnect} => invokes setWebPresence adapter with isPresent: false', () => {
      const proxy = ServerInitResponderProxy();
      proxy.callResponder();

      const client = WsClientStub();
      proxy.simulateConnection({ client });
      proxy.simulateDisconnect({ ws: client });

      expect(proxy.getSetWebPresenceCalls()).toStrictEqual([
        { isPresent: true },
        { isPresent: false },
      ]);
    });

    it('VALID: {one disconnect while another client remains} => does NOT invoke setWebPresence(false)', () => {
      const proxy = ServerInitResponderProxy();
      proxy.callResponder();

      const clientA = WsClientStub();
      const clientB = WsClientStub();
      proxy.simulateConnection({ client: clientA });
      proxy.simulateConnection({ client: clientB });
      proxy.simulateDisconnect({ ws: clientA });

      expect(proxy.getSetWebPresenceCalls()).toStrictEqual([{ isPresent: true }]);
    });
  });
});
