import { ModifyQuestInputStub } from '../../../contracts/modify-quest-input/modify-quest-input.stub';
import { QuestModifyResponderProxy } from './quest-modify-responder.proxy';

describe('QuestModifyResponder', () => {
  describe('failed modification', () => {
    it('ERROR: {quest not found} => returns failure result', async () => {
      const proxy = QuestModifyResponderProxy();
      proxy.setupQuestModifyEmpty();

      const input = ModifyQuestInputStub({ questId: 'nonexistent-quest' });

      const result = await proxy.callResponder({
        questId: 'nonexistent-quest',
        input,
      });

      expect(result.success).toBe(false);
    });
  });
});
