import { toggleTestIdContract } from './toggle-test-id-contract';
import { ToggleTestIdStub } from './toggle-test-id.stub';

describe('toggleTestIdContract', () => {
  describe('valid inputs', () => {
    it('VALID: {value: SUBAGENT_CHAIN_SHOW_EARLIER_TOGGLE} => parses', () => {
      expect(toggleTestIdContract.parse('SUBAGENT_CHAIN_SHOW_EARLIER_TOGGLE')).toBe(
        'SUBAGENT_CHAIN_SHOW_EARLIER_TOGGLE',
      );
    });

    it('VALID: {value: CHAT_LIST_SHOW_EARLIER_TOGGLE} => parses', () => {
      expect(toggleTestIdContract.parse('CHAT_LIST_SHOW_EARLIER_TOGGLE')).toBe(
        'CHAT_LIST_SHOW_EARLIER_TOGGLE',
      );
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {value: arbitrary string} => throws', () => {
      expect(() => toggleTestIdContract.parse('OTHER_TOGGLE')).toThrow(/Invalid enum value/u);
    });
  });

  describe('stub', () => {
    it('VALID: {default} => returns SUBAGENT_CHAIN_SHOW_EARLIER_TOGGLE', () => {
      expect(ToggleTestIdStub()).toBe('SUBAGENT_CHAIN_SHOW_EARLIER_TOGGLE');
    });

    it('VALID: {value: CHAT_LIST_SHOW_EARLIER_TOGGLE} => returns CHAT_LIST_SHOW_EARLIER_TOGGLE', () => {
      expect(ToggleTestIdStub({ value: 'CHAT_LIST_SHOW_EARLIER_TOGGLE' })).toBe(
        'CHAT_LIST_SHOW_EARLIER_TOGGLE',
      );
    });
  });
});
