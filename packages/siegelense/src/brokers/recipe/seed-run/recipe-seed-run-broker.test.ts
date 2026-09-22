import {
  AbsoluteFilePathStub,
  ContentTextStub,
  GuildStub,
  QuestStub,
} from '@dungeonmaster/shared/contracts';

import { RecipeNameStub } from '../../../contracts/recipe-name/recipe-name.stub';
import { recipeSeedRunBroker } from './recipe-seed-run-broker';
import { recipeSeedRunBrokerProxy } from './recipe-seed-run-broker.proxy';

const API = 'http://dungeonmaster.localhost:41001';
const HOME = '/tmp/dm-siege-inst_seed';
const GUILD_ID = '7306b468-0f2d-4a5e-9c3b-2d1e8f0a6b41';

describe('recipeSeedRunBroker', () => {
  describe('resolving through the dynamic recipes runner', () => {
    it('VALID: {recipe, parameters} => runs it and returns the full saved rows the real recipe produces', async () => {
      const proxy = recipeSeedRunBrokerProxy();
      proxy.bookPresent();
      const guild = GuildStub({
        id: GUILD_ID,
        name: 'Siege Guild',
        path: `${HOME}/siege-repo`,
        urlSlug: 'siege-guild',
      });
      const questCreated = QuestStub({ id: 'aaaaaaaa-1111-4111-8111-111111111111' });
      const questInProgress = QuestStub({ id: 'bbbbbbbb-2222-4222-8222-222222222222' });
      const questComplete = QuestStub({ id: 'cccccccc-3333-4333-8333-333333333333' });
      proxy.guildWithThreeQuestsAnswers({ guild, questCreated, questInProgress, questComplete });

      const result = await recipeSeedRunBroker({
        recipe: RecipeNameStub({ value: 'guild-with-three-quests' }),
        apiBaseUrl: ContentTextStub({ value: API }),
        homePath: AbsoluteFilePathStub({ value: HOME }),
        parameters: {},
      });

      expect(result).toStrictEqual({
        guild,
        questCreated,
        questInProgress,
        questComplete,
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

    it('ERROR: {a seed result matching neither shape seedResultContract accepts} => throws one clean sentence naming the recipe, never a raw ZodError array', async () => {
      const proxy = recipeSeedRunBrokerProxy();
      proxy.malformedAnswer();

      await expect(
        recipeSeedRunBroker({
          recipe: RecipeNameStub({ value: 'guild-with-three-quests' }),
          apiBaseUrl: ContentTextStub({ value: API }),
          homePath: AbsoluteFilePathStub({ value: HOME }),
          parameters: {},
        }),
      ).rejects.toThrow(
        /^recipe 'guild-with-three-quests': its seed result did not match the expected shape — /u,
      );
    });
  });
});
