import { SavedRecordNameStub } from '@dungeonmaster/hydration/contracts';
import type { QuestStub } from '@dungeonmaster/shared/contracts';
import type { GuildStub } from '@dungeonmaster/shared/contracts';

import { fileTargetHarness } from '../../test/harnesses/file-target/file-target.harness';
import { StartHydrationRecipes } from './start-hydration-recipes';

type Guild = ReturnType<typeof GuildStub>;
type Quest = ReturnType<typeof QuestStub>;

const UNUSED_HOME = '/tmp/start-hydration-recipes-unused';
const GUILD_NAME = SavedRecordNameStub({ value: 'guild' });
const QUEST1_NAME = SavedRecordNameStub({ value: 'quest1' });
const QUEST2_NAME = SavedRecordNameStub({ value: 'quest2' });
const QUEST3_NAME = SavedRecordNameStub({ value: 'quest3' });

describe('StartHydrationRecipes', () => {
  describe('wiring to recipes flow', () => {
    it('VALID: listing() => delegates to flow and returns listing of recipes', () => {
      const listing = StartHydrationRecipes.listing();

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

    it('INVALID: seed({recipeName: "no-such-recipe"}) => delegates to flow and throws unknown recipe error', async () => {
      await expect(
        StartHydrationRecipes.seed({ recipeName: 'no-such-recipe', home: UNUSED_HOME }),
      ).rejects.toThrow(
        /^recipesSeedRunBroker: unknown recipe 'no-such-recipe' — known recipes: guild-empty, guild-with-three-quests, guild-mid-execution, quest-advances-one-step, quest-completed, session-single-turn, session-with-nested-chain, guild-active-suite$/u,
      );
    });
  });

  describe('wiring to real execution on disk', () => {
    const fileTarget = fileTargetHarness();

    it('VALID: seed({recipeName: "guild-mid-execution", home}) => creates guild and quests on disk', async () => {
      const result = await StartHydrationRecipes.seed({
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
