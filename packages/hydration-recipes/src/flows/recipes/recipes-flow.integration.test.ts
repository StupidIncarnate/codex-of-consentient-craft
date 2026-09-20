import { SavedRecordNameStub } from '@dungeonmaster/hydration/contracts';
import type { QuestStub } from '@dungeonmaster/shared/contracts';
import type { GuildStub } from '@dungeonmaster/shared/contracts';

import { fileTargetHarness } from '../../../test/harnesses/file-target/file-target.harness';
import { RecipesFlow } from './recipes-flow';

type Guild = ReturnType<typeof GuildStub>;
type Quest = ReturnType<typeof QuestStub>;

const UNUSED_HOME = '/tmp/recipes-flow-unused';
const GUILD_NAME = SavedRecordNameStub({ value: 'guild' });
const QUEST1_NAME = SavedRecordNameStub({ value: 'quest1' });
const QUEST2_NAME = SavedRecordNameStub({ value: 'quest2' });
const QUEST3_NAME = SavedRecordNameStub({ value: 'quest3' });

describe('RecipesFlow', () => {
  describe('listing()', () => {
    it('VALID: {} => returns all 8 registered recipes', () => {
      const listing = RecipesFlow.listing();

      expect(listing.map((entry) => entry.recipeName)).toStrictEqual([
        'guild-empty',
        'guild-with-three-quests',
        'guild-mid-execution',
        'quest-advances-one-step',
        'quest-completed',
        'session-single-turn',
        'session-with-nested-chain',
        'guild-active-suite',
      ]);
    });
  });

  describe('seed() with unknown recipe', () => {
    it('INVALID: {recipeName: "no-such-recipe"} => throws listing known recipes', async () => {
      await expect(
        RecipesFlow.seed({ recipeName: 'no-such-recipe', home: UNUSED_HOME }),
      ).rejects.toThrow(
        /^recipesSeedRunBroker: unknown recipe 'no-such-recipe' — known recipes: guild-empty, guild-with-three-quests, guild-mid-execution, quest-advances-one-step, quest-completed, session-single-turn, session-with-nested-chain, guild-active-suite$/u,
      );
    });
  });

  describe('seed() execution against filesystem', () => {
    const fileTarget = fileTargetHarness();

    it('VALID: {recipeName: "guild-mid-execution", home} => seeds real records onto disk', async () => {
      const result = await RecipesFlow.seed({
        recipeName: 'guild-mid-execution',
        home: fileTarget.target().home,
      });

      const guild = result[GUILD_NAME] as Guild;
      const quest1 = result[QUEST1_NAME] as Quest;
      const quest2 = result[QUEST2_NAME] as Quest;
      const quest3 = result[QUEST3_NAME] as Quest;

      expect({
        savedNames: Object.keys(result).sort(),
        guildName: guild.name,
        guildUrlSlug: guild.urlSlug,
        questTitles: [quest1.title, quest2.title, quest3.title],
      }).toStrictEqual({
        savedNames: ['guild', 'quest1', 'quest2', 'quest3'],
        guildName: 'Guild 1',
        guildUrlSlug: 'guild-1',
        questTitles: ['The running one', 'Quest 2', 'Quest 3'],
      });
    });
  });
});
