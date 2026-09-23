import type { GuildStub, QuestStub } from '@dungeonmaster/shared/contracts';
import { SavedRecordNameStub } from '@dungeonmaster/hydration/contracts';

import { fileTargetHarness } from '../../../../test/harnesses/file-target/file-target.harness';
import { dmRegistryBroker } from '../../dm/registry/dm-registry-broker';
import { recipesGuildMidExecutionBroker } from './recipes-guild-mid-execution-broker';

type Guild = ReturnType<typeof GuildStub>;
type Quest = ReturnType<typeof QuestStub>;

const { run } = dmRegistryBroker;

const GUILD_NAME = SavedRecordNameStub({ value: 'guild' });
const QUEST1_NAME = SavedRecordNameStub({ value: 'quest1' });
const QUEST2_NAME = SavedRecordNameStub({ value: 'quest2' });
const QUEST3_NAME = SavedRecordNameStub({ value: 'quest3' });

describe('recipesGuildMidExecutionBroker', () => {
  describe('the manifest identity chunk 8 reads off this same export', () => {
    it('VALID: {} => carries its verbatim name, description, and no inputs', () => {
      expect({
        recipeName: recipesGuildMidExecutionBroker.recipeName,
        description: recipesGuildMidExecutionBroker.description,
        inputs: recipesGuildMidExecutionBroker.inputs,
      }).toStrictEqual({
        recipeName: 'guild-mid-execution',
        description:
          'one guild holding three quests — the first running with its riftcarver item dropped, ' +
          'the second and third both freshly created and told apart only by their seeded title ' +
          'and request text ("Quest 2"/"Quest 3")',
        inputs: undefined,
      });
    });
  });

  describe('run against a real temporary directory', () => {
    const fileTarget = fileTargetHarness();

    it('VALID: {} => saves exactly guild, quest1, quest2 and quest3', async () => {
      const result = await run(recipesGuildMidExecutionBroker(), fileTarget.target());

      expect(Object.keys(result).sort()).toStrictEqual(['guild', 'quest1', 'quest2', 'quest3']);
    });

    it('VALID: {} => the guild record carries the derived name and a real url slug', async () => {
      const result = await run(recipesGuildMidExecutionBroker(), fileTarget.target());
      const guild = result[GUILD_NAME] as unknown as Guild;

      expect({ name: guild.name, urlSlug: guild.urlSlug }).toStrictEqual({
        name: 'Guild 1',
        urlSlug: 'guild-1',
      });
    });

    it('VALID: {} => the three quests read back with the titles defaults(index) and set() produced', async () => {
      const result = await run(recipesGuildMidExecutionBroker(), fileTarget.target());
      const quest1 = result[QUEST1_NAME] as unknown as Quest;
      const quest2 = result[QUEST2_NAME] as unknown as Quest;
      const quest3 = result[QUEST3_NAME] as unknown as Quest;

      expect([quest1.title, quest2.title, quest3.title]).toStrictEqual([
        'The running one',
        'Quest 2',
        'Quest 3',
      ]);
    });

    it('VALID: {} => the second and third quests are NOT byte-identical — status matches by design, title and userRequest do not', async () => {
      const result = await run(recipesGuildMidExecutionBroker(), fileTarget.target());
      const quest2 = result[QUEST2_NAME] as unknown as Quest;
      const quest3 = result[QUEST3_NAME] as unknown as Quest;

      expect({
        sameStatus: quest2.status === quest3.status,
        title2: quest2.title,
        title3: quest3.title,
        userRequest2: quest2.userRequest,
        userRequest3: quest3.userRequest,
      }).toStrictEqual({
        sameStatus: true,
        title2: 'Quest 2',
        title3: 'Quest 3',
        userRequest2: 'seeded quest 2',
        userRequest3: 'seeded quest 3',
      });
    });

    it('VALID: {} => on disk, the first quest is in_progress with the riftcarver operation dropped from its ledger', async () => {
      const result = await run(recipesGuildMidExecutionBroker(), fileTarget.target());
      const guild = result[GUILD_NAME] as unknown as Guild;
      const quest1 = result[QUEST1_NAME] as unknown as Quest;

      const operationsOnDisk = fileTarget.readQuestFileOperations({
        guildId: guild.id,
        questFolder: quest1.folder,
      });
      const rolesOnDisk = operationsOnDisk.map((operation) => operation.role);

      expect({ status: quest1.status, rolesOnDisk }).toStrictEqual({
        status: 'in_progress',
        rolesOnDisk: ['codeweaver', 'ward', 'flowrider', 'siegemaster'],
      });
    });

    it("VALID: {} => on disk, the second and third quests' ledgers stay empty — the scope rule", async () => {
      const result = await run(recipesGuildMidExecutionBroker(), fileTarget.target());
      const guild = result[GUILD_NAME] as unknown as Guild;
      const quest2 = result[QUEST2_NAME] as unknown as Quest;
      const quest3 = result[QUEST3_NAME] as unknown as Quest;

      const rolesOnDisk2 = fileTarget
        .readQuestFileOperations({ guildId: guild.id, questFolder: quest2.folder })
        .map((operation) => operation.role);
      const rolesOnDisk3 = fileTarget
        .readQuestFileOperations({ guildId: guild.id, questFolder: quest3.folder })
        .map((operation) => operation.role);

      expect({ rolesOnDisk2, rolesOnDisk3 }).toStrictEqual({
        rolesOnDisk2: [],
        rolesOnDisk3: [],
      });
    });
  });
});
