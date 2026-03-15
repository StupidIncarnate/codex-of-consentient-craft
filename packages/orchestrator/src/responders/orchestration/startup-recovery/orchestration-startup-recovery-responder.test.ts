import {
  GuildIdStub,
  GuildListItemStub,
  GuildPathStub,
  QuestIdStub,
  QuestStub,
} from '@dungeonmaster/shared/contracts';

import { orchestrationProcessesState } from '../../../state/orchestration-processes/orchestration-processes-state';
import { OrchestrationStartupRecoveryResponder } from './orchestration-startup-recovery-responder';
import { OrchestrationStartupRecoveryResponderProxy } from './orchestration-startup-recovery-responder.proxy';

describe('OrchestrationStartupRecoveryResponder', () => {
  describe('quest recovery', () => {
    it('VALID: {guild with in_progress quest} => registers process and returns quest id', async () => {
      const guildId = GuildIdStub({ value: 'aaaaaaaa-1111-2222-3333-444444444444' });
      const guildPath = GuildPathStub({ value: '/home/user/test-guild' });
      const questId = QuestIdStub({ value: 'active-quest' });
      const quest = QuestStub({ id: questId, folder: '001-active-quest', status: 'in_progress' });
      const guildItem = GuildListItemStub({ id: guildId, path: guildPath, valid: true });

      const proxy = OrchestrationStartupRecoveryResponderProxy();
      proxy.setupGuildWithQuests({ guildId, guildPath, quests: [quest] });

      const result = await OrchestrationStartupRecoveryResponder({ guildItems: [guildItem] });

      expect(result).toStrictEqual(['active-quest']);
    });

    it('VALID: {guild with created quest} => recovers created quest', async () => {
      const guildId = GuildIdStub({ value: 'aaaaaaaa-1111-2222-3333-444444444444' });
      const guildPath = GuildPathStub({ value: '/home/user/test-guild' });
      const questId = QuestIdStub({ value: 'created-quest' });
      const quest = QuestStub({ id: questId, folder: '001-created-quest', status: 'created' });
      const guildItem = GuildListItemStub({ id: guildId, path: guildPath, valid: true });

      const proxy = OrchestrationStartupRecoveryResponderProxy();
      proxy.setupGuildWithQuests({ guildId, guildPath, quests: [quest] });

      const result = await OrchestrationStartupRecoveryResponder({ guildItems: [guildItem] });

      expect(result).toStrictEqual(['created-quest']);
    });

    it('VALID: {guild with complete quest} => skips non-recoverable quest', async () => {
      const guildId = GuildIdStub({ value: 'aaaaaaaa-1111-2222-3333-444444444444' });
      const guildPath = GuildPathStub({ value: '/home/user/test-guild' });
      const quest = QuestStub({
        id: QuestIdStub({ value: 'done-quest' }),
        folder: '001-done-quest',
        status: 'complete',
      });
      const guildItem = GuildListItemStub({ id: guildId, path: guildPath, valid: true });

      const proxy = OrchestrationStartupRecoveryResponderProxy();
      proxy.setupGuildWithQuests({ guildId, guildPath, quests: [quest] });

      const result = await OrchestrationStartupRecoveryResponder({ guildItems: [guildItem] });

      expect(result).toStrictEqual([]);
    });

    it('EMPTY: {no guild items} => returns empty array', async () => {
      OrchestrationStartupRecoveryResponderProxy();

      const result = await OrchestrationStartupRecoveryResponder({ guildItems: [] });

      expect(result).toStrictEqual([]);
    });

    it('VALID: {invalid guild} => skips invalid guild', async () => {
      const guildItem = GuildListItemStub({ valid: false });

      OrchestrationStartupRecoveryResponderProxy();

      const result = await OrchestrationStartupRecoveryResponder({ guildItems: [guildItem] });

      expect(result).toStrictEqual([]);
    });
  });

  describe('orchestration loop launch', () => {
    it('VALID: {recoverable quest} => registers process with abort-capable kill handle', async () => {
      const guildId = GuildIdStub({ value: 'aaaaaaaa-1111-2222-3333-444444444444' });
      const guildPath = GuildPathStub({ value: '/home/user/test-guild' });
      const questId = QuestIdStub({ value: 'progress-quest' });
      const quest = QuestStub({ id: questId, folder: '001-progress-quest', status: 'in_progress' });
      const guildItem = GuildListItemStub({ id: guildId, path: guildPath, valid: true });

      const proxy = OrchestrationStartupRecoveryResponderProxy();
      proxy.setupGuildWithQuests({ guildId, guildPath, quests: [quest] });

      await OrchestrationStartupRecoveryResponder({ guildItems: [guildItem] });

      const processIds = proxy.getRegisteredProcessIds();

      expect(processIds).toStrictEqual(['proc-recovery-f47ac10b-58cc-4372-a567-0e02b2c3d479']);

      const process = orchestrationProcessesState.get({ processId: processIds[0]! });

      expect(process?.questId).toBe('progress-quest');
    });
  });
});
