import { AbsoluteFilePathStub, ContentTextStub, GuildStub } from '@dungeonmaster/shared/contracts';
import { RecipeNameStub } from '@dungeonmaster/siegelense-recipes/contracts';

import { recipeSeedRunBroker } from './recipe-seed-run-broker';
import { recipeSeedRunBrokerProxy } from './recipe-seed-run-broker.proxy';

const API = 'http://dungeonmaster.localhost:41001';
const HOME = '/tmp/dm-siege-inst_seed';
const GUILD_ID = '7306b468-0f2d-4a5e-9c3b-2d1e8f0a6b41';
const MINTED_QUEST_IDS = [
  'aaaaaaaa-1111-4111-8111-111111111111',
  'bbbbbbbb-2222-4222-8222-222222222222',
  'cccccccc-3333-4333-8333-333333333333',
];

describe('recipeSeedRunBroker', () => {
  describe('resolving through the book the listing reads', () => {
    it('VALID: {guild-with-three-quests, no parameters} => runs it and returns exactly its declared ids', async () => {
      const proxy = recipeSeedRunBrokerProxy();
      proxy.bookPresent();
      proxy.guildLaneAnswers({
        apiBaseUrl: ContentTextStub({ value: API }),
        guild: GuildStub({
          id: GUILD_ID,
          name: 'Siege Guild',
          path: `${HOME}/siege-repo`,
          urlSlug: 'siege-guild',
        }),
        questIds: MINTED_QUEST_IDS.map((value) => ContentTextStub({ value })),
      });

      const result = await recipeSeedRunBroker({
        recipe: RecipeNameStub({ value: 'guild-with-three-quests' }),
        apiBaseUrl: ContentTextStub({ value: API }),
        homePath: AbsoluteFilePathStub({ value: HOME }),
        parameters: {},
      });

      expect(result).toStrictEqual({
        guildId: GUILD_ID,
        guildSlug: 'siege-guild',
        questId: 'bbbbbbbb-2222-4222-8222-222222222222',
      });
    });

    it('ERROR: {a name the book does not declare} => throws listing the whole book', async () => {
      const proxy = recipeSeedRunBrokerProxy();
      proxy.bookPresent();

      await expect(
        recipeSeedRunBroker({
          recipe: RecipeNameStub({ value: 'guild-with-four-quests' }),
          apiBaseUrl: ContentTextStub({ value: API }),
          homePath: AbsoluteFilePathStub({ value: HOME }),
          parameters: {},
        }),
      ).rejects.toThrow(
        'UNKNOWN RECIPE: "guild-with-four-quests" is not in the recipe book. Declared: guild-with-three-quests, session-with-nested-subagent. Run `dungeonmaster siegelense recipes` for each one\'s produces: line and fidelity.',
      );
    });

    it('ERROR: {the recipes package is absent} => the book read refuses before anything runs', async () => {
      const proxy = recipeSeedRunBrokerProxy();
      proxy.bookMissing();

      await expect(
        recipeSeedRunBroker({
          recipe: RecipeNameStub({ value: 'guild-with-three-quests' }),
          apiBaseUrl: ContentTextStub({ value: API }),
          homePath: AbsoluteFilePathStub({ value: HOME }),
          parameters: {},
        }),
      ).rejects.toThrow(/No recipes package at/u);
    });
  });

  describe('grading the parameters against the manifest', () => {
    it('ERROR: {session-with-nested-subagent with no guild} => throws naming the missing parameter', async () => {
      const proxy = recipeSeedRunBrokerProxy();
      proxy.bookPresent();

      await expect(
        recipeSeedRunBroker({
          recipe: RecipeNameStub({ value: 'session-with-nested-subagent' }),
          apiBaseUrl: ContentTextStub({ value: API }),
          homePath: AbsoluteFilePathStub({ value: HOME }),
          parameters: {},
        }),
      ).rejects.toThrow(
        'RECIPE PARAMETERS: "session-with-nested-subagent" was called with parameters it cannot take. Missing: guild. It declares: guild. Parameters are written as top-level keys on the step — { "step": "seed", "recipe": "session-with-nested-subagent", "guild": "{g.guildId}", "as": "s" }.',
      );
    });

    it('ERROR: {a misspelled parameter key} => throws naming the typo', async () => {
      const proxy = recipeSeedRunBrokerProxy();
      proxy.bookPresent();

      await expect(
        recipeSeedRunBroker({
          recipe: RecipeNameStub({ value: 'session-with-nested-subagent' }),
          apiBaseUrl: ContentTextStub({ value: API }),
          homePath: AbsoluteFilePathStub({ value: HOME }),
          parameters: { gild: ContentTextStub({ value: GUILD_ID }) },
        }),
      ).rejects.toThrow(
        'RECIPE PARAMETERS: "session-with-nested-subagent" was called with parameters it cannot take. Missing: guild. Not a parameter of this recipe: gild. It declares: guild. Parameters are written as top-level keys on the step — { "step": "seed", "recipe": "session-with-nested-subagent", "guild": "{g.guildId}", "as": "s" }.',
      );
    });

    it('ERROR: {a parameter on a recipe that takes none} => throws naming it', async () => {
      const proxy = recipeSeedRunBrokerProxy();
      proxy.bookPresent();

      await expect(
        recipeSeedRunBroker({
          recipe: RecipeNameStub({ value: 'guild-with-three-quests' }),
          apiBaseUrl: ContentTextStub({ value: API }),
          homePath: AbsoluteFilePathStub({ value: HOME }),
          parameters: { guild: ContentTextStub({ value: GUILD_ID }) },
        }),
      ).rejects.toThrow(
        'RECIPE PARAMETERS: "guild-with-three-quests" was called with parameters it cannot take. Not a parameter of this recipe: guild. It declares: (none). Parameters are written as top-level keys on the step — { "step": "seed", "recipe": "guild-with-three-quests", "guild": "{g.guildId}", "as": "s" }.',
      );
    });
  });
});
