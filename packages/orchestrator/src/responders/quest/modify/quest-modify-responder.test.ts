import { ModifyQuestInputStub } from '../../../contracts/modify-quest-input/modify-quest-input.stub';
import { QuestModifyResponderProxy } from './quest-modify-responder.proxy';

describe('QuestModifyResponder', () => {
  describe('failed modification', () => {
    it('ERROR: {quest not found} => returns failure result without emitting event', async () => {
      const proxy = QuestModifyResponderProxy();
      const eventCapture = proxy.setupEventCapture();
      proxy.setupQuestModifyEmpty();

      const input = ModifyQuestInputStub({ questId: 'nonexistent-quest' });

      const result = await proxy.callResponder({
        questId: 'nonexistent-quest',
        input,
      });

      expect(result.success).toBe(false);
      expect(eventCapture.getEmittedEvents()).toStrictEqual([]);
    });
  });
});
