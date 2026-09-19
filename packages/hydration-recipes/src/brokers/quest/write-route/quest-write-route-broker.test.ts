import { questWriteRouteBroker } from './quest-write-route-broker';
import { questWriteRouteBrokerProxy } from './quest-write-route-broker.proxy';
import { DmTargetStub } from '../../../contracts/dm-target/dm-target.stub';

const GUILD_ID = '11111111-1111-4111-8111-111111111111';

describe('questWriteRouteBroker', () => {
  describe('a minimal quest', () => {
    it('VALID: {title, userRequest, status, guildId} => returns a full quest record with a minted id, folder and createdAt', async () => {
      const proxy = questWriteRouteBrokerProxy();
      const target = DmTargetStub({ home: '/tmp/dm-home', claudeHome: '/tmp/dm-home' });
      const questFilePath = `/tmp/dm-home/guilds/${GUILD_ID}/quests/${proxy.mintedQuestId}/quest.json`;
      proxy.succeeds({ questFilePath, outboxPath: '/tmp/dm-home/event-outbox.jsonl' });

      const result = await questWriteRouteBroker({
        target,
        fields: {
          title: 'Add Auth',
          userRequest: 'seeded quest 1',
          status: 'created',
          guildId: GUILD_ID,
        },
      });

      expect(result).toStrictEqual({
        id: proxy.mintedQuestId,
        folder: proxy.mintedQuestId,
        title: 'Add Auth',
        status: 'created',
        questType: 'feature',
        createdAt: proxy.mintedCreatedAt,
        designDecisions: [],
        operations: [],
        toolingRequirements: [],
        packagesAffected: [],
        packageGraph: [],
        contracts: [],
        flows: [],
        comments: [],
        needsDesign: false,
        userRequest: 'seeded quest 1',
        workItems: [],
        wardResults: [],
        riftcarverResults: [],
        sessions: [],
        planningNotes: { blightLedger: [], questNotes: [], operationPlans: [] },
      });
    });
  });
});
