import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

import {
  GuildIdStub,
  GuildPathStub,
  ProcessIdStub,
  QuestIdStub,
  QuestStub,
} from '@dungeonmaster/shared/contracts';

import { ModifyQuestInputStub } from '../contracts/modify-quest-input/modify-quest-input.stub';
import { orchestrationEventsState } from '../state/orchestration-events/orchestration-events-state';
import { StartOrchestrator } from './start-orchestrator';

type ProcessId = ReturnType<typeof ProcessIdStub>;

describe('StartOrchestrator', () => {
  describe('listQuests', () => {
    it('ERROR: {invalid guildId} => throws error when quests folder not found', async () => {
      const guildId = GuildIdStub({ value: '00000000-0000-0000-0000-000000000000' });

      await expect(StartOrchestrator.listQuests({ guildId })).rejects.toThrow(
        /ENOENT|no such file/u,
      );
    });
  });

  describe('loadQuest', () => {
    it('ERROR: {invalid questId} => throws quest not found error', async () => {
      const questId = QuestIdStub({ value: 'nonexistent-quest' });

      await expect(StartOrchestrator.loadQuest({ questId })).rejects.toThrow(/ENOENT|not found/u);
    });
  });

  describe('startQuest', () => {
    it('ERROR: {invalid questId} => throws error when quest not found', async () => {
      const questId = QuestIdStub({ value: 'add-auth' });

      await expect(StartOrchestrator.startQuest({ questId })).rejects.toThrow(/ENOENT|not found/u);
    });

    it('ERROR: {quest status not approved} => throws status guard error', async () => {
      const tempDir = mkdtempSync(join(tmpdir(), 'orch-test-'));
      const originalHome = process.env.DUNGEONMASTER_HOME;
      process.env.DUNGEONMASTER_HOME = tempDir;

      const guildId = GuildIdStub({ value: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' });
      const questId = QuestIdStub({ value: 'test-quest-status' });
      const quest = QuestStub({ id: questId, status: 'created', folder: '001-test-quest-status' });

      const configDir = join(tempDir, '.dungeonmaster');
      const guildsDir = join(configDir, 'guilds', guildId, 'quests', '001-test-quest-status');
      mkdirSync(guildsDir, { recursive: true });

      writeFileSync(
        join(configDir, 'config.json'),
        JSON.stringify({
          guilds: [
            {
              id: guildId,
              name: 'Test Guild',
              path: tempDir,
              createdAt: '2024-01-15T10:00:00.000Z',
            },
          ],
        }),
      );

      writeFileSync(join(guildsDir, 'quest.json'), JSON.stringify(quest));

      let caughtError: unknown = null;
      try {
        await StartOrchestrator.startQuest({ questId });
      } catch (error) {
        caughtError = error;
      }

      process.env.DUNGEONMASTER_HOME = originalHome;
      rmSync(tempDir, { recursive: true, force: true });

      expect(caughtError).toBeInstanceOf(Error);
      expect((caughtError as Error).message).toMatch(
        /Quest must be approved before starting\. Current status: created/u,
      );
    });
  });

  describe('getQuestStatus', () => {
    it('ERROR: {nonexistent processId} => throws process not found error', () => {
      const processId = ProcessIdStub({ value: 'proc-nonexistent' });

      expect(() => StartOrchestrator.getQuestStatus({ processId })).toThrow(
        /Process not found: proc-nonexistent/u,
      );
    });
  });

  describe('modifyQuest event emission', () => {
    it('ERROR: {quest not found} => does not emit quest-modified event', async () => {
      const events: { processId: ProcessId; payload: Record<never, never> }[] = [];
      const handler = ({
        processId,
        payload,
      }: {
        processId: ProcessId;
        payload: Record<never, never>;
      }): void => {
        events.push({ processId, payload });
      };

      orchestrationEventsState.on({ type: 'quest-modified', handler });

      const input = ModifyQuestInputStub({ questId: 'nonexistent-quest' });

      await StartOrchestrator.modifyQuest({
        questId: 'nonexistent-quest',
        input,
      });

      orchestrationEventsState.off({ type: 'quest-modified', handler });

      expect(events).toStrictEqual([]);
    });

    it('VALID: {successful modify} => emits quest-modified event with quest object in payload', async () => {
      const tempDir = mkdtempSync(join(tmpdir(), 'orch-modify-test-'));
      const originalHome = process.env.DUNGEONMASTER_HOME;
      process.env.DUNGEONMASTER_HOME = tempDir;

      const guildId = GuildIdStub({ value: 'b2c3d4e5-f6a7-8901-bcde-f12345678901' });
      const questId = QuestIdStub({ value: 'modify-test-quest' });
      const quest = QuestStub({ id: questId, status: 'created', folder: '001-modify-test' });

      const configDir = join(tempDir, '.dungeonmaster');
      const questDir = join(configDir, 'guilds', guildId, 'quests', '001-modify-test');
      mkdirSync(questDir, { recursive: true });

      writeFileSync(
        join(configDir, 'config.json'),
        JSON.stringify({
          guilds: [
            {
              id: guildId,
              name: 'Test Guild',
              path: tempDir,
              createdAt: '2024-01-15T10:00:00.000Z',
            },
          ],
        }),
      );

      writeFileSync(join(questDir, 'quest.json'), JSON.stringify(quest));

      const events: { processId: ProcessId; payload: Record<PropertyKey, unknown> }[] = [];
      const handler = ({
        processId,
        payload,
      }: {
        processId: ProcessId;
        payload: Record<PropertyKey, unknown>;
      }): void => {
        events.push({ processId, payload });
      };

      orchestrationEventsState.on({ type: 'quest-modified', handler });

      const input = ModifyQuestInputStub({ questId });

      await StartOrchestrator.modifyQuest({ questId, input });

      orchestrationEventsState.off({ type: 'quest-modified', handler });

      process.env.DUNGEONMASTER_HOME = originalHome;
      rmSync(tempDir, { recursive: true, force: true });

      expect(events).toHaveLength(1);

      const emittedEvent = events[0]!;

      expect(emittedEvent.payload.questId).toBe(questId);
      expect(emittedEvent.payload.guildId).toBe(guildId);
      expect(typeof emittedEvent.payload.quest).toBe('object');
      expect(Reflect.get(emittedEvent.payload.quest as object, 'id')).toBe(questId);
    });
  });

  describe('browseDirectories', () => {
    it('VALID: {path: undefined} => returns directory entries from home directory', () => {
      const result = StartOrchestrator.browseDirectories({});

      expect(Array.isArray(result)).toBe(true);
    });

    it('ERROR: {path: nonexistent} => throws ENOENT for invalid path', () => {
      const path = GuildPathStub({ value: '/nonexistent/path/that/does/not/exist' });

      expect(() => StartOrchestrator.browseDirectories({ path })).toThrow(/ENOENT|no such file/u);
    });
  });

  describe('getQuest', () => {
    it('ERROR: {nonexistent questId} => returns success false', async () => {
      const result = await StartOrchestrator.getQuest({ questId: 'nonexistent-quest-id' });

      expect(result.success).toBe(false);
    });

    it('ERROR: {nonexistent questId, stage: "spec"} => returns success false with stage parameter', async () => {
      const result = await StartOrchestrator.getQuest({
        questId: 'nonexistent-quest-id',
        stage: 'spec',
      });

      expect(result.success).toBe(false);
    });
  });

  describe('verifyQuest', () => {
    it('ERROR: {nonexistent questId} => returns success false', async () => {
      const result = await StartOrchestrator.verifyQuest({ questId: 'nonexistent-quest-id' });

      expect(result.success).toBe(false);
    });
  });

  describe('addQuest', () => {
    it('INVALID_TITLE: {empty title} => throws validation error', async () => {
      const guildId = GuildIdStub({ value: '00000000-0000-0000-0000-000000000000' });

      await expect(
        StartOrchestrator.addQuest({
          title: '',
          userRequest: 'Test request',
          guildId,
        }),
      ).rejects.toThrow(/too_small|at least/u);
    });

    it('INVALID_USER_REQUEST: {empty userRequest} => throws validation error', async () => {
      const guildId = GuildIdStub({ value: '00000000-0000-0000-0000-000000000000' });

      await expect(
        StartOrchestrator.addQuest({
          title: 'Test Quest',
          userRequest: '',
          guildId,
        }),
      ).rejects.toThrow(/too_small|at least/u);
    });
  });

  describe('stopChat', () => {
    it('VALID: {nonexistent chatProcessId} => returns false', () => {
      const chatProcessId = ProcessIdStub({ value: 'proc-nonexistent-chat' });

      const result = StartOrchestrator.stopChat({ chatProcessId });

      expect(result).toBe(false);
    });
  });

  describe('stopAllChats', () => {
    it('VALID: {no active chats} => completes without error', () => {
      expect(() => {
        StartOrchestrator.stopAllChats();
      }).not.toThrow();
    });
  });
});
