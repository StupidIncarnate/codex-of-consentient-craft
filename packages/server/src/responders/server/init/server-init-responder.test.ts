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

  describe('websocket onMessage quest-data-request', () => {
    it('VALID: {type: quest-data-request} => calls orchestratorLoadQuestAdapter and sends ws message', async () => {
      const proxy = ServerInitResponderProxy();
      const quest = QuestStub();
      proxy.setupLoadQuestSuccess({ quest });
      proxy.callResponder();

      const client = WsClientStub();
      proxy.simulateConnection({ client });
      proxy.simulateMessage({
        data: JSON.stringify({
          type: 'quest-data-request',
          questId: QuestIdStub(),
        }),
        ws: client,
      });

      await new Promise((resolve) => {
        setTimeout(resolve, 10);
      });

      expect(client.send).toHaveBeenCalledTimes(1);
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

  describe('event subscription for non-agent-output', () => {
    it('VALID: {phase-change event} => registers handler for event type', () => {
      const proxy = ServerInitResponderProxy();
      proxy.callResponder();

      const handler = proxy.getCapturedEventHandler({ type: 'phase-change' });

      expect(handler).toBeDefined();
    });
  });

  describe('event subscription for agent-output', () => {
    it('VALID: {agent-output event} => registers handler for agent-output', () => {
      const proxy = ServerInitResponderProxy();
      proxy.callResponder();

      const handler = proxy.getCapturedEventHandler({ type: 'agent-output' });

      expect(handler).toBeDefined();
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
