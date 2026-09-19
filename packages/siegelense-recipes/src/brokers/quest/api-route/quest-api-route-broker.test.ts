import { questApiRouteBroker } from './quest-api-route-broker';
import { questApiRouteBrokerProxy } from './quest-api-route-broker.proxy';
import { DmTargetStub } from '../../../contracts/dm-target/dm-target.stub';
import { DmHttpResponseStub } from '../../../contracts/dm-http-response/dm-http-response.stub';
import { QuestStub } from '@dungeonmaster/shared/contracts';

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
      const getResponse = DmHttpResponseStub({
        status: 200,
        body: { success: true, quest: QuestStub({ id: 'add-auth' }) },
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

      expect(result).toStrictEqual(QuestStub({ id: 'add-auth' }));
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
});
