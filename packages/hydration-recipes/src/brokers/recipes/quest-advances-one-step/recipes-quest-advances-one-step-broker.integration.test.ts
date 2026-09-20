import type { GuildStub, QuestStub } from '@dungeonmaster/shared/contracts';
import { SavedRecordNameStub } from '@dungeonmaster/hydration/contracts';

import { fileTargetHarness } from '../../../../test/harnesses/file-target/file-target.harness';
import { dmRegistryBroker } from '../../dm/registry/dm-registry-broker';
import { recipesGuildMidExecutionBroker } from '../guild-mid-execution/recipes-guild-mid-execution-broker';
import { recipesQuestAdvancesOneStepBroker } from './recipes-quest-advances-one-step-broker';

type Guild = ReturnType<typeof GuildStub>;
type Quest = ReturnType<typeof QuestStub>;

const { run } = dmRegistryBroker;

const GUILD_NAME = SavedRecordNameStub({ value: 'guild' });
const QUEST_NAME = SavedRecordNameStub({ value: 'quest' });

describe('recipesQuestAdvancesOneStepBroker', () => {
  describe('the manifest identity chunk 8 reads off this same export', () => {
    it('VALID: {} => carries its verbatim name, description, and a real inputs schema', () => {
      expect({
        recipeName: recipesQuestAdvancesOneStepBroker.recipeName,
        description: recipesQuestAdvancesOneStepBroker.description,
        hasInputs: recipesQuestAdvancesOneStepBroker.inputs !== undefined,
      }).toStrictEqual({
        recipeName: 'quest-advances-one-step',
        description:
          'one quest under an existing guild, its ledger already one operation along — the first item complete and the second running',
        hasInputs: true,
      });
    });
  });

  describe('stacked on a guild an EARLIER step made, against a real temporary directory', () => {
    const fileTarget = fileTargetHarness();

    it('VALID: {guildId from an earlier step} => saves exactly quest', async () => {
      const target = fileTarget.target();
      const earlierStep = await run(recipesGuildMidExecutionBroker(), target);
      const guild = earlierStep[GUILD_NAME] as unknown as Guild;

      const result = await run(recipesQuestAdvancesOneStepBroker({ guildId: guild.id }), target);

      expect(Object.keys(result).sort()).toStrictEqual(['quest']);
    });

    it('VALID: {guildId from an earlier step} => the quest is under THAT guild, in_progress', async () => {
      const target = fileTarget.target();
      const earlierStep = await run(recipesGuildMidExecutionBroker(), target);
      const guild = earlierStep[GUILD_NAME] as unknown as Guild;

      const result = await run(recipesQuestAdvancesOneStepBroker({ guildId: guild.id }), target);
      const quest = (result as Record<PropertyKey, unknown>)[QUEST_NAME] as Quest;

      expect({ status: quest.status, title: quest.title }).toStrictEqual({
        status: 'in_progress',
        title: 'Advancing quest',
      });
    });

    it('VALID: {guildId from an earlier step} => the ledger reads one item complete, the second running', async () => {
      const target = fileTarget.target();
      const earlierStep = await run(recipesGuildMidExecutionBroker(), target);
      const guild = earlierStep[GUILD_NAME] as unknown as Guild;

      const result = await run(recipesQuestAdvancesOneStepBroker({ guildId: guild.id }), target);
      const quest = (result as Record<PropertyKey, unknown>)[QUEST_NAME] as Quest;

      const operationsOnDisk = fileTarget.readQuestFileOperations({
        guildId: guild.id,
        questFolder: quest.folder,
      });

      expect({
        rolesOnDisk: operationsOnDisk.map((operation) => operation.role),
        statusesOnDisk: operationsOnDisk.map((operation) => operation.status),
      }).toStrictEqual({
        rolesOnDisk: ['codeweaver', 'ward'],
        statusesOnDisk: ['complete', 'in_progress'],
      });
    });
  });
});
