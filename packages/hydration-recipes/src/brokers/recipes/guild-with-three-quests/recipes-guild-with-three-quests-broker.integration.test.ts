import type { GuildStub, QuestStub } from '@dungeonmaster/shared/contracts';
import { SavedRecordNameStub } from '@dungeonmaster/hydration/contracts';

import { fileTargetHarness } from '../../../../test/harnesses/file-target/file-target.harness';
import { dmRegistryBroker } from '../../dm/registry/dm-registry-broker';
import { recipesGuildWithThreeQuestsBroker } from './recipes-guild-with-three-quests-broker';

type Guild = ReturnType<typeof GuildStub>;
type Quest = ReturnType<typeof QuestStub>;

const { run } = dmRegistryBroker;

const GUILD_NAME = SavedRecordNameStub({ value: 'guild' });
const QUEST_CREATED_NAME = SavedRecordNameStub({ value: 'questCreated' });
const QUEST_IN_PROGRESS_NAME = SavedRecordNameStub({ value: 'questInProgress' });
const QUEST_COMPLETE_NAME = SavedRecordNameStub({ value: 'questComplete' });

describe('recipesGuildWithThreeQuestsBroker', () => {
  describe('the manifest identity chunk 8 reads off this same export', () => {
    it('VALID: {} => carries its verbatim name, description, and no inputs', () => {
      expect({
        recipeName: recipesGuildWithThreeQuestsBroker.recipeName,
        description: recipesGuildWithThreeQuestsBroker.description,
        inputs: recipesGuildWithThreeQuestsBroker.inputs,
      }).toStrictEqual({
        recipeName: 'guild-with-three-quests',
        description:
          'one guild holding three quests: one created, one in_progress, and one complete',
        inputs: undefined,
      });
    });
  });

  describe('run against a real temporary directory', () => {
    const fileTarget = fileTargetHarness();

    it('VALID: {} => saves guild and all three quests', async () => {
      const result = await run(recipesGuildWithThreeQuestsBroker(), fileTarget.target());

      expect(Object.keys(result).sort()).toStrictEqual([
        'guild',
        'questComplete',
        'questCreated',
        'questInProgress',
      ]);
    });

    it('VALID: {} => the guild record carries derived name and urlSlug', async () => {
      const result = await run(recipesGuildWithThreeQuestsBroker(), fileTarget.target());
      const guild = (result as Record<PropertyKey, unknown>)[GUILD_NAME] as Guild;

      expect({ name: guild.name, urlSlug: guild.urlSlug }).toStrictEqual({
        name: 'Guild 1',
        urlSlug: 'guild-1',
      });
    });

    it('VALID: {} => the three quests have the statuses and titles configured in the plan', async () => {
      const result = await run(recipesGuildWithThreeQuestsBroker(), fileTarget.target());
      const records = result as Record<PropertyKey, unknown>;
      const questCreated = records[QUEST_CREATED_NAME] as Quest;
      const questInProgress = records[QUEST_IN_PROGRESS_NAME] as Quest;
      const questComplete = records[QUEST_COMPLETE_NAME] as Quest;

      expect({
        created: { status: questCreated.status, title: questCreated.title },
        inProgress: { status: questInProgress.status, title: questInProgress.title },
        complete: { status: questComplete.status, title: questComplete.title },
      }).toStrictEqual({
        created: { status: 'created', title: 'Setup Database' },
        inProgress: { status: 'in_progress', title: 'Implement Authentication' },
        complete: { status: 'complete', title: 'Scaffold Architecture' },
      });
    });
  });
});
