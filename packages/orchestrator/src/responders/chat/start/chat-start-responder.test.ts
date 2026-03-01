import {
  ExitCodeStub,
  GuildIdStub,
  SessionIdStub,
  QuestStub,
  FilePathStub,
} from '@dungeonmaster/shared/contracts';

import { ClarificationQuestionStub } from '../../../contracts/clarification-question/clarification-question.stub';
import { pendingClarificationState } from '../../../state/pending-clarification/pending-clarification-state';
import { ChatStartResponderProxy } from './chat-start-responder.proxy';

describe('ChatStartResponder', () => {
  describe('basic start', () => {
    it('VALID: {guildId, message} => returns chatProcessId from spawn broker', async () => {
      const proxy = ChatStartResponderProxy();
      const exitCode = ExitCodeStub({ value: 0 });
      proxy.setupNewSession({ exitCode });

      const result = await proxy.callResponder({
        guildId: GuildIdStub(),
        message: 'Help me build auth',
      });

      expect(result.chatProcessId).toMatch(/^chat-/u);
    });
  });

  describe('session resumption', () => {
    it('VALID: {sessionId, no pending clarification} => starts chat with session', async () => {
      const proxy = ChatStartResponderProxy();
      const exitCode = ExitCodeStub({ value: 0 });
      const guildId = GuildIdStub();
      const sessionId = SessionIdStub({ value: 'session-resume' });

      proxy.setupResumeSession({ exitCode });
      proxy.setupPendingEmpty();

      proxy.setupQuestsPath({
        homeDir: '/home/testuser',
        homePath: FilePathStub({ value: '/home/testuser/.dungeonmaster' }),
        questsPath: FilePathStub({
          value: `/home/testuser/.dungeonmaster/guilds/${guildId}/quests`,
        }),
      });
      proxy.setupQuestDirectories({ files: [] });

      const result = await proxy.callResponder({
        guildId,
        message: 'Continue the conversation',
        sessionId,
      });

      expect(result.chatProcessId).toMatch(/^chat-/u);
    });
  });

  describe('clarification handling', () => {
    it('VALID: {sessionId with pending clarification} => removes clarification from state and starts chat', async () => {
      const proxy = ChatStartResponderProxy();
      const exitCode = ExitCodeStub({ value: 0 });
      const guildId = GuildIdStub();
      const sessionId = SessionIdStub({ value: 'session-clarify' });
      const quest = QuestStub({ questCreatedSessionBy: sessionId });

      proxy.setupResumeSession({ exitCode });
      proxy.setupPendingWithSessionEntry({
        sessionId,
        questId: quest.id,
        questions: [ClarificationQuestionStub()],
      });

      proxy.setupQuestsPath({
        homeDir: '/home/testuser',
        homePath: FilePathStub({ value: '/home/testuser/.dungeonmaster' }),
        questsPath: FilePathStub({
          value: `/home/testuser/.dungeonmaster/guilds/${guildId}/quests`,
        }),
      });
      proxy.setupQuestDirectories({ files: [] });

      const result = await proxy.callResponder({
        guildId,
        message: 'Use OAuth',
        sessionId,
      });

      const pendingAfter = pendingClarificationState.getForSession({ sessionId });

      expect(pendingAfter).toBeUndefined();
      expect(result.chatProcessId).toMatch(/^chat-/u);
    });
  });
});
