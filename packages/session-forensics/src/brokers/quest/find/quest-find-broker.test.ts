import { questFindBroker } from './quest-find-broker';
import { questFindBrokerProxy } from './quest-find-broker.proxy';
import { QuestIdStub } from '@dungeonmaster/shared/contracts';

describe('questFindBroker', () => {
  describe('found in a single candidate root', () => {
    it('VALID: {quest under repo-local .dungeonmaster} => returns that quest.json path', () => {
      const proxy = questFindBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const guildId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

      proxy.setupQuestAt({ root: 'repoLocal', guildId, questId });

      const result = questFindBroker({ questId });

      expect(result).toBe(
        '/repo/.dungeonmaster/guilds/f47ac10b-58cc-4372-a567-0e02b2c3d479/quests/add-auth/quest.json',
      );
    });

    it('VALID: {quest under .dungeonmaster-dev, repo-local has an unrelated guild} => returns the dev quest.json path', () => {
      const proxy = questFindBrokerProxy();
      const questId = QuestIdStub({ value: 'fix-bug' });
      const guildId = 'a1111111-1111-1111-1111-111111111111';

      proxy.setupGuildsWithoutQuest({
        root: 'repoLocal',
        guildIds: ['b2222222-2222-2222-2222-222222222222'],
      });
      proxy.setupQuestAt({ root: 'dev', guildId, questId });

      const result = questFindBroker({ questId });

      expect(result).toBe(
        '/repo/.dungeonmaster-dev/guilds/a1111111-1111-1111-1111-111111111111/quests/fix-bug/quest.json',
      );
    });

    it('VALID: {quest under DUNGEONMASTER_HOME, repo-local and dev miss} => returns the env-home quest.json path', () => {
      const proxy = questFindBrokerProxy();
      const questId = QuestIdStub({ value: 'refactor-auth' });
      const guildId = 'c3333333-3333-3333-3333-333333333333';

      proxy.setupQuestAt({ root: 'envHome', guildId, questId });

      const result = questFindBroker({ questId });

      expect(result).toBe(
        '/env/dungeonmaster-home/guilds/c3333333-3333-3333-3333-333333333333/quests/refactor-auth/quest.json',
      );
    });

    it('VALID: {quest under ~/.dungeonmaster, first three roots miss} => returns the user-global quest.json path', () => {
      const proxy = questFindBrokerProxy();
      const questId = QuestIdStub({ value: 'add-logging' });
      const guildId = 'd4444444-4444-4444-4444-444444444444';

      proxy.setupQuestAt({ root: 'userGlobal', guildId, questId });

      const result = questFindBroker({ questId });

      expect(result).toBe(
        '/home/testuser/.dungeonmaster/guilds/d4444444-4444-4444-4444-444444444444/quests/add-logging/quest.json',
      );
    });
  });

  describe('ordering across roots', () => {
    it('EDGE: {quest present under both repo-local and user-global} => repo-local path wins', () => {
      const proxy = questFindBrokerProxy();
      const questId = QuestIdStub({ value: 'shared-id' });

      proxy.setupQuestAt({
        root: 'repoLocal',
        guildId: 'e5555555-5555-5555-5555-555555555555',
        questId,
      });
      proxy.setupQuestAt({
        root: 'userGlobal',
        guildId: 'f6666666-6666-6666-6666-666666666666',
        questId,
      });

      const result = questFindBroker({ questId });

      expect(result).toBe(
        '/repo/.dungeonmaster/guilds/e5555555-5555-5555-5555-555555555555/quests/shared-id/quest.json',
      );
    });

    it('EDGE: {repo-local root does not exist on disk} => skipped without throwing, dev root still found', () => {
      const proxy = questFindBrokerProxy();
      const questId = QuestIdStub({ value: 'missing-root-quest' });
      const guildId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

      proxy.setupQuestAt({ root: 'dev', guildId, questId });

      const result = questFindBroker({ questId });

      expect(result).toBe(
        '/repo/.dungeonmaster-dev/guilds/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/quests/missing-root-quest/quest.json',
      );
    });
  });

  describe('multiple guilds under one root', () => {
    it('EDGE: {guilds dir holds three guilds, quest under the third} => returns that quest.json path', () => {
      const proxy = questFindBrokerProxy();
      const questId = QuestIdStub({ value: 'third-guild-quest' });

      proxy.setupQuestAt({
        root: 'repoLocal',
        guildId: '99999999-9999-9999-9999-999999999999',
        questId,
        decoyGuildIds: [
          '11111111-1111-1111-1111-111111111111',
          '22222222-2222-2222-2222-222222222222',
        ],
      });

      const result = questFindBroker({ questId });

      expect(result).toBe(
        '/repo/.dungeonmaster/guilds/99999999-9999-9999-9999-999999999999/quests/third-guild-quest/quest.json',
      );
    });
  });

  describe('DUNGEONMASTER_HOME edge states', () => {
    it('EMPTY: {DUNGEONMASTER_HOME unset} => that root is skipped without crashing', () => {
      const proxy = questFindBrokerProxy();
      const questId = QuestIdStub({ value: 'unset-env-quest' });

      proxy.setupNoQuestAnywhere();

      const result = questFindBroker({ questId });

      expect(result).toBe(undefined);
    });

    it("EMPTY: {DUNGEONMASTER_HOME: ''} => treated as unset, falls through to ~/.dungeonmaster", () => {
      const proxy = questFindBrokerProxy();
      const questId = QuestIdStub({ value: 'empty-env-quest' });
      const guildId = '88888888-8888-8888-8888-888888888888';

      proxy.setupHomeEnvEmptyString();
      proxy.setupQuestAt({ root: 'userGlobal', guildId, questId });

      const result = questFindBroker({ questId });

      expect(result).toBe(
        '/home/testuser/.dungeonmaster/guilds/88888888-8888-8888-8888-888888888888/quests/empty-env-quest/quest.json',
      );
    });
  });

  describe('no match anywhere', () => {
    it('EMPTY: {no root anywhere holds the quest} => returns undefined', () => {
      const proxy = questFindBrokerProxy();
      const questId = QuestIdStub({ value: 'missing-everywhere' });

      proxy.setupGuildsWithoutQuest({
        root: 'repoLocal',
        guildIds: ['44444444-4444-4444-4444-444444444444'],
      });
      proxy.setupGuildsWithoutQuest({
        root: 'dev',
        guildIds: ['55555555-5555-5555-5555-555555555555'],
      });
      proxy.setupGuildsWithoutQuest({
        root: 'userGlobal',
        guildIds: ['77777777-7777-7777-7777-777777777777'],
      });

      const result = questFindBroker({ questId });

      expect(result).toBe(undefined);
    });
  });
});
