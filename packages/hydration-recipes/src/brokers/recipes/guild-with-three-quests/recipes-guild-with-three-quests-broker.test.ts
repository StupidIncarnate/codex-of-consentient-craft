import { ContentTextStub, GuildStub } from '@dungeonmaster/shared/contracts';

import { RecipeContextStub } from '../../../contracts/recipe-context/recipe-context.stub';
import { recipesGuildWithThreeQuestsBroker } from './recipes-guild-with-three-quests-broker';
import { recipesGuildWithThreeQuestsBrokerProxy } from './recipes-guild-with-three-quests-broker.proxy';

const API = 'http://dungeonmaster.localhost:41001';
const HOME = '/tmp/dm-siege-inst_seed';
const GUILD_PATH = '/tmp/dm-siege-inst_seed/siege-repo';
const GUILD_ID = '7306b468-0f2d-4a5e-9c3b-2d1e8f0a6b41';
const IN_PROGRESS_QUEST_ID = 'bbbbbbbb-2222-4222-8222-222222222222';
const USER_REQUEST =
  'Seeded by the guild-with-three-quests recipe. Nothing here was written by an agent.';

const MINTED_QUEST_IDS = [
  'aaaaaaaa-1111-4111-8111-111111111111',
  IN_PROGRESS_QUEST_ID,
  'cccccccc-3333-4333-8333-333333333333',
];

describe('recipesGuildWithThreeQuestsBroker', () => {
  describe('the ids it returns', () => {
    it('VALID: {context} => returns the guild id, slug and the MIDDLE quest id the server minted', async () => {
      const proxy = recipesGuildWithThreeQuestsBrokerProxy();
      proxy.laneAnswers({
        apiBaseUrl: ContentTextStub({ value: API }),
        guild: GuildStub({
          id: GUILD_ID,
          name: 'Siege Guild',
          path: GUILD_PATH,
          urlSlug: 'siege-guild',
        }),
        questIds: MINTED_QUEST_IDS.map((value) => ContentTextStub({ value })),
      });

      const result = await recipesGuildWithThreeQuestsBroker({
        context: RecipeContextStub({ apiBaseUrl: API, homePath: HOME }),
      });

      expect(result).toStrictEqual({
        guildId: GUILD_ID,
        guildSlug: 'siege-guild',
        questId: IN_PROGRESS_QUEST_ID,
      });
    });
  });

  describe('what it asks the app to do', () => {
    it('VALID: {context} => one guild POST, three quest POSTs, seven PATCHes, in that order', async () => {
      const proxy = recipesGuildWithThreeQuestsBrokerProxy();
      proxy.laneAnswers({
        apiBaseUrl: ContentTextStub({ value: API }),
        guild: GuildStub({
          id: GUILD_ID,
          name: 'Siege Guild',
          path: GUILD_PATH,
          urlSlug: 'siege-guild',
        }),
        questIds: MINTED_QUEST_IDS.map((value) => ContentTextStub({ value })),
      });

      await recipesGuildWithThreeQuestsBroker({
        context: RecipeContextStub({ apiBaseUrl: API, homePath: HOME }),
      });

      const questUrl = `${API}/api/quests/${IN_PROGRESS_QUEST_ID}`;

      expect(proxy.requestLines()).toStrictEqual([
        `POST ${API}/api/guilds`,
        `POST ${API}/api/quests`,
        `POST ${API}/api/quests`,
        `POST ${API}/api/quests`,
        `PATCH ${questUrl}`,
        `PATCH ${questUrl}`,
        `PATCH ${questUrl}`,
        `PATCH ${questUrl}`,
        `PATCH ${questUrl}`,
        `PATCH ${questUrl}`,
        `PATCH ${questUrl}`,
      ]);
    });

    it('VALID: {context} => the guild POST and the three quest POSTs carry their exact bodies', async () => {
      const proxy = recipesGuildWithThreeQuestsBrokerProxy();
      proxy.laneAnswers({
        apiBaseUrl: ContentTextStub({ value: API }),
        guild: GuildStub({
          id: GUILD_ID,
          name: 'Siege Guild',
          path: GUILD_PATH,
          urlSlug: 'siege-guild',
        }),
        questIds: MINTED_QUEST_IDS.map((value) => ContentTextStub({ value })),
      });

      await recipesGuildWithThreeQuestsBroker({
        context: RecipeContextStub({ apiBaseUrl: API, homePath: HOME }),
      });

      expect(proxy.requestBodies().slice(0, 4)).toStrictEqual([
        { name: 'Siege Guild', path: GUILD_PATH },
        { guildId: GUILD_ID, title: 'Siege quest one — untouched', userRequest: USER_REQUEST },
        { guildId: GUILD_ID, title: 'Siege quest two — in progress', userRequest: USER_REQUEST },
        { guildId: GUILD_ID, title: 'Siege quest three — untouched', userRequest: USER_REQUEST },
      ]);
    });

    it('VALID: {context} => the seven PATCH bodies walk created to in_progress, flows on the review_flows edge alone', async () => {
      const proxy = recipesGuildWithThreeQuestsBrokerProxy();
      proxy.laneAnswers({
        apiBaseUrl: ContentTextStub({ value: API }),
        guild: GuildStub({
          id: GUILD_ID,
          name: 'Siege Guild',
          path: GUILD_PATH,
          urlSlug: 'siege-guild',
        }),
        questIds: MINTED_QUEST_IDS.map((value) => ContentTextStub({ value })),
      });

      await recipesGuildWithThreeQuestsBroker({
        context: RecipeContextStub({ apiBaseUrl: API, homePath: HOME }),
      });

      expect(proxy.requestBodies().slice(4)).toStrictEqual([
        { questId: IN_PROGRESS_QUEST_ID, status: 'explore_flows' },
        {
          questId: IN_PROGRESS_QUEST_ID,
          status: 'review_flows',
          flows: [
            {
              id: 'siege-flow',
              name: 'Siege Flow',
              flowType: 'runtime',
              entryPoint: 'start',
              exitPoints: ['end'],
              nodes: [
                {
                  id: 'start',
                  label: 'Start',
                  type: 'state',
                  packages: ['siege-fixture-service'],
                  observables: [],
                },
                {
                  id: 'end',
                  label: 'End',
                  type: 'terminal',
                  packages: ['siege-fixture-service'],
                  observables: [],
                },
              ],
              edges: [{ id: 'start-to-end', from: 'start', to: 'end' }],
            },
          ],
          packagesAffected: [
            {
              name: 'siege-fixture-service',
              location: './packages/siege-fixture-service',
              changeType: 'new',
              packageType: 'library',
              usedBy: ['siege-fixture-consumer'],
            },
          ],
        },
        { questId: IN_PROGRESS_QUEST_ID, status: 'flows_approved' },
        { questId: IN_PROGRESS_QUEST_ID, status: 'explore_observables' },
        { questId: IN_PROGRESS_QUEST_ID, status: 'review_observables' },
        { questId: IN_PROGRESS_QUEST_ID, status: 'approved' },
        { questId: IN_PROGRESS_QUEST_ID, status: 'in_progress' },
      ]);
    });
  });

  describe('refusals', () => {
    it('ERROR: {guild answered with no urlSlug} => throws naming the guild id', async () => {
      const proxy = recipesGuildWithThreeQuestsBrokerProxy();
      proxy.guildAnswers({
        apiBaseUrl: ContentTextStub({ value: API }),
        guild: {
          id: GUILD_ID,
          name: 'Siege Guild',
          path: GUILD_PATH,
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      });

      await expect(
        recipesGuildWithThreeQuestsBroker({
          context: RecipeContextStub({ apiBaseUrl: API, homePath: HOME }),
        }),
      ).rejects.toThrow(
        new RegExp(`answered a guild with no urlSlug.*Guild id: ${GUILD_ID}`, 'su'),
      );
    });

    it('ERROR: {a PATCH answered success: false} => throws naming the status and the reason', async () => {
      const proxy = recipesGuildWithThreeQuestsBrokerProxy();
      proxy.laneAnswers({
        apiBaseUrl: ContentTextStub({ value: API }),
        guild: GuildStub({
          id: GUILD_ID,
          name: 'Siege Guild',
          path: GUILD_PATH,
          urlSlug: 'siege-guild',
        }),
        questIds: MINTED_QUEST_IDS.map((value) => ContentTextStub({ value })),
      });
      proxy.patchRefuses({
        apiBaseUrl: ContentTextStub({ value: API }),
        questId: ContentTextStub({ value: IN_PROGRESS_QUEST_ID }),
        error: ContentTextStub({ value: 'Invalid status transition: created -> explore_flows' }),
      });

      await expect(
        recipesGuildWithThreeQuestsBroker({
          context: RecipeContextStub({ apiBaseUrl: API, homePath: HOME }),
        }),
      ).rejects.toThrow(
        `guild-with-three-quests: PATCH to status "explore_flows" on quest ${IN_PROGRESS_QUEST_ID} was refused: Invalid status transition: created -> explore_flows`,
      );
    });
  });
});
