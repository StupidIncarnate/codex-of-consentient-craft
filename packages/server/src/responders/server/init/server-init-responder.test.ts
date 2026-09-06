import {
  AbsoluteFilePathStub,
  AgentIdStub,
  FileContentsStub,
  GuildIdStub,
  ProcessIdStub,
  QuestCommentStub,
  QuestIdStub,
  QuestStub,
  QuestWorkItemIdStub,
  SessionIdStub,
  UserChatEntryStub,
  WorkItemStub,
  WsMessageStub,
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

  describe('websocket onMessage replay-history — relay to the orchestrator', () => {
    it('VALID: {replay-history for TWO different sessionIds} => calls replayChatHistory exactly once for EACH sessionId, in order', async () => {
      const proxy = ServerInitResponderProxy();
      proxy.callResponder();

      const sendMock = jest.fn();
      const client = WsClientStub({ send: sendMock });
      const sessionIdOne = SessionIdStub({ value: 'session-relay-pin-one' });
      const sessionIdTwo = SessionIdStub({ value: 'session-relay-pin-two' });
      const guildId = GuildIdStub();
      const chatProcessIdOne = ProcessIdStub({ value: 'relay-pin-proc-one' });
      const chatProcessIdTwo = ProcessIdStub({ value: 'relay-pin-proc-two' });
      proxy.simulateConnection({ client });
      proxy.simulateMessage({
        data: JSON.stringify({
          type: 'replay-history',
          sessionId: sessionIdOne,
          guildId,
          chatProcessId: chatProcessIdOne,
        }),
        ws: client,
      });
      proxy.simulateMessage({
        data: JSON.stringify({
          type: 'replay-history',
          sessionId: sessionIdTwo,
          guildId,
          chatProcessId: chatProcessIdTwo,
        }),
        ws: client,
      });

      await new Promise((resolve) => {
        setTimeout(resolve, 10);
      });

      expect(proxy.getReplayChatHistoryCalls()).toStrictEqual([
        {
          sessionId: sessionIdOne,
          guildId,
          chatProcessId: chatProcessIdOne,
        },
        {
          sessionId: sessionIdTwo,
          guildId,
          chatProcessId: chatProcessIdTwo,
        },
      ]);
    });
  });

  describe('websocket onMessage replay-history — the relayed frame keeps its replay flag', () => {
    it('VALID: {chat-output carrying replay true and a user entry whose content is the pasted-image markdown token} => the frame the client receives still carries replay true and that exact entry, content/role/uuid included', () => {
      const proxy = ServerInitResponderProxy();
      proxy.callResponder();

      const sendMock = jest.fn();
      const client = WsClientStub({ send: sendMock });
      const chatProcessId = ProcessIdStub({ value: 'replay-flag-proc' });
      const sessionId = SessionIdStub({ value: 'session-replay-flag' });
      proxy.simulateConnection({ client });
      proxy.simulateMessage({
        data: JSON.stringify({
          type: 'replay-history',
          sessionId,
          guildId: GuildIdStub(),
          chatProcessId,
        }),
        ws: client,
      });
      sendMock.mockClear();

      const pastedImageEntry = UserChatEntryStub({
        content: '![Pasted Image 1](/api/images?path=%2Ftmp%2Fpasted-image-1.png)',
      });

      const handler = proxy.getCapturedEventHandler({ type: 'chat-output' });
      handler!({
        processId: ProcessIdStub({ value: 'p-replay-flag' }),
        payload: {
          chatProcessId,
          sessionId,
          replay: true,
          entries: [pastedImageEntry],
        },
      });

      const parsedEnvelope = JSON.parse(String(sendMock.mock.calls[0]?.[0])) as Record<
        PropertyKey,
        unknown
      >;

      expect(parsedEnvelope).toStrictEqual({
        type: 'chat-output',
        payload: {
          chatProcessId,
          sessionId,
          replay: true,
          entries: [pastedImageEntry],
          processId: 'p-replay-flag',
        },
        timestamp: '2024-01-01T00:00:00.000Z',
      });
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
        questId,
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

  describe('websocket onMessage subscribe-quest agentId forwarding', () => {
    it('VALID: {workItem carries agentId} => forwards both sessionId and agentId to replay adapter', async () => {
      const proxy = ServerInitResponderProxy();
      const questId = QuestIdStub({ value: 'quest-with-agent-1' });
      const workItemId = QuestWorkItemIdStub({
        value: '875c3364-2d64-4606-b9e3-25dd365c7792',
      });
      const sessionId = SessionIdStub({ value: '18eb0c1b-5b9e-4ff0-aaea-9f9fe0bb6402' });
      const agentId = AgentIdStub({ value: 'acd35f7b7763e33e8' });
      const guildId = GuildIdStub();
      const quest = QuestStub({
        id: questId,
        workItems: [
          WorkItemStub({
            id: workItemId,
            role: 'codeweaver',
            sessionId,
            agentId,
          }),
        ],
      });
      proxy.setupLoadQuestSuccess({ quest });
      proxy.setupFindQuestPathSuccess({
        questId,
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

      expect(proxy.getReplayChatHistoryCalls()).toStrictEqual([
        {
          sessionId,
          agentId,
          guildId,
          chatProcessId: `quest-replay-${questId}-${workItemId}-${sessionId}`,
        },
      ]);
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
        questId,
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

  // Flow: comments-excluded-from-agent-reads, node web-read-keeps-comments, observable
  // check-ws-quest-modified-carries-comments. This responder never strips anything from the
  // loaded quest before broadcasting it — only the MCP get-quest tool (a different package) does
  // that. Mocking only the true I/O boundary (orchestratorLoadQuestAdapter) and exercising the
  // real broadcast code proves badges/panels get comments live over the WS wire the same way the
  // HTTP GET does.
  //
  // Two comments, not one: a single-comment fixture cannot tell "the whole array survived" from
  // "only the first element survived" (truncation reads identical to correct behavior when there
  // is nothing after index 0), and cannot tell whether observableId (anchor to an observable box,
  // vs a bare node) survives the wire when every fixture comment shares the same anchor shape.
  describe('websocket onMessage subscribe-quest quest carrying comments', () => {
    it('VALID: {subscribe-quest for a quest carrying two comments — one bare-node, one observable-anchored} => the quest-modified payload carries the full comments array unchanged, anchors intact', async () => {
      const proxy = ServerInitResponderProxy();
      const questId = QuestIdStub({ value: 'quest-with-comments-1' });
      const bareComment = QuestCommentStub({
        id: 'c0e3e17a-58cc-4372-a567-0e02b2c3da01' as never,
        flowId: 'login-flow' as never,
        nodeId: 'start' as never,
        text: 'Badge and panel should see this live' as never,
      });
      const observableComment = QuestCommentStub({
        id: 'c0e3e17a-58cc-4372-a567-0e02b2c3da02' as never,
        flowId: 'login-flow' as never,
        nodeId: 'end' as never,
        observableId: 'login-redirects-to-dashboard' as never,
        text: 'Anchored to an observable, must survive same as the bare-node comment' as never,
      });
      const quest = QuestStub({
        id: questId,
        status: 'flows_approved',
        workItems: [],
        comments: [bareComment, observableComment],
      });
      proxy.setupLoadQuestSuccess({ quest });
      proxy.setupFindQuestPathSuccess({
        questId,
        questPath: AbsoluteFilePathStub({ value: '/q/path' }),
        guildId: GuildIdStub(),
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

      const parsedMessage = WsMessageStub(JSON.parse(String(sendMock.mock.calls[0]?.[0])) as never);
      // payload's key type is branded (PayloadKey), so dot/bracket access by name (`.quest`)
      // does not type-check. Object.values() sidesteps the branded KEY type entirely — it only
      // cares about the VALUE type (unknown) — and is safe here because every quest-modified
      // send in server-init-responder.ts constructs payload as `{ questId, quest }` in that
      // fixed order (both the subscribe-quest immediate send and the outbox watcher broadcast).
      const [, payloadQuestValue] = Object.values(parsedMessage.payload);
      const payloadQuest = QuestStub(payloadQuestValue as never);

      expect(payloadQuest.comments).toStrictEqual([bareComment, observableComment]);
    });
  });

  // Flow: comments-excluded-from-agent-reads, node web-read-keeps-comments, observable
  // check-ws-quest-modified-carries-comments. The test above only exercises the subscribe-quest
  // IMMEDIATE send. This is the OTHER, independent source of a quest-modified frame — the outbox
  // watcher's onQuestChanged callback, fired when a real mutation (e.g. a new comment) is
  // persisted after the client already subscribed. server-init-responder.ts does no merging here
  // either: it re-calls orchestratorLoadQuestAdapter fresh on every firing and forwards whatever
  // that returns. The property worth pinning is exactly that freshness — a regression that reused
  // or cached the quest object handed to the FIRST send would leave every subsequent broadcast
  // stuck at the old comment count (the badge would never grow), which is indistinguishable from
  // "extends" only if a SECOND, different load result is proven to reach the wire.
  describe('websocket onMessage subscribe-quest quest carrying comments — outbox watcher broadcast', () => {
    it('VALID: {a real mutation fires onQuestChanged after subscribe} => the outbox broadcast carries the CURRENT full comments array, not the one from the original subscribe send', async () => {
      const proxy = ServerInitResponderProxy();
      const questId = QuestIdStub({ value: 'quest-with-comments-outbox-1' });
      const bareComment = QuestCommentStub({
        id: 'c0e3e17a-58cc-4372-a567-0e02b2c3da10' as never,
        flowId: 'alpha-flow' as never,
        nodeId: 'node-one' as never,
        text: 'Present before the mutation' as never,
      });
      const initialQuest = QuestStub({
        id: questId,
        status: 'flows_approved',
        workItems: [],
        comments: [bareComment],
      });
      proxy.setupLoadQuestSuccess({ quest: initialQuest });
      proxy.setupFindQuestPathSuccess({
        questId,
        questPath: AbsoluteFilePathStub({ value: '/q/path' }),
        guildId: GuildIdStub(),
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

      sendMock.mockClear();

      const observableComment = QuestCommentStub({
        id: 'c0e3e17a-58cc-4372-a567-0e02b2c3da11' as never,
        flowId: 'beta-flow' as never,
        nodeId: 'node-two' as never,
        observableId: 'checkout-completes-order' as never,
        text: 'Added by the real mutation the outbox watcher observed' as never,
      });
      const mutatedQuest = QuestStub({
        id: questId,
        status: 'flows_approved',
        workItems: [],
        comments: [bareComment, observableComment],
      });
      proxy.setupLoadQuestSuccess({ quest: mutatedQuest });

      const { onQuestChanged } = proxy.getOutboxWatchCallbacks();
      onQuestChanged!({ questId });

      await new Promise((resolve) => {
        setTimeout(resolve, 10);
      });

      const parsedMessage = WsMessageStub(JSON.parse(String(sendMock.mock.calls[0]?.[0])) as never);
      const [, payloadQuestValue] = Object.values(parsedMessage.payload);
      const payloadQuest = QuestStub(payloadQuestValue as never);

      expect({
        sendCount: sendMock.mock.calls.length,
        comments: payloadQuest.comments,
      }).toStrictEqual({
        sendCount: 1,
        comments: [bareComment, observableComment],
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

    it('VALID: {chat-output payload carries questId} => envelope sent to subscribed client preserves questId field', async () => {
      const proxy = ServerInitResponderProxy();
      const questIdX = QuestIdStub({ value: 'quest-envelope-X' });
      proxy.setupLoadQuestSuccess({ quest: QuestStub({ id: questIdX, workItems: [] }) });
      proxy.callResponder();

      const sendA = jest.fn();
      const clientA = WsClientStub({ send: sendA });
      proxy.simulateConnection({ client: clientA });
      proxy.simulateMessage({
        data: JSON.stringify({ type: 'subscribe-quest', questId: questIdX }),
        ws: clientA,
      });

      await new Promise((resolve) => {
        setTimeout(resolve, 10);
      });

      sendA.mockClear();

      const handler = proxy.getCapturedEventHandler({ type: 'chat-output' });
      handler!({
        processId: ProcessIdStub({ value: 'p-envelope' }),
        payload: { questId: questIdX, chatProcessId: 'cp-envelope', entries: [] },
      });

      const envelopeFrames = sendA.mock.calls
        .map((c) => JSON.parse(String(c[0])) as Record<PropertyKey, unknown>)
        .filter((m) => {
          const p = m.payload as Record<PropertyKey, unknown> | undefined;
          return p?.chatProcessId === 'cp-envelope';
        });

      const summary = envelopeFrames.map((frame) => ({
        type: frame.type,
        payloadQuestId: (frame.payload as Record<PropertyKey, unknown>).questId,
        payloadChatProcessId: (frame.payload as Record<PropertyKey, unknown>).chatProcessId,
        payloadProcessId: (frame.payload as Record<PropertyKey, unknown>).processId,
      }));

      expect(summary).toStrictEqual([
        {
          type: 'chat-output',
          payloadQuestId: questIdX,
          payloadChatProcessId: 'cp-envelope',
          payloadProcessId: 'p-envelope',
        },
      ]);
    });
  });

  describe('event subscription — a replay frame reaches the subscribed client', () => {
    it('VALID: {chat-output for the subscribed quest} => the subscribed client receives the frame carrying that entry', async () => {
      const proxy = ServerInitResponderProxy();
      const questIdX = QuestIdStub({ value: 'quest-replay-envelope-X' });
      proxy.setupLoadQuestSuccess({ quest: QuestStub({ id: questIdX, workItems: [] }) });
      proxy.callResponder();

      const sendA = jest.fn();
      const clientA = WsClientStub({ send: sendA });
      proxy.simulateConnection({ client: clientA });
      proxy.simulateMessage({
        data: JSON.stringify({ type: 'subscribe-quest', questId: questIdX }),
        ws: clientA,
      });

      await new Promise((resolve) => {
        setTimeout(resolve, 10);
      });

      sendA.mockClear();

      const handler = proxy.getCapturedEventHandler({ type: 'chat-output' });
      handler!({
        processId: ProcessIdStub({ value: 'p-replay-envelope' }),
        payload: {
          questId: questIdX,
          chatProcessId: 'cp-replay-envelope',
          replay: true,
          entries: [{ role: 'user', content: 'replayed message text' }],
        },
      });

      const envelopeFrames = sendA.mock.calls
        .map((c) => JSON.parse(String(c[0])) as Record<PropertyKey, unknown>)
        .filter((m) => {
          const p = m.payload as Record<PropertyKey, unknown> | undefined;
          return p?.chatProcessId === 'cp-replay-envelope';
        });

      expect(envelopeFrames).toStrictEqual([
        {
          type: 'chat-output',
          payload: {
            questId: questIdX,
            chatProcessId: 'cp-replay-envelope',
            replay: true,
            entries: [{ role: 'user', content: 'replayed message text' }],
            processId: 'p-replay-envelope',
          },
          timestamp: '2024-01-01T00:00:00.000Z',
        },
      ]);
    });
  });

  describe('event subscription unresolved-questId isolation', () => {
    it('VALID: {chat-output whose questId cannot be resolved} => reaches NO subscribed client', async () => {
      const proxy = ServerInitResponderProxy();
      const questIdX = QuestIdStub({ value: 'quest-unresolved-X' });
      const questIdY = QuestIdStub({ value: 'quest-unresolved-Y' });
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
        processId: ProcessIdStub({ value: 'p-unresolved' }),
        payload: { chatProcessId: 'proc-monitor-unresolved', entries: [] },
      });

      await new Promise((resolve) => {
        setTimeout(resolve, 10);
      });

      const aFrames = sendA.mock.calls.filter((c) =>
        String(c[0]).includes('proc-monitor-unresolved'),
      );
      const bFrames = sendB.mock.calls.filter((c) =>
        String(c[0]).includes('proc-monitor-unresolved'),
      );

      expect({ aFrames, bFrames }).toStrictEqual({ aFrames: [], bFrames: [] });
    });

    it('VALID: {chat-output carrying only a workItemId} => reaches only the owning quest subscriber, stamped with its questId', async () => {
      const proxy = ServerInitResponderProxy();
      const questIdX = QuestIdStub({ value: 'quest-lookup-X' });
      const questIdY = QuestIdStub({ value: 'quest-lookup-Y' });
      const workItemId = QuestWorkItemIdStub({ value: '5d53ad7f-49e9-4e6c-8d6a-8ccea8120b13' });
      // Quest X owns the work item, so subscribing to X is what teaches the relay which
      // quest a workItemId-only payload belongs to.
      proxy.setupLoadQuestSuccess({
        quest: QuestStub({
          id: questIdX,
          workItems: [WorkItemStub({ id: workItemId, role: 'codeweaver' })],
        }),
      });
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

      // The payload names a work item but no quest — the shape every quest-driven watcher
      // emit has. It must land on X's subscriber, stamped, and nowhere else.
      const handler = proxy.getCapturedEventHandler({ type: 'chat-output' });
      handler!({
        processId: ProcessIdStub({ value: 'p-lookup' }),
        payload: { chatProcessId: 'cp-lookup', workItemId, entries: [] },
      });

      await new Promise((resolve) => {
        setTimeout(resolve, 10);
      });

      const aSummary = sendA.mock.calls
        .map((c) => JSON.parse(String(c[0])) as Record<PropertyKey, unknown>)
        .filter(
          (m) =>
            (m.payload as Record<PropertyKey, unknown> | undefined)?.chatProcessId === 'cp-lookup',
        )
        .map((frame) => ({
          type: frame.type,
          payloadQuestId: (frame.payload as Record<PropertyKey, unknown>).questId,
          payloadWorkItemId: (frame.payload as Record<PropertyKey, unknown>).workItemId,
        }));
      const bFrames = sendB.mock.calls.filter((c) => String(c[0]).includes('cp-lookup'));

      expect({ aSummary, bFrames }).toStrictEqual({
        aSummary: [
          {
            type: 'chat-output',
            payloadQuestId: questIdX,
            payloadWorkItemId: workItemId,
          },
        ],
        bFrames: [],
      });
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
        questId,
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
    it('VALID: {two clients each send replay-history for DIFFERENT chatProcessIds; chat-output emitted for one} => the addressed client receives exactly that frame; the other client receives nothing', () => {
      const proxy = ServerInitResponderProxy();
      proxy.callResponder();

      const sendA = jest.fn();
      const sendB = jest.fn();
      const clientA = WsClientStub({ send: sendA });
      const clientB = WsClientStub({ send: sendB });
      const replayProcessIdA = ProcessIdStub({ value: 'replay-direct-two-A' });
      const replayProcessIdB = ProcessIdStub({ value: 'replay-direct-two-B' });
      const linkedQuestId = QuestIdStub({ value: 'quest-replay-link-two' });
      proxy.simulateConnection({ client: clientA });
      proxy.simulateConnection({ client: clientB });
      proxy.simulateMessage({
        data: JSON.stringify({
          type: 'replay-history',
          sessionId: SessionIdStub({ value: 'sess-two-A' }),
          guildId: GuildIdStub(),
          chatProcessId: replayProcessIdA,
        }),
        ws: clientA,
      });
      proxy.simulateMessage({
        data: JSON.stringify({
          type: 'replay-history',
          sessionId: SessionIdStub({ value: 'sess-two-B' }),
          guildId: GuildIdStub(),
          chatProcessId: replayProcessIdB,
        }),
        ws: clientB,
      });
      sendA.mockClear();
      sendB.mockClear();

      const handler = proxy.getCapturedEventHandler({ type: 'chat-output' });
      handler!({
        processId: ProcessIdStub({ value: 'p-replay-two-A' }),
        payload: {
          chatProcessId: replayProcessIdA,
          questId: linkedQuestId,
          text: 'replay-linked-frame-two',
        },
      });

      const framesA = sendA.mock.calls.map(
        (c) => JSON.parse(String(c[0])) as Record<PropertyKey, unknown>,
      );
      const framesB = sendB.mock.calls.map(
        (c) => JSON.parse(String(c[0])) as Record<PropertyKey, unknown>,
      );

      expect({ framesA, framesB }).toStrictEqual({
        framesA: [
          {
            type: 'chat-output',
            payload: {
              chatProcessId: replayProcessIdA,
              questId: linkedQuestId,
              text: 'replay-linked-frame-two',
              processId: 'p-replay-two-A',
            },
            timestamp: '2024-01-01T00:00:00.000Z',
          },
        ],
        framesB: [],
      });
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

  describe('non-API deep-link redirect to web UI port', () => {
    it('VALID: {GET /codex/quest/<id>?chat=hidden} => 302 redirect to same path and query on web UI port', async () => {
      const proxy = ServerInitResponderProxy();
      proxy.setServerPort({ value: '4800' });
      proxy.callResponder();

      const response = await proxy.dispatchRequest({
        url: 'http://dungeonmaster.localhost:4800/codex/quest/abc-123?chat=hidden',
      });

      expect({
        status: response.status,
        location: response.headers.get('location'),
      }).toStrictEqual({
        status: 302,
        location: 'http://dungeonmaster.localhost:4801/codex/quest/abc-123?chat=hidden',
      });
    });

    it('VALID: {GET /} => 302 redirect to web UI port (root redirect preserved)', async () => {
      const proxy = ServerInitResponderProxy();
      proxy.setServerPort({ value: '4800' });
      proxy.callResponder();

      const response = await proxy.dispatchRequest({
        url: 'http://dungeonmaster.localhost:4800/',
      });

      expect({
        status: response.status,
        location: response.headers.get('location'),
      }).toStrictEqual({
        status: 302,
        location: 'http://dungeonmaster.localhost:4801/',
      });
    });

    it('VALID: {GET /api/quests with no mounted route} => not redirected to web UI port', async () => {
      const proxy = ServerInitResponderProxy();
      proxy.setServerPort({ value: '4800' });
      proxy.callResponder();

      const response = await proxy.dispatchRequest({
        url: 'http://dungeonmaster.localhost:4800/api/quests',
      });

      expect({
        status: response.status,
        location: response.headers.get('location'),
      }).toStrictEqual({
        status: 404,
        location: null,
      });
    });

    it('VALID: {GET /api with no trailing slash} => not redirected to web UI port', async () => {
      const proxy = ServerInitResponderProxy();
      proxy.setServerPort({ value: '4800' });
      proxy.callResponder();

      const response = await proxy.dispatchRequest({
        url: 'http://dungeonmaster.localhost:4800/api',
      });

      expect({
        status: response.status,
        location: response.headers.get('location'),
      }).toStrictEqual({
        status: 404,
        location: null,
      });
    });

    it('VALID: {GET /ws} => not redirected to web UI port', async () => {
      const proxy = ServerInitResponderProxy();
      proxy.setServerPort({ value: '4800' });
      proxy.callResponder();

      const response = await proxy.dispatchRequest({
        url: 'http://dungeonmaster.localhost:4800/ws',
      });

      // The /ws route is claimed by the upgradeWebSocket handler before the catch-all
      // sees it, so the request is never redirected to the web UI port. The invariant
      // under test is the absence of a redirect Location header, not the exact status.
      expect(response.headers.get('location')).toBe(null);
    });
  });

  describe('single-port web bundle serving (serveWebBundle=true)', () => {
    it('VALID: {GET /} => 200 serving index.html from the built web bundle (no redirect)', async () => {
      const proxy = ServerInitResponderProxy();
      proxy.setupWebBundleFile({
        contents: FileContentsStub({ value: '<!doctype html><title>DM</title>' }),
      });
      proxy.callResponder({ serveWebBundle: true });

      const response = await proxy.dispatchRequest({
        url: 'http://dungeonmaster.localhost:3737/',
      });
      const text = await response.text();

      expect({
        status: response.status,
        contentType: response.headers.get('content-type'),
        location: response.headers.get('location'),
        text,
      }).toStrictEqual({
        status: 200,
        contentType: 'text/html; charset=utf-8',
        location: null,
        text: '<!doctype html><title>DM</title>',
      });
    });

    it('VALID: {GET /codex/quest/<id>?chat=hidden} => 200 index.html SPA fallback (not redirected)', async () => {
      const proxy = ServerInitResponderProxy();
      proxy.setupWebBundleFile({ contents: FileContentsStub({ value: '<!doctype html>' }) });
      proxy.callResponder({ serveWebBundle: true });

      const response = await proxy.dispatchRequest({
        url: 'http://dungeonmaster.localhost:3737/codex/quest/abc-123?chat=hidden',
      });

      expect({
        status: response.status,
        location: response.headers.get('location'),
        contentType: response.headers.get('content-type'),
      }).toStrictEqual({
        status: 200,
        location: null,
        contentType: 'text/html; charset=utf-8',
      });
    });

    it('VALID: {GET /assets/index-abc.js} => 200 serving the JS asset', async () => {
      const proxy = ServerInitResponderProxy();
      proxy.setupWebBundleFile({ contents: FileContentsStub({ value: 'console.log(1)' }) });
      proxy.callResponder({ serveWebBundle: true });

      const response = await proxy.dispatchRequest({
        url: 'http://dungeonmaster.localhost:3737/assets/index-abc.js',
      });
      const text = await response.text();

      expect({
        status: response.status,
        contentType: response.headers.get('content-type'),
        text,
      }).toStrictEqual({
        status: 200,
        contentType: 'text/javascript; charset=utf-8',
        text: 'console.log(1)',
      });
    });

    it('VALID: {GET /api/quests in bundle mode} => 404 (not served as an SPA route)', async () => {
      const proxy = ServerInitResponderProxy();
      proxy.callResponder({ serveWebBundle: true });

      const response = await proxy.dispatchRequest({
        url: 'http://dungeonmaster.localhost:3737/api/quests',
      });

      expect(response.status).toBe(404);
    });
  });
});
