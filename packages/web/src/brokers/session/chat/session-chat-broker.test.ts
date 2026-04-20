import {
  GuildIdStub,
  ProcessIdStub,
  QuestIdStub,
  SessionIdStub,
  UserInputStub,
} from '@dungeonmaster/shared/contracts';

import { sessionChatBroker } from './session-chat-broker';
import { sessionChatBrokerProxy } from './session-chat-broker.proxy';

describe('sessionChatBroker', () => {
  describe('with sessionId', () => {
    it('VALID: {sessionId, guildId, message} => returns chatProcessId via session endpoint', async () => {
      const proxy = sessionChatBrokerProxy();
      const sessionId = SessionIdStub({ value: 'session-abc' });
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const message = UserInputStub({ value: 'Continue the conversation' });
      const processId = ProcessIdStub({ value: 'chat-proc-123' });

      proxy.setupSessionChat({ chatProcessId: processId });

      const result = await sessionChatBroker({ sessionId, guildId, message });

      expect(result).toStrictEqual({ chatProcessId: processId });
    });
  });

  describe('without sessionId', () => {
    it('VALID: {guildId, message} => returns chatProcessId via session-new endpoint', async () => {
      const proxy = sessionChatBrokerProxy();
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const message = UserInputStub({ value: 'Start a new conversation' });
      const processId = ProcessIdStub({ value: 'chat-proc-456' });

      proxy.setupSessionNew({ chatProcessId: processId });

      const result = await sessionChatBroker({ guildId, message });

      expect(result).toStrictEqual({ chatProcessId: processId });
    });
  });

  describe('error handling', () => {
    it('ERROR: {server error with sessionId} => throws error', async () => {
      const proxy = sessionChatBrokerProxy();
      const sessionId = SessionIdStub({ value: 'session-abc' });
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const message = UserInputStub({ value: 'Send message' });

      proxy.setupError();

      await expect(sessionChatBroker({ sessionId, guildId, message })).rejects.toThrow(/fetch/iu);
    });

    it('ERROR: {server error without sessionId} => throws error', async () => {
      const proxy = sessionChatBrokerProxy();
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const message = UserInputStub({ value: 'Send message' });

      proxy.setupError();

      await expect(sessionChatBroker({ guildId, message })).rejects.toThrow(/fetch/iu);
    });
  });

  describe('paused quest auto-resume', () => {
    it('VALID: {questStatus: paused, questId} => calls questResumeBroker then POST in that order', async () => {
      const proxy = sessionChatBrokerProxy();
      const sessionId = SessionIdStub({ value: 'session-paused' });
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const message = UserInputStub({ value: 'Resume and continue' });
      const questId = QuestIdStub({ value: 'quest-paused-1' });
      const processId = ProcessIdStub({ value: 'chat-proc-resume' });

      proxy.setupSessionChat({ chatProcessId: processId });
      proxy.setupQuestResume({ restoredStatus: 'seek_scope' });

      const result = await sessionChatBroker({
        sessionId,
        guildId,
        message,
        questId,
        questStatus: 'paused',
      });

      expect(result).toStrictEqual({ chatProcessId: processId });
      expect(proxy.getOrderedEndpointCalls()).toStrictEqual(['questResume', 'sessionChat']);
    });

    it('VALID: {questStatus: in_progress} => POSTs without calling questResumeBroker', async () => {
      const proxy = sessionChatBrokerProxy();
      const sessionId = SessionIdStub({ value: 'session-running' });
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const message = UserInputStub({ value: 'Normal message' });
      const questId = QuestIdStub({ value: 'quest-running-1' });
      const processId = ProcessIdStub({ value: 'chat-proc-running' });

      proxy.setupSessionChat({ chatProcessId: processId });
      proxy.setupQuestResume({ restoredStatus: 'seek_scope' });

      const result = await sessionChatBroker({
        sessionId,
        guildId,
        message,
        questId,
        questStatus: 'in_progress',
      });

      expect(result).toStrictEqual({ chatProcessId: processId });
      expect(proxy.getOrderedEndpointCalls()).toStrictEqual(['sessionChat']);
    });

    it('VALID: {questStatus: undefined} => POSTs without calling questResumeBroker', async () => {
      const proxy = sessionChatBrokerProxy();
      const sessionId = SessionIdStub({ value: 'session-no-status' });
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const message = UserInputStub({ value: 'Message without status' });
      const processId = ProcessIdStub({ value: 'chat-proc-no-status' });

      proxy.setupSessionChat({ chatProcessId: processId });
      proxy.setupQuestResume({ restoredStatus: 'seek_scope' });

      const result = await sessionChatBroker({ sessionId, guildId, message });

      expect(result).toStrictEqual({ chatProcessId: processId });
      expect(proxy.getOrderedEndpointCalls()).toStrictEqual(['sessionChat']);
    });
  });
});
