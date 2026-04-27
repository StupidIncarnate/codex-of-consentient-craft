import {
  AbsoluteFilePathStub,
  GuildIdStub,
  ProcessIdStub,
  QuestIdStub,
  QuestStub,
  SessionIdStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';

import { QuestChatResponder } from './quest-chat-responder';
import { QuestChatResponderProxy } from './quest-chat-responder.proxy';

describe('QuestChatResponder', () => {
  describe('successful chat resume', () => {
    it('VALID: {questId in params, message in body, chaoswhisperer work item with sessionId} => returns 200 with chatProcessId', async () => {
      const proxy = QuestChatResponderProxy();
      const questId = QuestIdStub();
      const sessionId = SessionIdStub({ value: 'session-resume' });
      const guildId = GuildIdStub();
      const chatProcessId = ProcessIdStub({ value: 'proc-resume' });
      const quest = QuestStub({
        id: questId,
        workItems: [
          WorkItemStub({
            role: 'chaoswhisperer',
            sessionId,
          }),
        ],
      });

      proxy.setupQuestLoad({ quest });
      proxy.setupFindQuestPath({
        guildId,
        questPath: AbsoluteFilePathStub({ value: '/quests/abc' }),
      });
      proxy.setupStartChat({ chatProcessId });

      const result = await proxy.callResponder({
        params: { questId },
        body: { message: 'continue our chat' },
      });

      expect(result).toStrictEqual({
        status: 200,
        data: { chatProcessId: 'proc-resume' },
      });
    });

    it('VALID: {quest.status === paused} => calls resume adapter once with {questId} BEFORE chat-start, still returns 200', async () => {
      const proxy = QuestChatResponderProxy();
      const questId = QuestIdStub({ value: 'quest-paused' });
      const sessionId = SessionIdStub({ value: 'session-paused' });
      const guildId = GuildIdStub();
      const chatProcessId = ProcessIdStub({ value: 'proc-after-resume' });
      const quest = QuestStub({
        id: questId,
        status: 'paused',
        workItems: [
          WorkItemStub({
            role: 'chaoswhisperer',
            sessionId,
          }),
        ],
      });

      proxy.setupQuestLoad({ quest });
      proxy.setupFindQuestPath({
        guildId,
        questPath: AbsoluteFilePathStub({ value: '/quests/paused' }),
      });
      proxy.setupStartChat({ chatProcessId });

      const result = await proxy.callResponder({
        params: { questId },
        body: { message: 'wake up' },
      });

      expect(result).toStrictEqual({
        status: 200,
        data: { chatProcessId: 'proc-after-resume' },
      });

      // Resume adapter was called exactly once with { questId }.
      expect(proxy.getResumeQuestCalls()).toStrictEqual([{ questId }]);

      // Resume invocation order strictly precedes start-chat invocation order.
      expect(proxy.assertResumeCalledBeforeStartChat()).toBe(true);
    });
  });

  describe('no active chat session', () => {
    it('EDGE: {quest exists but no work item has sessionId} => still delegates to chat-start (no error), returns 200', async () => {
      const proxy = QuestChatResponderProxy();
      const questId = QuestIdStub({ value: 'quest-no-session' });
      const guildId = GuildIdStub();
      const chatProcessId = ProcessIdStub({ value: 'proc-fresh' });
      const quest = QuestStub({
        id: questId,
        workItems: [],
      });

      proxy.setupQuestLoad({ quest });
      proxy.setupFindQuestPath({
        guildId,
        questPath: AbsoluteFilePathStub({ value: '/quests/no-session' }),
      });
      proxy.setupStartChat({ chatProcessId });

      const result = await proxy.callResponder({
        params: { questId },
        body: { message: 'hello fresh' },
      });

      expect(result).toStrictEqual({
        status: 200,
        data: { chatProcessId: 'proc-fresh' },
      });

      // Quest is in_progress (default), so resume is NOT called.
      expect(proxy.getResumeQuestCalls()).toStrictEqual([]);
    });
  });

  describe('validation errors', () => {
    it('ERROR: {null params} => returns 400', async () => {
      QuestChatResponderProxy();

      const result = await QuestChatResponder({ params: null, body: { message: 'hi' } });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'Invalid params' },
      });
    });

    it('ERROR: {missing questId} => returns 400', async () => {
      QuestChatResponderProxy();

      const result = await QuestChatResponder({ params: {}, body: { message: 'hi' } });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'questId is required' },
      });
    });

    it('ERROR: {null body} => returns 400', async () => {
      QuestChatResponderProxy();

      const result = await QuestChatResponder({
        params: { questId: QuestIdStub() },
        body: null,
      });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'Request body must be a JSON object' },
      });
    });

    it('ERROR: {missing message in body} => returns 400', async () => {
      QuestChatResponderProxy();

      const result = await QuestChatResponder({
        params: { questId: QuestIdStub() },
        body: {},
      });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'message is required' },
      });
    });
  });

  describe('orchestrator failures', () => {
    it('ERROR: {questId not found — load adapter throws} => returns 500 with error message', async () => {
      const proxy = QuestChatResponderProxy();
      proxy.setupQuestLoadError({ error: new Error('Quest not found') });

      const result = await proxy.callResponder({
        params: { questId: QuestIdStub({ value: 'missing-quest' }) },
        body: { message: 'hi' },
      });

      expect(result).toStrictEqual({
        status: 500,
        data: { error: 'Quest not found' },
      });
    });

    it('ERROR: {start-chat adapter throws during delegation} => returns 500 with error message', async () => {
      const proxy = QuestChatResponderProxy();
      const questId = QuestIdStub({ value: 'quest-startchat-throws' });
      const sessionId = SessionIdStub({ value: 'session-throws' });
      const guildId = GuildIdStub();
      const quest = QuestStub({
        id: questId,
        workItems: [
          WorkItemStub({
            role: 'chaoswhisperer',
            sessionId,
          }),
        ],
      });

      proxy.setupQuestLoad({ quest });
      proxy.setupFindQuestPath({
        guildId,
        questPath: AbsoluteFilePathStub({ value: '/quests/throws' }),
      });
      proxy.setupStartChatError({ message: 'orchestrator startChat exploded' });

      const result = await proxy.callResponder({
        params: { questId },
        body: { message: 'hi' },
      });

      expect(result).toStrictEqual({
        status: 500,
        data: { error: 'orchestrator startChat exploded' },
      });
    });
  });
});
