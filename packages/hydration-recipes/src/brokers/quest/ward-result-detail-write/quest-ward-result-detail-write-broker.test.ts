import { questWardResultDetailWriteBroker } from './quest-ward-result-detail-write-broker';
import { questWardResultDetailWriteBrokerProxy } from './quest-ward-result-detail-write-broker.proxy';
import { DmTargetStub } from '../../../contracts/dm-target/dm-target.stub';
import { GuildListItemStub, QuestStub } from '@dungeonmaster/shared/contracts';

const GUILD_ID = '11111111-1111-4111-8111-111111111111';
const WARD_RESULT_ID = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

describe('questWardResultDetailWriteBroker', () => {
  describe('a real ward result id and detail blob', () => {
    it('VALID: {args: {wardResultId, detail}} => writes ward-results/<id>.json with the detail', async () => {
      const proxy = questWardResultDetailWriteBrokerProxy();
      const target = DmTargetStub({ home: '/tmp/dm-home', claudeHome: '/tmp/dm-home' });
      const quest = QuestStub({ id: 'add-auth', folder: 'add-auth' });
      const wardResultFilePath = `/tmp/dm-home/guilds/${GUILD_ID}/quests/add-auth/ward-results/${WARD_RESULT_ID}.json`;
      proxy.succeeds({ guild: GuildListItemStub({ id: GUILD_ID }), quest, wardResultFilePath });

      const result = await questWardResultDetailWriteBroker({
        target,
        record: quest,
        args: { wardResultId: WARD_RESULT_ID, detail: { testFailures: [] } },
      });

      expect(result).toStrictEqual({ success: true });
      expect(proxy.getWrittenContents({ wardResultFilePath })).toBe('{"testFailures":[]}');
    });
  });
});
