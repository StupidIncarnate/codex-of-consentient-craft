import { ContentTextStub, GuildStub } from '@dungeonmaster/shared/contracts';
import { RecipeNameStub } from '@dungeonmaster/siegelense-recipes/contracts';

import { LaneSessionStub } from '../../../contracts/lane-session/lane-session.stub';
import { SeedBindingNameStub } from '../../../contracts/seed-binding-name/seed-binding-name.stub';
import { stepSeedBroker } from './step-seed-broker';
import { stepSeedBrokerProxy } from './step-seed-broker.proxy';

const API_PORT = 41001;
const API = `http://dungeonmaster.localhost:${String(API_PORT)}`;
const HOME = '/tmp/dm-siege-inst_seed';
const GUILD_ID = '7306b468-0f2d-4a5e-9c3b-2d1e8f0a6b41';
const MINTED_QUEST_IDS = [
  'aaaaaaaa-1111-4111-8111-111111111111',
  'bbbbbbbb-2222-4222-8222-222222222222',
  'cccccccc-3333-4333-8333-333333333333',
];

describe('stepSeedBroker', () => {
  describe('the reading it returns', () => {
    it("VALID: {guild-with-three-quests} => the reading is the recipe's ids as JSON", async () => {
      const proxy = stepSeedBrokerProxy();
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

      const reading = await stepSeedBroker({
        lane: LaneSessionStub({ homePath: HOME, ports: { api: API_PORT, web: API_PORT + 1 } }),
        recipe: RecipeNameStub({ value: 'guild-with-three-quests' }),
        parameters: {},
        as: null,
        recordBinding: (): void => undefined,
      });

      expect(reading).toBe(
        '{"guildId":"7306b468-0f2d-4a5e-9c3b-2d1e8f0a6b41","guildSlug":"siege-guild","questId":"bbbbbbbb-2222-4222-8222-222222222222"}',
      );
    });
  });

  describe('the binding it records', () => {
    it('VALID: {as: g} => records the ids under g', async () => {
      const proxy = stepSeedBrokerProxy();
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
      const recorded = jest.fn();

      await stepSeedBroker({
        lane: LaneSessionStub({ homePath: HOME, ports: { api: API_PORT, web: API_PORT + 1 } }),
        recipe: RecipeNameStub({ value: 'guild-with-three-quests' }),
        parameters: {},
        as: SeedBindingNameStub({ value: 'g' }),
        recordBinding: recorded,
      });

      expect(recorded).toHaveBeenCalledTimes(1);
      expect(recorded).toHaveBeenCalledWith({
        name: 'g',
        result: {
          guildId: GUILD_ID,
          guildSlug: 'siege-guild',
          questId: 'bbbbbbbb-2222-4222-8222-222222222222',
        },
      });
    });

    it('VALID: {as: null} => the recipe still runs and nothing is recorded', async () => {
      const proxy = stepSeedBrokerProxy();
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
      const recorded = jest.fn();

      const reading = await stepSeedBroker({
        lane: LaneSessionStub({ homePath: HOME, ports: { api: API_PORT, web: API_PORT + 1 } }),
        recipe: RecipeNameStub({ value: 'guild-with-three-quests' }),
        parameters: {},
        as: null,
        recordBinding: recorded,
      });

      expect(recorded).toHaveBeenCalledTimes(0);
      expect(reading).toBe(
        '{"guildId":"7306b468-0f2d-4a5e-9c3b-2d1e8f0a6b41","guildSlug":"siege-guild","questId":"bbbbbbbb-2222-4222-8222-222222222222"}',
      );
    });
  });

  describe('which origin it reaches', () => {
    it('VALID: {a lane whose api port is 41001} => the recipe calls the API port, never the web one', async () => {
      const proxy = stepSeedBrokerProxy();
      proxy.bookPresent();
      // Staged ONLY against the api origin. A broker reaching the web port instead would find
      // nothing staged and the mock would throw naming the address it was asked for.
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

      const reading = await stepSeedBroker({
        lane: LaneSessionStub({
          homePath: HOME,
          ports: { api: API_PORT, web: API_PORT + 1 },
          baseUrl: `http://dungeonmaster.localhost:${String(API_PORT + 1)}`,
        }),
        recipe: RecipeNameStub({ value: 'guild-with-three-quests' }),
        parameters: {},
        as: null,
        recordBinding: (): void => undefined,
      });

      expect(reading).toBe(
        '{"guildId":"7306b468-0f2d-4a5e-9c3b-2d1e8f0a6b41","guildSlug":"siege-guild","questId":"bbbbbbbb-2222-4222-8222-222222222222"}',
      );
    });
  });

  describe('a browserless lane', () => {
    it('VALID: {lane.browser === null} => the recipe still runs, because seed touches no screen', async () => {
      const proxy = stepSeedBrokerProxy();
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

      const reading = await stepSeedBroker({
        lane: LaneSessionStub({
          homePath: HOME,
          ports: { api: API_PORT, web: API_PORT + 1 },
          browser: null,
        }),
        recipe: RecipeNameStub({ value: 'guild-with-three-quests' }),
        parameters: {},
        as: null,
        recordBinding: (): void => undefined,
      });

      expect(reading).toBe(
        '{"guildId":"7306b468-0f2d-4a5e-9c3b-2d1e8f0a6b41","guildSlug":"siege-guild","questId":"bbbbbbbb-2222-4222-8222-222222222222"}',
      );
    });
  });
});
