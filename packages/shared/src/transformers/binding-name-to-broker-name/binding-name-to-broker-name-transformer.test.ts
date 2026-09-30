import { bindingNameToBrokerNameTransformer } from './binding-name-to-broker-name-transformer';

describe('bindingNameToBrokerNameTransformer', () => {
  describe('standard use- prefix bindings', () => {
    it('VALID: {bindingName: use-quest-chat} => returns quest-chat-broker', () => {
      const result = bindingNameToBrokerNameTransformer({
        bindingName: 'use-quest-chat',
      });

      expect(result).toBe('quest-chat-broker');
    });

    it('VALID: {bindingName: use-quests} => returns quests-broker', () => {
      const result = bindingNameToBrokerNameTransformer({
        bindingName: 'use-quests',
      });

      expect(result).toBe('quests-broker');
    });

    it('VALID: {bindingName: use-guild-detail} => returns guild-detail-broker', () => {
      const result = bindingNameToBrokerNameTransformer({
        bindingName: 'use-guild-detail',
      });

      expect(result).toBe('guild-detail-broker');
    });
  });

  describe('binding with -binding suffix', () => {
    it('VALID: {bindingName: use-quest-chat-binding} => strips both affixes', () => {
      const result = bindingNameToBrokerNameTransformer({
        bindingName: 'use-quest-chat-binding',
      });

      expect(result).toBe('quest-chat-broker');
    });
  });

  describe('no prefix', () => {
    it('VALID: {bindingName: quest-list} => returns quest-list-broker', () => {
      const result = bindingNameToBrokerNameTransformer({
        bindingName: 'quest-list',
      });

      expect(result).toBe('quest-list-broker');
    });
  });
});
