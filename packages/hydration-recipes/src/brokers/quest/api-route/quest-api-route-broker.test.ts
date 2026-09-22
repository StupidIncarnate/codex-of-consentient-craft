import { questApiRouteBroker } from './quest-api-route-broker';
import { questApiRouteBrokerProxy } from './quest-api-route-broker.proxy';
import { DmTargetStub } from '../../../contracts/dm-target/dm-target.stub';
import { DmHttpResponseStub } from '../../../contracts/dm-http-response/dm-http-response.stub';
import {
  GetQuestInputStub,
  GetQuestResultStub,
  ModifyQuestInputStub,
  ModifyQuestResultStub,
  QuestStub,
} from '@dungeonmaster/shared/contracts';

const GUILD_ID = '11111111-1111-4111-8111-111111111111';

describe('questApiRouteBroker', () => {
  describe('a minimal quest', () => {
    it('VALID: {guildId, title, userRequest} => posts exactly those three fields to /api/quests', async () => {
      const proxy = questApiRouteBrokerProxy();
      const target = DmTargetStub({ baseUrl: 'http://app.in-process' });
      const postResponse = DmHttpResponseStub({
        status: 201,
        body: { success: true, questId: 'add-auth' },
      });
      const createdQuest = QuestStub({ id: 'add-auth', status: 'created' });
      const getResponse = DmHttpResponseStub({
        status: 200,
        body: { success: true, quest: createdQuest },
      });
      proxy.succeeds({ url: 'http://app.in-process/api/quests', response: postResponse });
      proxy.succeeds({ url: 'http://app.in-process/api/quests/add-auth', response: getResponse });

      const result = await questApiRouteBroker({
        target,
        fields: {
          guildId: GUILD_ID,
          title: 'Add Auth',
          userRequest: 'seeded quest 1',
          status: 'created',
        },
      });

      expect(result).toStrictEqual(createdQuest);
    });
  });

  describe('a non-success status', () => {
    it('ERROR: {the server answers 500} => throws naming the url and the status', async () => {
      const proxy = questApiRouteBrokerProxy();
      const target = DmTargetStub({ baseUrl: 'http://app.in-process' });
      const response = DmHttpResponseStub({ status: 500, body: { error: 'database unavailable' } });
      proxy.succeeds({ url: 'http://app.in-process/api/quests', response });

      await expect(
        questApiRouteBroker({
          target,
          fields: {
            guildId: GUILD_ID,
            title: 'Add Auth',
            userRequest: 'seeded quest 1',
            status: 'created',
          },
        }),
      ).rejects.toThrow('http://app.in-process/api/quests answered 500');
    });
  });

  // `POST /api/quests` always mints `created` (quest-create-broker.ts) and never reads
  // `fields.status` off the wire, so a caller asking for a different status is walked there through
  // questReachRouteBroker AFTER the create+reload round trip lands — the real CLI's own routing,
  // via `routeSelectTransformer`, picks THIS route the instant `target.baseUrl` is set, which is
  // exactly the case these two describe blocks cover.
  describe('a status other than created, on a target the api route can walk', () => {
    it('VALID: {status: "explore_flows"} => walks there through questReachRouteBroker and returns the walked record', async () => {
      const proxy = questApiRouteBrokerProxy();
      const target = DmTargetStub({ baseUrl: 'http://app.in-process' });
      const postResponse = DmHttpResponseStub({
        status: 201,
        body: { success: true, questId: 'add-auth' },
      });
      const getResponse = DmHttpResponseStub({
        status: 200,
        body: { success: true, quest: QuestStub({ id: 'add-auth', status: 'created' }) },
      });
      proxy.succeeds({ url: 'http://app.in-process/api/quests', response: postResponse });
      proxy.succeeds({ url: 'http://app.in-process/api/quests/add-auth', response: getResponse });
      proxy.succeedsWalkHop({
        input: ModifyQuestInputStub({ questId: 'add-auth', status: 'explore_flows' }),
        result: ModifyQuestResultStub({ success: true }),
      });
      const walkedQuest = QuestStub({ id: 'add-auth', status: 'explore_flows' });
      proxy.succeedsWalkReload({
        input: GetQuestInputStub({ questId: 'add-auth' }),
        result: GetQuestResultStub({ success: true, quest: walkedQuest }),
      });

      const result = await questApiRouteBroker({
        target,
        fields: {
          guildId: GUILD_ID,
          title: 'Add Auth',
          userRequest: 'seeded quest 1',
          status: 'explore_flows',
        },
      });

      expect(result).toStrictEqual(walkedQuest);
    });
  });

  describe('a status other than created, on a target a real gate refuses', () => {
    it('ERROR: {status: "explore_flows", the gate refuses the hop} => throws questReachRouteBroker\'s own named error, never silently created', async () => {
      const proxy = questApiRouteBrokerProxy();
      const target = DmTargetStub({ baseUrl: 'http://app.in-process' });
      const postResponse = DmHttpResponseStub({
        status: 201,
        body: { success: true, questId: 'add-auth' },
      });
      const getResponse = DmHttpResponseStub({
        status: 200,
        body: { success: true, quest: QuestStub({ id: 'add-auth', status: 'created' }) },
      });
      proxy.succeeds({ url: 'http://app.in-process/api/quests', response: postResponse });
      proxy.succeeds({ url: 'http://app.in-process/api/quests/add-auth', response: getResponse });
      proxy.succeedsWalkHop({
        input: ModifyQuestInputStub({ questId: 'add-auth', status: 'explore_flows' }),
        result: ModifyQuestResultStub({
          success: false,
          error: 'Missing required content for transition to explore_flows',
        }),
      });

      await expect(
        questApiRouteBroker({
          target,
          fields: {
            guildId: GUILD_ID,
            title: 'Add Auth',
            userRequest: 'seeded quest 1',
            status: 'explore_flows',
          },
        }),
      ).rejects.toThrow(
        /^questReachRouteBroker: could not reach "explore_flows" — Missing required content for transition to explore_flows$/u,
      );
    });
  });
});
