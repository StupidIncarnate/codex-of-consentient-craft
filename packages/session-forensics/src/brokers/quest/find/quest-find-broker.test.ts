import { GuildIdStub } from '@dungeonmaster/shared/contracts/guild-id/guild-id.stub';
import { questFindBroker } from './quest-find-broker';
import { questFindBrokerProxy } from './quest-find-broker.proxy';
import { QuestIdStub } from '@dungeonmaster/shared/contracts/quest-id/quest-id.stub';

describe('questFindBroker', () => {
  describe('found in a single candidate root', () => {
    it('VALID: {quest under repo-local .dungeonmaster} => returns that quest.json path', async () => {
      const proxy = questFindBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const guildId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

      proxy.setupQuestAt({ root: 'repoLocal', guildId: GuildIdStub({ value: guildId }), questId });

      const result = await questFindBroker({ questId });

      expect(result).toBe(
        '/repo/.dungeonmaster/guilds/f47ac10b-58cc-4372-a567-0e02b2c3d479/quests/add-auth/quest.json',
      );
    });

    it('VALID: {quest under .dungeonmaster-dev, repo-local has an unrelated guild} => returns the dev quest.json path', async () => {
      const proxy = questFindBrokerProxy();
      const questId = QuestIdStub({ value: 'fix-bug' });
      const guildId = 'bb31df1a-53e9-7497-9c56-d3e719f494dd';

      proxy.setupGuildsWithoutQuest({
        root: 'repoLocal',
        guildIds: ['b2222222-2222-2222-2222-222222222222'],
        questId,
      });
      proxy.setupQuestAt({ root: 'dev', guildId: GuildIdStub({ value: guildId }), questId });

      const result = await questFindBroker({ questId });

      expect(result).toBe(
        '/repo/.dungeonmaster-dev/guilds/bb31df1a-53e9-7497-9c56-d3e719f494dd/quests/fix-bug/quest.json',
      );
    });

    it('VALID: {quest under DUNGEONMASTER_HOME, repo-local and dev miss} => returns the env-home quest.json path', async () => {
      const proxy = questFindBrokerProxy();
      const questId = QuestIdStub({ value: 'refactor-auth' });
      const guildId = '27a2b0ed-7dfc-24b9-a7b9-eea7daeda4f4';

      proxy.setupQuestAt({ root: 'envHome', guildId: GuildIdStub({ value: guildId }), questId });

      const result = await questFindBroker({ questId });

      expect(result).toBe(
        '/env/dungeonmaster-home/guilds/27a2b0ed-7dfc-24b9-a7b9-eea7daeda4f4/quests/refactor-auth/quest.json',
      );
    });

    it('VALID: {quest under ~/.dungeonmaster, first three roots miss} => returns the user-global quest.json path', async () => {
      const proxy = questFindBrokerProxy();
      const questId = QuestIdStub({ value: 'add-logging' });
      const guildId = 'c8fe9bf4-8af5-5022-9935-53917347c017';

      proxy.setupQuestAt({ root: 'userGlobal', guildId: GuildIdStub({ value: guildId }), questId });

      const result = await questFindBroker({ questId });

      expect(result).toBe(
        '/home/testuser/.dungeonmaster/guilds/c8fe9bf4-8af5-5022-9935-53917347c017/quests/add-logging/quest.json',
      );
    });
  });

  describe('ordering across roots', () => {
    it('EDGE: {quest present under both repo-local and user-global} => repo-local path wins', async () => {
      const proxy = questFindBrokerProxy();
      const questId = QuestIdStub({ value: 'shared-id' });

      proxy.setupQuestAt({
        root: 'repoLocal',
        guildId: GuildIdStub({ value: '5835facb-dad2-2910-81e6-934f831a086a' }),
        questId,
      });
      proxy.setupQuestAt({
        root: 'userGlobal',
        guildId: GuildIdStub({ value: '690af1a3-bece-75a4-96db-4203a4c95524' }),
        questId,
      });

      const result = await questFindBroker({ questId });

      expect(result).toBe(
        '/repo/.dungeonmaster/guilds/5835facb-dad2-2910-81e6-934f831a086a/quests/shared-id/quest.json',
      );
    });

    it('EDGE: {repo-local root does not exist on disk} => skipped without throwing, dev root still found', async () => {
      const proxy = questFindBrokerProxy();
      const questId = QuestIdStub({ value: 'missing-root-quest' });
      const guildId = 'e4a1c2fd-8bcf-83b0-ba4b-1818d51fc09c';

      proxy.setupQuestAt({ root: 'dev', guildId: GuildIdStub({ value: guildId }), questId });

      const result = await questFindBroker({ questId });

      expect(result).toBe(
        '/repo/.dungeonmaster-dev/guilds/e4a1c2fd-8bcf-83b0-ba4b-1818d51fc09c/quests/missing-root-quest/quest.json',
      );
    });
  });

  describe('running from a package subdirectory', () => {
    it('VALID: {cwd in package subdirectory} => resolves repo root and finds the quest', async () => {
      const proxy = questFindBrokerProxy();
      const questId = QuestIdStub({ value: 'sub-dir-quest' });
      const guildId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

      proxy.setupCwdSubdirectory({ subdirectory: '/repo/packages/session-forensics' });
      proxy.setupQuestAt({ root: 'repoLocal', guildId: GuildIdStub({ value: guildId }), questId });

      const result = await questFindBroker({ questId });

      expect(result).toBe(
        '/repo/.dungeonmaster/guilds/f47ac10b-58cc-4372-a567-0e02b2c3d479/quests/sub-dir-quest/quest.json',
      );
    });
  });

  describe('running outside a repo', () => {
    it('VALID: {repo root not found} => skips repo roots and finds quest in user-global home', async () => {
      const proxy = questFindBrokerProxy();
      const questId = QuestIdStub({ value: 'global-quest' });
      const guildId = 'c8fe9bf4-8af5-5022-9935-53917347c017';

      proxy.setupRepoRootNotFound();
      proxy.setupQuestAt({ root: 'userGlobal', guildId: GuildIdStub({ value: guildId }), questId });

      const result = await questFindBroker({ questId });

      expect(result).toBe(
        '/home/testuser/.dungeonmaster/guilds/c8fe9bf4-8af5-5022-9935-53917347c017/quests/global-quest/quest.json',
      );
    });
  });

  describe('multiple guilds under one root', () => {
    it('EDGE: {guilds dir holds three guilds, quest under the third} => returns that quest.json path', async () => {
      const proxy = questFindBrokerProxy();
      const questId = QuestIdStub({ value: 'third-guild-quest' });

      proxy.setupQuestAt({
        root: 'repoLocal',
        guildId: GuildIdStub({ value: 'a979fd6f-6969-1e05-b65b-fd78e7c13ea6' }),
        questId,
        decoyGuildIds: [
          '38c6cbd2-8bf1-6507-8d07-0980dd1fb595',
          '1c27ba90-c110-14f0-94be-250818fd3443',
        ],
      });

      const result = await questFindBroker({ questId });

      expect(result).toBe(
        '/repo/.dungeonmaster/guilds/a979fd6f-6969-1e05-b65b-fd78e7c13ea6/quests/third-guild-quest/quest.json',
      );
    });
  });

  describe('DUNGEONMASTER_HOME edge states', () => {
    it('EMPTY: {DUNGEONMASTER_HOME unset} => that root is skipped without crashing', async () => {
      const proxy = questFindBrokerProxy();
      const questId = QuestIdStub({ value: 'unset-env-quest' });

      proxy.setupNoQuestAnywhere();

      const result = await questFindBroker({ questId });

      expect(result).toBe(undefined);
    });

    it("EMPTY: {DUNGEONMASTER_HOME: ''} => treated as unset, falls through to ~/.dungeonmaster", async () => {
      const proxy = questFindBrokerProxy();
      const questId = QuestIdStub({ value: 'empty-env-quest' });
      const guildId = '88888888-8888-8888-8888-888888888888';

      proxy.setupHomeEnvEmptyString();
      proxy.setupQuestAt({ root: 'userGlobal', guildId: GuildIdStub({ value: guildId }), questId });

      const result = await questFindBroker({ questId });

      expect(result).toBe(
        '/home/testuser/.dungeonmaster/guilds/88888888-8888-8888-8888-888888888888/quests/empty-env-quest/quest.json',
      );
    });
  });

  describe('no match anywhere', () => {
    it('EMPTY: {no root anywhere holds the quest} => returns undefined', async () => {
      const proxy = questFindBrokerProxy();
      const questId = QuestIdStub({ value: 'missing-everywhere' });

      proxy.setupGuildsWithoutQuest({
        root: 'repoLocal',
        guildIds: ['44444444-4444-4444-4444-444444444444'],
        questId,
      });
      proxy.setupGuildsWithoutQuest({
        root: 'dev',
        guildIds: ['55555555-5555-5555-5555-555555555555'],
        questId,
      });
      proxy.setupGuildsWithoutQuest({
        root: 'userGlobal',
        guildIds: ['77777777-7777-7777-7777-777777777777'],
        questId,
      });

      const result = await questFindBroker({ questId });

      expect(result).toBe(undefined);
    });
  });
});
