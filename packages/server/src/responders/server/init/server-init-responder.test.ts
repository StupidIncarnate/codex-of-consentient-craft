import {
  GuildIdStub,
  ProcessIdStub,
  QuestIdStub,
  QuestListItemStub,
  QuestStub,
  SessionIdStub,
} from '@dungeonmaster/shared/contracts';

import { WsClientStub } from '../../../contracts/ws-client/ws-client.stub';
import { ServerInitResponderProxy } from './server-init-responder.proxy';

describe('ServerInitResponder', () => {
  describe('websocket onMessage replay-history', () => {
    it('VALID: {type: replay-history} => calls orchestratorReplayChatHistoryAdapter', async () => {
      const proxy = ServerInitResponderProxy();
      proxy.callResponder();

      const client = WsClientStub();
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

      expect(client.send).not.toHaveBeenCalled();
    });
  });

  describe('websocket onMessage quest-by-session-request', () => {
    it('VALID: {type: quest-by-session-request, matching session} => loads quest and sends ws message', async () => {
      const proxy = ServerInitResponderProxy();
      const sessionId = SessionIdStub({ value: 'session-abc' });
      const guildId = GuildIdStub();
      const questId = QuestIdStub({ value: 'matched-quest' });
      const quest = QuestStub({ id: questId });

      proxy.setupListQuestsSuccess({
        quests: [QuestListItemStub({ id: questId, activeSessionId: sessionId })],
      });
      proxy.setupLoadQuestSuccess({ quest });
      proxy.callResponder();

      const client = WsClientStub();
      proxy.simulateConnection({ client });
      proxy.simulateMessage({
        data: JSON.stringify({
          type: 'quest-by-session-request',
          sessionId,
          guildId,
        }),
        ws: client,
      });

      await new Promise((resolve) => {
        setTimeout(resolve, 10);
      });

      expect(client.send).toHaveBeenCalledTimes(1);
    });

    it('EDGE: {type: quest-by-session-request, no matching session} => does not send ws message', async () => {
      const proxy = ServerInitResponderProxy();
      const sessionId = SessionIdStub({ value: 'session-no-match' });
      const guildId = GuildIdStub();

      proxy.setupListQuestsSuccess({
        quests: [QuestListItemStub({ activeSessionId: SessionIdStub({ value: 'other-session' }) })],
      });
      proxy.callResponder();

      const client = WsClientStub();
      proxy.simulateConnection({ client });
      proxy.simulateMessage({
        data: JSON.stringify({
          type: 'quest-by-session-request',
          sessionId,
          guildId,
        }),
        ws: client,
      });

      await new Promise((resolve) => {
        setTimeout(resolve, 10);
      });

      expect(client.send).not.toHaveBeenCalled();
    });
  });

  describe('websocket onMessage quest-by-session-request error logging', () => {
    it('ERROR: {listQuests rejects with Error} => logs error reason via processDevLogAdapter', async () => {
      const proxy = ServerInitResponderProxy();
      proxy.enableDevLogs();
      const sessionId = SessionIdStub({ value: 'session-fail' });
      const guildId = GuildIdStub();

      proxy.setupListQuestsFailure({
        error: new Error('Connection refused'),
      });
      proxy.callResponder();

      const client = WsClientStub();
      proxy.simulateConnection({ client });
      proxy.simulateMessage({
        data: JSON.stringify({
          type: 'quest-by-session-request',
          sessionId,
          guildId,
        }),
        ws: client,
      });

      await new Promise((resolve) => {
        setTimeout(resolve, 10);
      });

      const spy = proxy.getDevLogOutput();

      expect(spy).toHaveBeenCalledWith(
        expect.stringMatching(/quest-by-session-request failed.*Connection refused/u),
      );
    });

    it('ERROR: {loadQuest rejects with cause} => logs error message and cause', async () => {
      const proxy = ServerInitResponderProxy();
      proxy.enableDevLogs();
      const sessionId = SessionIdStub({ value: 'session-cause' });
      const guildId = GuildIdStub();
      const questId = QuestIdStub({ value: 'quest-cause' });

      proxy.setupListQuestsSuccess({
        quests: [QuestListItemStub({ id: questId, activeSessionId: sessionId })],
      });
      proxy.setupLoadQuestFailure({
        error: Object.assign(new Error('Failed to parse quest file'), {
          cause: new SyntaxError('Unexpected token'),
        }),
      });
      proxy.callResponder();

      const client = WsClientStub();
      proxy.simulateConnection({ client });
      proxy.simulateMessage({
        data: JSON.stringify({
          type: 'quest-by-session-request',
          sessionId,
          guildId,
        }),
        ws: client,
      });

      await new Promise((resolve) => {
        setTimeout(resolve, 10);
      });

      const spy = proxy.getDevLogOutput();

      expect(spy).toHaveBeenCalledWith(
        expect.stringMatching(/Failed to parse quest file.*cause.*Unexpected token/u),
      );
    });
  });

  describe('websocket onMessage parse error', () => {
    it('ERROR: {unparseable data} => does not throw', () => {
      const proxy = ServerInitResponderProxy();
      proxy.callResponder();

      const client = WsClientStub();
      proxy.simulateConnection({ client });

      expect(() => {
        proxy.simulateMessage({ data: 'not-json{{{', ws: client });
      }).not.toThrow();
    });
  });

  describe('event subscription', () => {
    it('VALID: {chat-output with slotIndex} => buffers event, does not broadcast immediately', () => {
      const proxy = ServerInitResponderProxy();
      proxy.callResponder();

      const client = WsClientStub();
      proxy.simulateConnection({ client });

      const handler = proxy.getCapturedEventHandler({ type: 'chat-output' });
      handler!({
        processId: ProcessIdStub(),
        payload: { slotIndex: 0, text: 'buffered' },
      });

      expect(client.send).not.toHaveBeenCalled();
    });

    it('VALID: {chat-output without slotIndex} => broadcasts immediately', () => {
      const proxy = ServerInitResponderProxy();
      proxy.callResponder();

      const client = WsClientStub();
      proxy.simulateConnection({ client });

      const handler = proxy.getCapturedEventHandler({ type: 'chat-output' });
      const processId = ProcessIdStub();
      handler!({
        processId,
        payload: { text: 'immediate' },
      });

      expect(client.send).toHaveBeenCalledTimes(1);
    });

    it('VALID: {buffered chat-output events} => flush interval drains buffer and broadcasts', () => {
      jest.useFakeTimers();

      const proxy = ServerInitResponderProxy();
      proxy.callResponder();

      const client = WsClientStub();
      proxy.simulateConnection({ client });

      const handler = proxy.getCapturedEventHandler({ type: 'chat-output' });
      handler!({
        processId: ProcessIdStub(),
        payload: { slotIndex: 0, text: 'batch-1' },
      });
      handler!({
        processId: ProcessIdStub(),
        payload: { slotIndex: 1, text: 'batch-2' },
      });

      expect(client.send).not.toHaveBeenCalled();

      jest.advanceTimersByTime(100);
      jest.useRealTimers();

      expect(client.send).toHaveBeenCalledTimes(2);
    });

    it('EDGE: {empty buffer at flush interval} => no broadcast occurs', () => {
      jest.useFakeTimers();

      const proxy = ServerInitResponderProxy();
      proxy.callResponder();

      const client = WsClientStub();
      proxy.simulateConnection({ client });

      jest.advanceTimersByTime(100);
      jest.useRealTimers();

      expect(client.send).not.toHaveBeenCalled();
    });

    it('VALID: {phase-change event} => broadcasts immediately to connected client', () => {
      const proxy = ServerInitResponderProxy();
      proxy.callResponder();

      const client = WsClientStub();
      proxy.simulateConnection({ client });

      const handler = proxy.getCapturedEventHandler({ type: 'phase-change' });
      handler!({
        processId: ProcessIdStub(),
        payload: { phase: 'codeweaver' },
      });

      expect(client.send).toHaveBeenCalledTimes(1);
    });
  });

  describe('websocket onClose', () => {
    it('VALID: {client disconnects} => removes client from set', () => {
      const proxy = ServerInitResponderProxy();
      proxy.callResponder();

      const client = WsClientStub();
      proxy.simulateConnection({ client });
      proxy.simulateDisconnect({ ws: client });

      expect(client.send).not.toHaveBeenCalled();
    });
  });
});
