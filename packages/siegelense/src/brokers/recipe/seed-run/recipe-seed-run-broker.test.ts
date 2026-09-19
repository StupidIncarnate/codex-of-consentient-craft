import { AbsoluteFilePathStub, ContentTextStub, GuildStub } from '@dungeonmaster/shared/contracts';

import { RecipeNameStub } from '../../../contracts/recipe-name/recipe-name.stub';
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
  describe('resolving through the dynamic recipes runner', () => {
    it('VALID: {recipe, parameters} => runs it and returns the declared seed ids', async () => {
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
        guildId: ContentTextStub({ value: GUILD_ID }),
        guildSlug: ContentTextStub({ value: 'siege-guild' }),
        questId: ContentTextStub({ value: 'aaaaaaaa-1111-4111-8111-111111111111' }),
      });
    });

    it('ERROR: {the recipes package is absent} => the locate broker throws', async () => {
      const proxy = recipeSeedRunBrokerProxy();
      proxy.bookMissing();

      await expect(
        recipeSeedRunBroker({
          recipe: RecipeNameStub({ value: 'guild-with-three-quests' }),
          apiBaseUrl: ContentTextStub({ value: API }),
          homePath: AbsoluteFilePathStub({ value: HOME }),
          parameters: {},
        }),
      ).rejects.toThrow(/No recipes package found at/u);
    });
  });
});
