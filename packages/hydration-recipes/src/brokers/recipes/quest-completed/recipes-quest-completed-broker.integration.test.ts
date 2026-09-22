import type { GuildStub, QuestStub } from '@dungeonmaster/shared/contracts';
import { SavedRecordNameStub } from '@dungeonmaster/hydration/contracts';

import { fileTargetHarness } from '../../../../test/harnesses/file-target/file-target.harness';
import { dmRegistryBroker } from '../../dm/registry/dm-registry-broker';
import { recipesQuestCompletedBroker } from './recipes-quest-completed-broker';

type Guild = ReturnType<typeof GuildStub>;
type Quest = ReturnType<typeof QuestStub>;

const { run } = dmRegistryBroker;

const GUILD_NAME = SavedRecordNameStub({ value: 'guild' });
const QUEST_NAME = SavedRecordNameStub({ value: 'quest' });

describe('recipesQuestCompletedBroker', () => {
  describe('the manifest identity chunk 8 reads off this same export', () => {
    it('VALID: {} => carries its verbatim name, description, and no inputs', () => {
      expect({
        recipeName: recipesQuestCompletedBroker.recipeName,
        description: recipesQuestCompletedBroker.description,
        inputs: recipesQuestCompletedBroker.inputs,
      }).toStrictEqual({
        recipeName: 'quest-completed',
        description:
          'one guild holding one completed quest with all workflow operations and work items finished',
        inputs: undefined,
      });
    });
  });

  describe('run against a real temporary directory', () => {
    const fileTarget = fileTargetHarness();

    it('VALID: {} => saves guild and quest', async () => {
      const result = await run(recipesQuestCompletedBroker(), fileTarget.target());

      expect(Object.keys(result).sort()).toStrictEqual(['guild', 'quest']);
    });

    it('VALID: {} => quest is complete with title "Verified Flow"', async () => {
      const result = await run(recipesQuestCompletedBroker(), fileTarget.target());
      const quest = result[QUEST_NAME] as unknown as Quest;

      expect({ status: quest.status, title: quest.title }).toStrictEqual({
        status: 'complete',
        title: 'Verified Flow',
      });
    });

    it('VALID: {} => on disk, the quest has codeweaver and ward operations in its ledger, both complete', async () => {
      const result = await run(recipesQuestCompletedBroker(), fileTarget.target());
      const guild = result[GUILD_NAME] as unknown as Guild;
      const quest = result[QUEST_NAME] as unknown as Quest;

      const operationsOnDisk = fileTarget.readQuestFileOperations({
        guildId: guild.id,
        questFolder: quest.folder,
      });

      expect(
        operationsOnDisk.map((operation) => ({ role: operation.role, status: operation.status })),
      ).toStrictEqual([
        { role: 'codeweaver', status: 'complete' },
        { role: 'ward', status: 'complete' },
      ]);
    });

    it('VALID: {} => the quest carries two work items, one per operation, both in a terminal complete state', async () => {
      const result = await run(recipesQuestCompletedBroker(), fileTarget.target());
      const quest = result[QUEST_NAME] as unknown as Quest;

      expect(
        quest.workItems.map((workItem) => ({
          role: workItem.role,
          status: workItem.status,
          spawnerType: workItem.spawnerType,
        })),
      ).toStrictEqual([
        { role: 'codeweaver', status: 'complete', spawnerType: 'agent' },
        { role: 'ward', status: 'complete', spawnerType: 'command' },
      ]);
    });
  });
});
