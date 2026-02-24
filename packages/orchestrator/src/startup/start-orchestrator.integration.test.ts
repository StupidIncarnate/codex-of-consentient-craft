import { GuildIdStub, ProcessIdStub, QuestIdStub } from '@dungeonmaster/shared/contracts';

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
  });
});
