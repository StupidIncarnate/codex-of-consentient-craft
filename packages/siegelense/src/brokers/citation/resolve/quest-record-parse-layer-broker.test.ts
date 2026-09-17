import { AbsoluteFilePathStub, FileContentsStub, QuestStub } from '@dungeonmaster/shared/contracts';

import { InstanceIdStub } from '../../../contracts/instance-id/instance-id.stub';
import { questRecordParseLayerBroker } from './quest-record-parse-layer-broker';
import { questRecordParseLayerBrokerProxy } from './quest-record-parse-layer-broker.proxy';

const QUEST_FILE = '/home/user/.dungeonmaster/guilds/g1/quests/add-auth/quest.json';
const INSTANCE = 'inst_9b2c0001';

describe('questRecordParseLayerBroker', () => {
  describe('a real quest record', () => {
    it('VALID: {a serialised quest} => the parsed quest and no reason to refuse', () => {
      questRecordParseLayerBrokerProxy();

      const result = questRecordParseLayerBroker({
        contents: FileContentsStub({ value: JSON.stringify(QuestStub({ status: 'in_progress' })) }),
        questFilePath: AbsoluteFilePathStub({ value: QUEST_FILE }),
        instanceId: InstanceIdStub({ value: INSTANCE }),
      });

      expect(result).toStrictEqual({
        quest: QuestStub({ status: 'in_progress' }),
        blocked: null,
      });
    });
  });

  describe('bytes that are not JSON', () => {
    it('ERROR: {"{ not json"} => no quest, and a sentence naming the path and the thrown class', () => {
      questRecordParseLayerBrokerProxy();

      const result = questRecordParseLayerBroker({
        contents: FileContentsStub({ value: '{ not json' }),
        questFilePath: AbsoluteFilePathStub({ value: QUEST_FILE }),
        instanceId: InstanceIdStub({ value: INSTANCE }),
      });

      const expectedOpening =
        `the quest record at ${QUEST_FILE} is not readable JSON, so whether it still cites ` +
        'inst_9b2c0001 cannot be established: SyntaxError';

      expect(result).toStrictEqual({
        quest: null,
        blocked: expect.stringMatching(
          new RegExp(`^${expectedOpening.replace(/[.*+?^${}()|[\]\\/]/gu, '\\$&')}`, 'u'),
        ),
      });
    });
  });

  describe('JSON that is not a quest', () => {
    it("ERROR: {a bare id} => no quest, and the contract's own complaint rides the sentence", () => {
      questRecordParseLayerBrokerProxy();

      const result = questRecordParseLayerBroker({
        contents: FileContentsStub({ value: JSON.stringify({ id: 'add-auth' }) }),
        questFilePath: AbsoluteFilePathStub({ value: QUEST_FILE }),
        instanceId: InstanceIdStub({ value: INSTANCE }),
      });

      expect(result).toStrictEqual({
        quest: null,
        blocked:
          `the quest record at ${QUEST_FILE} did not parse, so whether it still cites ` +
          'inst_9b2c0001 cannot be established: Required; Required; Required; Required; Required',
      });
    });
  });
});
