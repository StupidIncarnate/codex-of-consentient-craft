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
        questId,
        guildId,
        questPath: AbsoluteFilePathStub({ value: '/quests/abc' }),
      });
      proxy.setupStartChat({ guildId, chatProcessId });

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
        questId,
        guildId,
        questPath: AbsoluteFilePathStub({ value: '/quests/paused' }),
      });
      proxy.setupResumeQuest({ questId, resumed: true, restoredStatus: 'in_progress' });
      proxy.setupStartChat({ guildId, chatProcessId });

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

  describe('post-quest chat item exclusion', () => {
    it('VALID: {tavernkeeper item first with sessionId, chaoswhisperer item second with sessionId} => resumes the chaoswhisperer sessionId', async () => {
      const proxy = QuestChatResponderProxy();
      const questId = QuestIdStub({ value: 'quest-tavernkeeper-and-chaoswhisperer' });
      const tavernkeeperSessionId = SessionIdStub({ value: 'session-tavernkeeper' });
      const chaoswhispererSessionId = SessionIdStub({ value: 'session-chaoswhisperer' });
      const guildId = GuildIdStub();
      const chatProcessId = ProcessIdStub({ value: 'proc-chaoswhisperer' });
      const quest = QuestStub({
        id: questId,
        workItems: [
          WorkItemStub({ role: 'tavernkeeper', sessionId: tavernkeeperSessionId }),
          WorkItemStub({ role: 'chaoswhisperer', sessionId: chaoswhispererSessionId }),
        ],
      });

      proxy.setupQuestLoad({ quest });
      proxy.setupFindQuestPath({
        questId,
        guildId,
        questPath: AbsoluteFilePathStub({ value: '/quests/tavernkeeper-and-chaoswhisperer' }),
      });
      proxy.setupStartChat({ guildId, chatProcessId });

      const result = await proxy.callResponder({
        params: { questId },
        body: { message: 'continue the spec chat' },
      });

      expect(result).toStrictEqual({
        status: 200,
        data: { chatProcessId: 'proc-chaoswhisperer' },
      });

      // The main composer's selector must skip the tavernkeeper item (first in workItems) and
      // resume the chaoswhisperer session it actually owns — a bare first-match selector would
      // pick tavernkeeper's sessionId instead.
      expect(proxy.getStartChatCallArgs({ guildId })).toStrictEqual({
        guildId,
        message: 'continue the spec chat',
        sessionId: chaoswhispererSessionId,
      });
    });

    it('VALID: {only chat item carrying a sessionId is tavernkeeper} => starts a fresh chat with no sessionId', async () => {
      const proxy = QuestChatResponderProxy();
      const questId = QuestIdStub({ value: 'quest-only-tavernkeeper' });
      const tavernkeeperSessionId = SessionIdStub({ value: 'session-only-tavernkeeper' });
      const guildId = GuildIdStub();
      const chatProcessId = ProcessIdStub({ value: 'proc-fresh-tavernkeeper' });
      const quest = QuestStub({
        id: questId,
        workItems: [WorkItemStub({ role: 'tavernkeeper', sessionId: tavernkeeperSessionId })],
      });

      proxy.setupQuestLoad({ quest });
      proxy.setupFindQuestPath({
        questId,
        guildId,
        questPath: AbsoluteFilePathStub({ value: '/quests/only-tavernkeeper' }),
      });
      proxy.setupStartChat({ guildId, chatProcessId });

      const result = await proxy.callResponder({
        params: { questId },
        body: { message: 'new spec question' },
      });

      expect(result).toStrictEqual({
        status: 200,
        data: { chatProcessId: 'proc-fresh-tavernkeeper' },
      });

      // No non-post-quest chat item carries a sessionId, so start-chat gets no sessionId key at
      // all — not an undefined value.
      expect(proxy.getStartChatCallArgs({ guildId })).toStrictEqual({
        guildId,
        message: 'new spec question',
      });
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
        questId,
        guildId,
        questPath: AbsoluteFilePathStub({ value: '/quests/no-session' }),
      });
      proxy.setupStartChat({ guildId, chatProcessId });

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
      const questId = QuestIdStub({ value: 'missing-quest' });
      proxy.setupQuestLoadError({ questId, error: new Error('Quest not found') });

      const result = await proxy.callResponder({
        params: { questId },
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
        questId,
        guildId,
        questPath: AbsoluteFilePathStub({ value: '/quests/throws' }),
      });
      proxy.setupStartChatError({ guildId, message: 'orchestrator startChat exploded' });

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
