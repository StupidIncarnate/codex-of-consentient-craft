import {
  ExitCodeStub,
  GuildIdStub,
  SessionIdStub,
  FilePathStub,
  ProcessIdStub,
  QuestIdStub,
} from '@dungeonmaster/shared/contracts';

import { FileNameStub } from '../../../contracts/file-name/file-name.stub';
import { orchestrationProcessesState } from '../../../state/orchestration-processes/orchestration-processes-state';
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

      expect(result.chatProcessId).toBe('chat-f47ac10b-58cc-4372-a567-0e02b2c3d479');
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

      expect(result.chatProcessId).toBe('chat-f47ac10b-58cc-4372-a567-0e02b2c3d479');
    });
  });

  describe('quest lookup failure', () => {
    it('ERROR: {quest lookup fails} => still spawns chat normally', async () => {
      const proxy = ChatStartResponderProxy();
      const exitCode = ExitCodeStub({ value: 0 });
      const sessionId = SessionIdStub({ value: 'session-quest-fail' });

      proxy.setupResumeSession({ exitCode });
      proxy.setupPendingEmpty();

      const result = await proxy.callResponder({
        guildId: GuildIdStub(),
        message: 'Chat despite quest lookup failure',
        sessionId,
      });

      expect(result.chatProcessId).toBe('chat-f47ac10b-58cc-4372-a567-0e02b2c3d479');
    });
  });

  describe('in-flight process handling', () => {
    it('VALID: {message with running process on same quest} => kills existing process, spawns new one', async () => {
      const guildId = GuildIdStub();
      const sessionId = SessionIdStub({ value: 'session-inflight' });
      const questId = QuestIdStub({ value: 'quest-inflight' });
      const existingProcessId = ProcessIdStub({ value: 'existing-proc-123' });
      const killMock = jest.fn();
      const exitCode = ExitCodeStub({ value: 0 });

      const proxy = ChatStartResponderProxy({
        questSetup: {
          homeDir: '/home/testuser',
          homePath: FilePathStub({ value: '/home/testuser/.dungeonmaster' }),
          questsPath: FilePathStub({
            value: `/home/testuser/.dungeonmaster/guilds/${guildId}/quests`,
          }),
          questFiles: [FileNameStub({ value: '001-quest-inflight' })],
          questFilePath: FilePathStub({
            value: `/home/testuser/.dungeonmaster/guilds/${guildId}/quests/001-quest-inflight/quest.json`,
          }),
          questJson: JSON.stringify({
            id: questId,
            folder: '001-quest-inflight',
            title: 'In-Flight Quest',
            status: 'in_progress',
            createdAt: '2024-01-15T10:00:00.000Z',
            userRequest: 'Test in-flight quest',
            steps: [],
            toolingRequirements: [],
            flows: [],
            workItems: [
              {
                id: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
                role: 'chaoswhisperer',
                status: 'complete',
                spawnerType: 'agent',
                sessionId,
                createdAt: '2024-01-15T10:00:00.000Z',
                attempt: 0,
                maxAttempts: 1,
                dependsOn: [],
                relatedDataItems: [],
              },
            ],
          }),
        },
      });

      proxy.setupResumeSession({ exitCode });
      proxy.setupPendingEmpty();

      proxy.setupProcessWithKill({
        processId: existingProcessId,
        questId,
        kill: killMock,
      });

      const result = await proxy.callResponder({
        guildId,
        message: 'User interrupts running agent',
        sessionId,
      });

      expect(killMock).toHaveBeenCalledTimes(1);
      expect(orchestrationProcessesState.has({ processId: existingProcessId })).toBe(false);
      expect(result.chatProcessId).toBe('chat-f47ac10b-58cc-4372-a567-0e02b2c3d479');
    });

    it('VALID: {message with no running process} => spawns normally', async () => {
      const guildId = GuildIdStub();
      const sessionId = SessionIdStub({ value: 'session-no-proc' });
      const questId = QuestIdStub({ value: 'quest-no-proc' });
      const exitCode = ExitCodeStub({ value: 0 });

      const proxy = ChatStartResponderProxy({
        questSetup: {
          homeDir: '/home/testuser',
          homePath: FilePathStub({ value: '/home/testuser/.dungeonmaster' }),
          questsPath: FilePathStub({
            value: `/home/testuser/.dungeonmaster/guilds/${guildId}/quests`,
          }),
          questFiles: [FileNameStub({ value: '001-quest-no-proc' })],
          questFilePath: FilePathStub({
            value: `/home/testuser/.dungeonmaster/guilds/${guildId}/quests/001-quest-no-proc/quest.json`,
          }),
          questJson: JSON.stringify({
            id: questId,
            folder: '001-quest-no-proc',
            title: 'No Process Quest',
            status: 'in_progress',
            createdAt: '2024-01-15T10:00:00.000Z',
            userRequest: 'Test no process quest',
            steps: [],
            toolingRequirements: [],
            flows: [],
            workItems: [
              {
                id: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
                role: 'chaoswhisperer',
                status: 'complete',
                spawnerType: 'agent',
                sessionId,
                createdAt: '2024-01-15T10:00:00.000Z',
                attempt: 0,
                maxAttempts: 1,
                dependsOn: [],
                relatedDataItems: [],
              },
            ],
          }),
        },
      });

      proxy.setupResumeSession({ exitCode });
      proxy.setupPendingEmpty();
      proxy.setupProcessEmpty();

      const result = await proxy.callResponder({
        guildId,
        message: 'Message with no running process',
        sessionId,
      });

      expect(result.chatProcessId).toBe('chat-f47ac10b-58cc-4372-a567-0e02b2c3d479');
    });

    it('VALID: {first message, no quest exists} => creates quest and spawns', async () => {
      const proxy = ChatStartResponderProxy();
      const exitCode = ExitCodeStub({ value: 0 });
      proxy.setupNewSession({ exitCode });

      const result = await proxy.callResponder({
        guildId: GuildIdStub(),
        message: 'Brand new conversation',
      });

      expect(result.chatProcessId).toBe('chat-f47ac10b-58cc-4372-a567-0e02b2c3d479');
    });

    it('EDGE: {running process on different quest} => does NOT kill, spawns normally', async () => {
      const guildId = GuildIdStub();
      const sessionId = SessionIdStub({ value: 'session-different' });
      const questId = QuestIdStub({ value: 'quest-this-session' });
      const otherQuestId = QuestIdStub({ value: 'quest-other' });
      const otherProcessId = ProcessIdStub({ value: 'other-proc-456' });
      const killMock = jest.fn();
      const exitCode = ExitCodeStub({ value: 0 });

      const proxy = ChatStartResponderProxy({
        questSetup: {
          homeDir: '/home/testuser',
          homePath: FilePathStub({ value: '/home/testuser/.dungeonmaster' }),
          questsPath: FilePathStub({
            value: `/home/testuser/.dungeonmaster/guilds/${guildId}/quests`,
          }),
          questFiles: [FileNameStub({ value: '001-quest-this-session' })],
          questFilePath: FilePathStub({
            value: `/home/testuser/.dungeonmaster/guilds/${guildId}/quests/001-quest-this-session/quest.json`,
          }),
          questJson: JSON.stringify({
            id: questId,
            folder: '001-quest-this-session',
            title: 'This Session Quest',
            status: 'in_progress',
            createdAt: '2024-01-15T10:00:00.000Z',
            userRequest: 'Test different quest session',
            steps: [],
            toolingRequirements: [],
            flows: [],
            workItems: [
              {
                id: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
                role: 'chaoswhisperer',
                status: 'complete',
                spawnerType: 'agent',
                sessionId,
                createdAt: '2024-01-15T10:00:00.000Z',
                attempt: 0,
                maxAttempts: 1,
                dependsOn: [],
                relatedDataItems: [],
              },
            ],
          }),
        },
      });

      proxy.setupResumeSession({ exitCode });
      proxy.setupPendingEmpty();

      proxy.setupProcessWithKill({
        processId: otherProcessId,
        questId: otherQuestId,
        kill: killMock,
      });

      const result = await proxy.callResponder({
        guildId,
        message: 'Message while other quest runs',
        sessionId,
      });

      expect(killMock.mock.calls).toStrictEqual([]);
      expect(orchestrationProcessesState.has({ processId: otherProcessId })).toBe(true);
      expect(result.chatProcessId).toBe('chat-f47ac10b-58cc-4372-a567-0e02b2c3d479');
    });
  });
});
