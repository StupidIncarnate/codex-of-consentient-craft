import { QuestCommentStub, QuestStub } from '@dungeonmaster/shared/contracts';

import { agentQuestPayloadContract } from './agent-quest-payload-contract';
import { AgentQuestPayloadStub } from './agent-quest-payload.stub';

describe('agentQuestPayloadContract', () => {
  describe('valid payloads', () => {
    it('VALID: {quest carrying comments} => parses with the comments key entirely absent from quest', () => {
      const quest = QuestStub({ comments: [QuestCommentStub()] });
      const payload = AgentQuestPayloadStub({ quest });
      // Mutate quest only AFTER it fed the stub above — the stub's own parse already produced an
      // independent `payload.quest`, so deleting `comments` here shapes the expectation without
      // touching what the stub already returned.
      Reflect.deleteProperty(quest, 'comments');

      const result = agentQuestPayloadContract.parse(payload);

      expect(result).toStrictEqual({ success: true, quest });
    });

    it('VALID: {quest with no comments} => parses with quest otherwise unchanged', () => {
      const quest = QuestStub({ comments: [] });
      const payload = AgentQuestPayloadStub({ quest });
      Reflect.deleteProperty(quest, 'comments');

      const result = agentQuestPayloadContract.parse(payload);

      expect(result).toStrictEqual({ success: true, quest });
    });

    it('VALID: {success: false, error, no quest} => parses with error preserved and quest omitted', () => {
      const payload = AgentQuestPayloadStub({ success: false, error: 'Quest not found' });

      const result = agentQuestPayloadContract.parse(payload);

      expect(result).toStrictEqual({ success: false, error: 'Quest not found' });
    });

    it('EMPTY: {success: false, no quest, no error} => parses with only success present', () => {
      const payload = AgentQuestPayloadStub({ success: false });

      const result = agentQuestPayloadContract.parse(payload);

      expect(result).toStrictEqual({ success: false });
    });
  });

  describe('invalid payloads', () => {
    it('INVALID: {missing success} => throws Required', () => {
      expect(() => agentQuestPayloadContract.parse({ quest: QuestStub() })).toThrow(/Required/u);
    });

    it('INVALID: {success: "yes"} => throws Expected boolean error', () => {
      expect(() => agentQuestPayloadContract.parse({ success: 'yes' })).toThrow(
        /Expected boolean/u,
      );
    });
  });
});
